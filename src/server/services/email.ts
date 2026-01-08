import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { db } from "@/server/db";
import { emailLogs, emailConfigurations } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { GraphMailer } from "@/lib/email/graphMailer";
import type { IMailer } from "@/lib/email/types";
import enTranslations from "@/lib/translations/en.json";
import esTranslations from "@/lib/translations/es.json";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || "Helipad Booking";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// Translation helper
const translations: Record<string, any> = {
  en: enTranslations,
  es: esTranslations,
};

function t(key: string, locale: string = "en", replacements?: Record<string, string>): string {
  const keys = key.split(".");
  let value: any = translations[locale] || translations.en;
  
  for (const k of keys) {
    value = value?.[k];
  }
  
  let result = value || key;
  
  // Replace {{variable}} placeholders
  if (replacements) {
    Object.entries(replacements).forEach(([k, v]) => {
      result = result.replace(new RegExp(`{{${k}}}`, "g"), v);
    });
  }
  
  return result;
}

let cachedTransporter: Transporter | null = null;
let cachedGraphMailer: GraphMailer | null = null;
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
async function getNodemailerTransporter(config: any): Promise<Transporter | null> {
  try {
    if (!config.smtpHost || !config.smtpPort || !config.smtpUser || !config.smtpPassword) {
      console.log("[Email] SMTP configuration incomplete");
      return null;
    }

    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpSecure ?? true,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPassword,
      },
    });

    console.log(`[Email] SMTP transporter created for ${config.smtpHost}`);
    return transporter;
  } catch (error) {
    console.error("[Email] Failed to create SMTP transporter:", error);
    return null;
  }
}

/**
 * Get mailer instance based on provider
 */
