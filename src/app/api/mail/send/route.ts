import { NextResponse } from "next/server";
import { sendEmail } from "@/server/services/email";
import { assertValidSendMailPayload } from "@/lib/email/validate";
import { getSession } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    // Authentication/Authorization check
    // Require a valid admin session
    const session = await getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Restrict to admin users only
    if (session.user.role !== "admin") {
      return NextResponse.json(
        { ok: false, error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const body = await req.json();
    assertValidSendMailPayload(body);

    // Send email using the service
    const success = await sendEmail({
      to: body.to[0], // Our service expects a single recipient
      subject: body.subject,
      html: body.htmlBody,
      userId: session.user.id,
      type: "confirmation", // Default type, can be extended
    });

    if (!success) {
      throw new Error("Failed to send email");
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: any) {
    // Logging seguro (sin secretos)
    console.error("mail/send error:", { message: err?.message });
    return NextResponse.json(
      { ok: false, error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
