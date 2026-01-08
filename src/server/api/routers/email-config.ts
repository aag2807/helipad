import { z } from "zod";
import { createTRPCRouter, adminProcedure } from "@/server/api/trpc";
import { emailConfigurations } from "@/server/db/schema";
import { eq } from "drizzle-orm";

export const emailConfigRouter = createTRPCRouter({
  // Get current email configuration
  getCurrent: adminProcedure.query(async ({ ctx }) => {
    const config = await ctx.db.query.emailConfigurations.findFirst({
      where: eq(emailConfigurations.isActive, true),
    });

    return config;
  }),

  // Get all configurations
  getAll: adminProcedure.query(async ({ ctx }) => {
    const configs = await ctx.db.query.emailConfigurations.findMany({
      orderBy: (emailConfigurations, { desc }) => [
        desc(emailConfigurations.isActive),
        desc(emailConfigurations.updatedAt),
      ],
    });

    return configs;
  }),

  // Update email configuration
  update: adminProcedure
    .input(
      z.object({
        id: z.string(),
        provider: z.enum(["smtp", "resend"]),
        smtpHost: z.string().optional(),
        smtpPort: z.number().int().min(1).max(65535).optional(),
        smtpSecure: z.boolean().optional(),
        smtpUser: z.string().optional(),
        smtpPassword: z.string().optional(),
        fromEmail: z.string().email(),
        fromName: z.string().min(1),
        resendApiKey: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // Update the configuration
      await ctx.db
        .update(emailConfigurations)
        .set({
          ...updateData,
          updatedAt: new Date(),
        })
        .where(eq(emailConfigurations.id, id));

      return { success: true };
    }),

  // Create new email configuration
  create: adminProcedure
    .input(
      z.object({
        provider: z.enum(["smtp", "resend"]),
        smtpHost: z.string().optional(),
        smtpPort: z.number().int().min(1).max(65535).optional(),
        smtpSecure: z.boolean().optional(),
        smtpUser: z.string().optional(),
        smtpPassword: z.string().optional(),
        fromEmail: z.string().email(),
        fromName: z.string().min(1),
        resendApiKey: z.string().optional(),
        isActive: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // If setting as active, deactivate all others
      if (input.isActive) {
        await ctx.db
          .update(emailConfigurations)
          .set({ isActive: false })
          .where(eq(emailConfigurations.isActive, true));
      }

      const [newConfig] = await ctx.db
        .insert(emailConfigurations)
        .values(input)
        .returning();

      return newConfig;
    }),

  // Set active configuration
  setActive: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Deactivate all configurations
      await ctx.db
        .update(emailConfigurations)
        .set({ isActive: false })
        .where(eq(emailConfigurations.isActive, true));

      // Activate the selected one
      await ctx.db
        .update(emailConfigurations)
        .set({ isActive: true, updatedAt: new Date() })
        .where(eq(emailConfigurations.id, input.id));

      return { success: true };
    }),

  // Delete configuration
  delete: adminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check if it's the active one
      const config = await ctx.db.query.emailConfigurations.findFirst({
        where: eq(emailConfigurations.id, input.id),
      });

      if (config?.isActive) {
        throw new Error("Cannot delete active configuration");
      }

      await ctx.db
        .delete(emailConfigurations)
        .where(eq(emailConfigurations.id, input.id));

      return { success: true };
    }),

  // Test email configuration
  test: adminProcedure
    .input(
      z.object({
        toEmail: z.string().email(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Import email service
      const { sendEmail } = await import("@/server/services/email");

      const success = await sendEmail({
        to: input.toEmail,
        subject: "Test Email from Helipad Booking",
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>🚁 Test Email</h2>
            <p>This is a test email from your Helipad Booking system.</p>
            <p>If you received this, your email configuration is working correctly!</p>
            <p style="color: #666; font-size: 12px; margin-top: 20px;">
              Sent at: ${new Date().toLocaleString()}
            </p>
          </div>
        `,
        userId: ctx.session.user.id,
        type: "confirmation",
      });

      if (!success) {
        throw new Error("Failed to send test email. Check your configuration.");
      }

      return { success: true };
    }),
});
