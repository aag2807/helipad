import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { db } from "@/server/db";
import { emailLogs, emailConfigurations } from "@/server/db/schema";
import { eq } from "drizzle-orm";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Helipad Booking";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

let cachedTransporter: Transporter | null = null;
let cachedConfig: any | null = null;

/**
 * Get email configuration from database
 */
async function getEmailConfig() {
  const config = await db.query.emailConfigurations.findFirst({
    where: eq(emailConfigurations.isActive, true),
  });

  return config;
}

/**
 * Create nodemailer transporter from configuration
 */
async function getTransporter(): Promise<Transporter | null> {
  try {
    const config = await getEmailConfig();

    if (!config) {
      console.log("[Email] No active email configuration found");
      return null;
    }

    // Check if config changed, if not return cached transporter
    if (cachedTransporter && cachedConfig?.id === config.id) {
      return cachedTransporter;
    }

    // SMTP configuration
    if (config.provider === "smtp") {
      if (!config.smtpHost || !config.smtpPort || !config.smtpUser || !config.smtpPassword) {
        console.log("[Email] SMTP configuration incomplete");
        return null;
      }

      cachedTransporter = nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpSecure ?? true, // true for 465, false for other ports
        auth: {
          user: config.smtpUser,
          pass: config.smtpPassword,
        },
      });

      cachedConfig = config;
      console.log(`[Email] SMTP transporter created for ${config.smtpHost}`);
      return cachedTransporter;
    }

    console.log("[Email] Unsupported email provider:", config.provider);
    return null;
  } catch (error) {
    console.error("[Email] Failed to create transporter:", error);
    return null;
  }
}

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  userId?: string;
  bookingId?: string;
  type: "confirmation" | "cancellation" | "reminder" | "password_reset";
}

export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  const { to, subject, html, userId, bookingId, type } = options;

  // Log the email attempt
  const logEmail = async (status: "sent" | "failed", error?: string) => {
    try {
      await db.insert(emailLogs).values({
        userId,
        bookingId,
        type,
        status,
        error,
      });
    } catch (e) {
      console.error("Failed to log email:", e);
    }
  };

  try {
    const transporter = await getTransporter();

    // If no transporter configured, log and skip
    if (!transporter) {
      console.log(`[Email] Email service not configured. Would send to ${to}:`);
      console.log(`  Subject: ${subject}`);
      console.log(`  Type: ${type}`);
      await logEmail("sent"); // Log as sent for dev purposes
      return true;
    }

    const config = await getEmailConfig();
    if (!config) {
      await logEmail("failed", "No email configuration found");
      return false;
    }

    const info = await transporter.sendMail({
      from: `"${config.fromName}" <${config.fromEmail}>`,
      to,
      subject,
      html,
    });

    console.log(`[Email] Sent ${type} email to ${to}. Message ID: ${info.messageId}`);
    await logEmail("sent");
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[Email] Exception:", errorMessage);
    await logEmail("failed", errorMessage);
    return false;
  }
}

// Email template helpers
function baseTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${APP_NAME}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f4f4f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%); padding: 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">🚁 ${APP_NAME}</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 24px 32px; text-align: center; border-top: 1px solid #e4e4e7;">
              <p style="margin: 0; color: #71717a; font-size: 14px;">
                ${APP_NAME} • <a href="${APP_URL}" style="color: #7c3aed; text-decoration: none;">Visit Dashboard</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

interface BookingEmailData {
  userName: string;
  userEmail: string;
  userId: string;
  bookingId: string;
  date: string;
  startTime: string;
  endTime: string;
  purpose: string;
}