async function getMailer(): Promise<{ mailer: IMailer | Transporter | null; config: any; provider: string }> {
  try {
    const config = await getEmailConfig();

    if (!config) {
      console.log("[Email] No active email configuration found");
      return { mailer: null, config: null, provider: "none" };
    }

    // Check if config changed, if not return cached instance
    if (cachedConfig?.id === config.id) {
      if (config.provider === "msgraph" && cachedGraphMailer) {
        return { mailer: cachedGraphMailer, config, provider: "msgraph" };
      }
      if (config.provider === "smtp" && cachedTransporter) {
        return { mailer: cachedTransporter, config, provider: "smtp" };
      }
    }

    // Microsoft Graph provider
    if (config.provider === "msgraph") {
      const sender = config.mailboxSender || process.env.MAILBOX_SENDER;
      if (!sender) {
        console.error("[Email] Microsoft Graph provider requires MAILBOX_SENDER");
        return { mailer: null, config, provider: "msgraph" };
      }

      cachedGraphMailer = new GraphMailer(sender);
      cachedConfig = config;
      console.log(`[Email] Microsoft Graph mailer created for ${sender}`);
      return { mailer: cachedGraphMailer, config, provider: "msgraph" };
    }

    // SMTP provider
    if (config.provider === "smtp") {
      const transporter = await getNodemailerTransporter(config);
      if (transporter) {
        cachedTransporter = transporter;
        cachedConfig = config;
        return { mailer: transporter, config, provider: "smtp" };
      }
    }

    console.log("[Email] Unsupported email provider:", config.provider);
    return { mailer: null, config, provider: config.provider };
  } catch (error) {
    console.error("[Email] Failed to get mailer:", error);
    return { mailer: null, config: null, provider: "error" };
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
    const { mailer, config, provider } = await getMailer();

    // If no mailer configured, log and skip
    if (!mailer) {
      console.log(`[Email] Email service not configured. Would send to ${to}:`);
      console.log(`  Subject: ${subject}`);
      console.log(`  Type: ${type}`);
      await logEmail("sent"); // Log as sent for dev purposes
      return true;
    }

    // Microsoft Graph mailer
    if (provider === "msgraph" && mailer instanceof GraphMailer) {
      await mailer.sendMail({
        to: [to],
        subject,
        htmlBody: html,
      });

      console.log(`[Email] Sent ${type} email to ${to} via Microsoft Graph`);
      await logEmail("sent");
      return true;
    }

    // SMTP via nodemailer
    if (provider === "smtp" && "sendMail" in mailer && config) {
      const info = await (mailer as Transporter).sendMail({
        from: `"${config.fromName}" <${config.fromEmail}>`,
        to: to,
        subject: subject,
        html: html,
      });

      console.log(`[Email] Sent ${type} email to ${to} via SMTP. Message ID: ${info.messageId}`);
      await logEmail("sent");
      return true;
    }

    throw new Error(`Unsupported provider: ${provider}`);
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
  locale?: string; // Default to 'en' if not provided
}

export async function sendBookingConfirmation(data: BookingEmailData): Promise<boolean> {
  const locale = data.locale || "en";
  
  const content = `
    <h2 style="margin: 0 0 16px; color: #18181b; font-size: 20px;">${t("emails.bookingConfirmed", locale)} ✅</h2>
    <p style="margin: 0 0 24px; color: #52525b; font-size: 16px; line-height: 1.6;">
      ${t("emails.bookingConfirmedGreeting", locale, { userName: data.userName })}
    </p>
    
    <div style="background-color: #f4f4f5; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 8px 0;">
            <span style="color: #71717a; font-size: 14px;">📅 ${t("emails.date", locale)}</span><br>
            <span style="color: #18181b; font-size: 16px; font-weight: 600;">${data.date}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0;">
            <span style="color: #71717a; font-size: 14px;">🕐 ${t("emails.time", locale)}</span><br>
            <span style="color: #18181b; font-size: 16px; font-weight: 600;">${data.startTime} - ${data.endTime}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0;">
            <span style="color: #71717a; font-size: 14px;">📝 ${t("emails.purpose", locale)}</span><br>
            <span style="color: #18181b; font-size: 16px;">${data.purpose}</span>
          </td>
        </tr>
      </table>
    </div>
    
    <p style="margin: 0 0 24px; color: #52525b; font-size: 14px;">
      ${t("emails.needChanges", locale)}
    </p>
    
    <a href="${APP_URL}/bookings/my-bookings" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
      ${t("emails.viewMyBookings", locale)}
    </a>
  `;

  return sendEmail({
    to: data.userEmail,
    subject: `✅ ${t("emails.bookingConfirmed", locale)} - ${data.date}`,
    html: baseTemplate(content),
    userId: data.userId,
    bookingId: data.bookingId,
    type: "confirmation",
  });
}

export async function sendBookingCancellation(data: BookingEmailData): Promise<boolean> {
  const locale = data.locale || "en";
  
  const content = `
    <h2 style="margin: 0 0 16px; color: #18181b; font-size: 20px;">${t("emails.bookingCancelled", locale)}</h2>
    <p style="margin: 0 0 24px; color: #52525b; font-size: 16px; line-height: 1.6;">
      ${t("emails.bookingCancelledMessage", locale, { userName: data.userName })}
    </p>
    
    <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 8px 0;">
            <span style="color: #991b1b; font-size: 14px;">📅 ${t("emails.date", locale)}</span><br>
            <span style="color: #7f1d1d; font-size: 16px; font-weight: 600; text-decoration: line-through;">${data.date}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0;">
            <span style="color: #991b1b; font-size: 14px;">🕐 ${t("emails.time", locale)}</span><br>
            <span style="color: #7f1d1d; font-size: 16px; font-weight: 600; text-decoration: line-through;">${data.startTime} - ${data.endTime}</span>
          </td>
        </tr>
      </table>
    </div>
    
    <p style="margin: 0 0 24px; color: #52525b; font-size: 14px;">
      ${t("emails.timeslotAvailable", locale)}
    </p>
    
    <a href="${APP_URL}/bookings/calendar" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
      ${t("emails.bookNewSlot", locale)}
    </a>
  `;

  return sendEmail({
    to: data.userEmail,
    subject: `${t("emails.bookingCancelled", locale)} - ${data.date}`,
    html: baseTemplate(content),
    userId: data.userId,
    bookingId: data.bookingId,
    type: "cancellation",
  });
}

export async function sendBookingReminder(data: BookingEmailData): Promise<boolean> {
  const locale = data.locale || "en";
  
  const content = `
    <h2 style="margin: 0 0 16px; color: #18181b; font-size: 20px;">${t("emails.upcomingBookingReminder", locale)} 🔔</h2>
    <p style="margin: 0 0 24px; color: #52525b; font-size: 16px; line-height: 1.6;">
      ${t("emails.reminderMessage", locale, { userName: data.userName })}
    </p>
    
    <div style="background-color: #fef3c7; border: 1px solid #fcd34d; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding: 8px 0;">
            <span style="color: #92400e; font-size: 14px;">📅 ${t("emails.date", locale)}</span><br>
            <span style="color: #78350f; font-size: 16px; font-weight: 600;">${data.date}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0;">
            <span style="color: #92400e; font-size: 14px;">🕐 ${t("emails.time", locale)}</span><br>
            <span style="color: #78350f; font-size: 16px; font-weight: 600;">${data.startTime} - ${data.endTime}</span>
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0;">
            <span style="color: #92400e; font-size: 14px;">📝 ${t("emails.purpose", locale)}</span><br>
            <span style="color: #78350f; font-size: 16px;">${data.purpose}</span>
          </td>
        </tr>
      </table>
    </div>
    
    <a href="${APP_URL}/bookings/my-bookings" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
      ${t("emails.viewBookingDetails", locale)}
    </a>
  `;

  return sendEmail({
    to: data.userEmail,
    subject: `🔔 ${t("emails.upcomingBookingReminder", locale)} - ${data.date}`,
    html: baseTemplate(content),
    userId: data.userId,
    bookingId: data.bookingId,
    type: "reminder",
  });
}
