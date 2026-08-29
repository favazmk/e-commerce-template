import { EmailProvider, SendEmailOptions } from "./email-provider.interface";

export class ResendProvider implements EmailProvider {
  async sendEmail(options: SendEmailOptions): Promise<boolean> {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      if (process.env.NODE_ENV === "production") {
        throw new Error("RESEND_API_KEY is required in production environments.");
      }
      console.warn("RESEND_API_KEY is not set in development. Falling back to console log.");
      console.log(`[ResendProvider] 📧 Email to: ${options.to} | Subject: ${options.subject}`);
      return true;
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || "orders@auraluxury.com",
          to: options.to,
          subject: options.subject,
          html: options.html,
        }),
      });

      if (!response.ok) {
        console.error("Resend API error:", await response.text());
        return false;
      }
      return true;
    } catch (error) {
      console.error("Resend API fetch error:", error);
      return false;
    }
  }
}