export async function sendBookingConfirmation(data: BookingEmailData): Promise<boolean> {
  const content = `
    <h2 style="margin: 0 0 16px; color: #18181b; font-size: 20px;">Booking Confirmed! ✅</h2>
    <p style="margin: 0 0 24px; color: #52525b; font-size: 16px; line-height: 1.6;">
      Hi ${data.userName}, your helipad booking has been confirmed.
    </p>
    
    <div style="background-color: #f4f4f5; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 8px 0;">
            <span style="color: #71717a; font-size: 14px;">📅 Date</span><br>
            <span style="color: #18181b; font-size: 16px; font-weight: 600;">${data.date}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0;">
            <span style="color: #71717a; font-size: 14px;">🕐 Time</span><br>
            <span style="color: #18181b; font-size: 16px; font-weight: 600;">${data.startTime} - ${data.endTime}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0;">
            <span style="color: #71717a; font-size: 14px;">📝 Purpose</span><br>
            <span style="color: #18181b; font-size: 16px;">${data.purpose}</span>
          </td>
        </tr>
      </table>
    </div>
    
    <p style="margin: 0 0 24px; color: #52525b; font-size: 14px;">
      Need to make changes? You can manage your booking from your dashboard.
    </p>
    
    <a href="${APP_URL}/bookings/my-bookings" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
      View My Bookings
    </a>
  `;

  return sendEmail({
    to: data.userEmail,
    subject: `✅ Booking Confirmed - ${data.date}`,
    html: baseTemplate(content),
    userId: data.userId,
    bookingId: data.bookingId,
    type: "confirmation",
  });
}

export async function sendBookingCancellation(data: BookingEmailData): Promise<boolean> {
  const content = `
    <h2 style="margin: 0 0 16px; color: #18181b; font-size: 20px;">Booking Cancelled</h2>
    <p style="margin: 0 0 24px; color: #52525b; font-size: 16px; line-height: 1.6;">
      Hi ${data.userName}, your helipad booking has been cancelled.
    </p>
    
    <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 8px 0;">
            <span style="color: #991b1b; font-size: 14px;">📅 Date</span><br>
            <span style="color: #7f1d1d; font-size: 16px; font-weight: 600; text-decoration: line-through;">${data.date}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0;">
            <span style="color: #991b1b; font-size: 14px;">🕐 Time</span><br>
            <span style="color: #7f1d1d; font-size: 16px; font-weight: 600; text-decoration: line-through;">${data.startTime} - ${data.endTime}</span>
          </td>
        </tr>
      </table>
    </div>
    
    <p style="margin: 0 0 24px; color: #52525b; font-size: 14px;">
      This time slot is now available for others to book. If you need to make a new booking, visit your dashboard.
    </p>
    
    <a href="${APP_URL}/bookings/calendar" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
      Book New Slot
    </a>
  `;

  return sendEmail({
    to: data.userEmail,
    subject: `Booking Cancelled - ${data.date}`,
    html: baseTemplate(content),
    userId: data.userId,
    bookingId: data.bookingId,
    type: "cancellation",
  });
}

export async function sendBookingReminder(data: BookingEmailData): Promise<boolean> {
  const content = `
    <h2 style="margin: 0 0 16px; color: #18181b; font-size: 20px;">Reminder: Upcoming Booking 🔔</h2>
    <p style="margin: 0 0 24px; color: #52525b; font-size: 16px; line-height: 1.6;">
      Hi ${data.userName}, this is a reminder about your upcoming helipad booking.
    </p>
    
    <div style="background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 8px 0;">
            <span style="color: #92400e; font-size: 14px;">📅 Date</span><br>
            <span style="color: #78350f; font-size: 16px; font-weight: 600;">${data.date}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0;">
            <span style="color: #92400e; font-size: 14px;">🕐 Time</span><br>
            <span style="color: #78350f; font-size: 16px; font-weight: 600;">${data.startTime} - ${data.endTime}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0;">
            <span style="color: #92400e; font-size: 14px;">📝 Purpose</span><br>
            <span style="color: #78350f; font-size: 16px;">${data.purpose}</span>
          </td>
        </tr>
      </table>
    </div>
    
    <a href="${APP_URL}/bookings/my-bookings" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
      View Booking Details
    </a>
  `;

  return sendEmail({
    to: data.userEmail,
    subject: `🔔 Reminder: Booking Tomorrow - ${data.date}`,
    html: baseTemplate(content),
    userId: data.userId,
    bookingId: data.bookingId,
    type: "reminder",
  });
}
