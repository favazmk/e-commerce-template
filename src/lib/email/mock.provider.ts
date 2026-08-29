import { EmailProvider, SendEmailOptions } from "./email-provider.interface";

export class MockEmailProvider implements EmailProvider {
  async sendEmail(options: SendEmailOptions): Promise<boolean> {
    console.log(`[MockEmailProvider] 📧 Email sent to: ${options.to}`);
    console.log(`[MockEmailProvider] Subject: ${options.subject}`);
    return true;
  }
}
