import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

const JWT_SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "helipad-secret-change-in-production"
);

const COOKIE_NAME = "helipad-session";
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 30, // 30 days
  path: "/",
};

export type SessionUser = {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: "admin" | "security" | "user";
  isActive: boolean;
};

export type Session = {
  user: SessionUser;
};

/**
 * Create a JWT token for a user
 */
async function createToken(user: SessionUser): Promise<string> {
  return await new SignJWT({ user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(JWT_SECRET);
}

/**
 * Verify and decode a JWT token
 */
async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return (verified.payload.user as SessionUser) || null;
  } catch (error) {
    return null;
  }
}

/**
 * Get the current session
 */
export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  const user = await verifyToken(token);

  if (!user) {
    return null;
  }

  return { user };
}

/**
 * Get the current user (throws if not authenticated)
 */
export async function getCurrentUser(): Promise<SessionUser> {
  const session = await getSession();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  return session.user;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session?.user;
}

/**
 * Sign in a user with username and password
 */
export async function signIn(
  username: string,
  password: string
): Promise<{ success: boolean; error?: string; user?: SessionUser }> {
  try {
    // Find user by username
    const user = await db.query.users.findFirst({
      where: eq(users.username, username),
    });

    if (!user || !user.isActive) {
      return { success: false, error: "Invalid credentials" };
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return { success: false, error: "Invalid credentials" };
    }

    const sessionUser: SessionUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
    };

    // Create JWT token
    const token = await createToken(sessionUser);

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set(COOKIE_NAME, token, COOKIE_OPTIONS);

    return { success: true, user: sessionUser };
  } catch (error) {
    console.error("Sign in error:", error);
    return { success: false, error: "An error occurred during sign in" };
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Update the session with new user data
 */
export async function updateSession(user: SessionUser): Promise<void> {
  const token = await createToken(user);
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, COOKIE_OPTIONS);
}
