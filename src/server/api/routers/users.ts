import { z } from "zod";
import { createTRPCRouter, adminProcedure } from "../trpc";
import { users } from "@/server/db/schema";
import { eq, like, or, and, desc, asc, sql } from "drizzle-orm";
import bcrypt from "bcrypt";
import { TRPCError } from "@trpc/server";

export const usersRouter = createTRPCRouter({
  /**
   * List all users with search/filter/pagination
   */
  list: adminProcedure
    .input(
      z.object({
        search: z.string().optional(),
        role: z.enum(["admin", "user"]).optional(),
        isActive: z.boolean().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(10),
        sortBy: z.enum(["createdAt", "username", "email", "firstName"]).default("createdAt"),
        sortOrder: z.enum(["asc", "desc"]).default("desc"),
      })
    )
    .query(async ({ ctx, input }) => {
      const { search, role, isActive, page, limit, sortBy, sortOrder } = input;
      const offset = (page - 1) * limit;

      // Build where conditions
      const conditions = [];
      
      if (search) {
        conditions.push(
          or(
            like(users.username, `%${search}%`),
            like(users.email, `%${search}%`),
            like(users.firstName, `%${search}%`),
            like(users.lastName, `%${search}%`)
          )
        );
      }
      
      if (role) {
        conditions.push(eq(users.role, role));
      }
      
      if (isActive !== undefined) {
        conditions.push(eq(users.isActive, isActive));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const [{ count }] = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(whereClause);

      // Get users with pagination
      const orderFn = sortOrder === "desc" ? desc : asc;
      const orderColumn = users[sortBy];

      const usersList = await ctx.db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
          isActive: users.isActive,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(whereClause)
        .orderBy(orderFn(orderColumn))
        .limit(limit)
        .offset(offset);

      return {
        users: usersList,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
        },
      };
    }),

  /**
   * Get single user by ID
   */
  getById: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.query.users.findFirst({
        where: eq(users.id, input.id),
        columns: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      return user;
    }),

  /**
   * Create new user
   */
  create: adminProcedure
    .input(
      z.object({
        username: z.string().min(3).max(50),
        email: z.string().email(),
        password: z.string().min(8),
        firstName: z.string().min(1).max(50),
        lastName: z.string().min(1).max(50),
        role: z.enum(["admin", "user"]).default("user"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check for existing username/email
      const existing = await ctx.db.query.users.findFirst({
        where: or(
          eq(users.username, input.username),
          eq(users.email, input.email)
        ),
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: existing.username === input.username
            ? "Username already exists"
            : "Email already exists",
        });
      }

      const hashedPassword = await bcrypt.hash(input.password, 10);

      const [newUser] = await ctx.db
        .insert(users)
        .values({
          ...input,
          password: hashedPassword,
        })
        .returning({
          id: users.id,
          username: users.username,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
          isActive: users.isActive,
          createdAt: users.createdAt,
        });

      return newUser;
    }),

  /**
   * Update user
   */
  update: adminProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        username: z.string().min(3).max(50).optional(),
        email: z.string().email().optional(),
        firstName: z.string().min(1).max(50).optional(),
        lastName: z.string().min(1).max(50).optional(),
        role: z.enum(["admin", "user"]).optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // Check if user exists
      const existing = await ctx.db.query.users.findFirst({
        where: eq(users.id, id),
      });

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      // Check for username/email conflicts
      if (updateData.username || updateData.email) {
        const conflict = await ctx.db.query.users.findFirst({
          where: and(
            or(
              updateData.username ? eq(users.username, updateData.username) : undefined,
              updateData.email ? eq(users.email, updateData.email) : undefined
            ),
            sql`${users.id} != ${id}`
          ),
        });

        if (conflict) {
          throw new TRPCError({
            code: "CONFLICT",
            message: conflict.username === updateData.username
              ? "Username already exists"
              : "Email already exists",
          });
        }
      }

      const [updated] = await ctx.db
        .update(users)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id))
        .returning({
          id: users.id,
          username: users.username,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
          isActive: users.isActive,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        });

      return updated;
    }),

  /**
   * Delete user
   */
  delete: adminProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Prevent self-deletion
      if (ctx.session.user.id === input.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete your own account",
        });
      }

      const [deleted] = await ctx.db
        .delete(users)
        .where(eq(users.id, input.id))
        .returning({ id: users.id });

      if (!deleted) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      return { success: true };
    }),

  /**
   * Bulk update user status
   */
  bulkUpdateStatus: adminProcedure
    .input(
      z.object({
        ids: z.array(z.string().uuid()),
        isActive: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Prevent self-deactivation
      if (!input.isActive && input.ids.includes(ctx.session.user.id)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot deactivate your own account",
        });
      }

      const updated = await ctx.db
        .update(users)
        .set({ isActive: input.isActive, updatedAt: new Date() })
        .where(sql`${users.id} IN (${sql.join(input.ids.map(id => sql`${id}`), sql`, `)})`)
        .returning({ id: users.id });

      return { count: updated.length };
    }),
});

