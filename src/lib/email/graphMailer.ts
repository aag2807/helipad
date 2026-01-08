import { getGraphAppAccessToken } from "./graphToken";
import { withRetry } from "./retry";
import type { SendMailInput, IMailer } from "./types";

export class GraphMailer implements IMailer {
  private sender: string;

  constructor(sender?: string) {
    this.sender = sender || process.env.MAILBOX_SENDER || "helipuerto@grupovelutini.com";
  }

  async sendMail({ to, subject, htmlBody }: SendMailInput): Promise<void> {
    const token = await getGraphAppAccessToken();
    const url = `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(this.sender)}/sendMail`;

    const payload = {
      message: {
        subject,
        body: { contentType: "HTML", content: htmlBody },
        toRecipients: to.map((address) => ({ emailAddress: { address } })),
      },
      saveToSentItems: true,
    };

    await withRetry(async () => {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        // Treat throttling and 5xx as transient errors (will retry)
        if (res.status === 429 || (res.status >= 500 && res.status <= 599)) {
          throw new Error(`Transient Graph error: HTTP ${res.status} - ${text}`);
        }
        // Permanent errors (4xx other than 429)
        throw new Error(`Graph sendMail failed: HTTP ${res.status} - ${text}`);
      }
    });
  }
}
