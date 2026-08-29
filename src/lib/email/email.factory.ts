import { EmailProvider } from "./email-provider.interface";
import { MockEmailProvider } from "./mock.provider";
import { ResendProvider } from "./resend.provider";

export class EmailFactory {
  private static providers: Map<string, EmailProvider> = new Map();

  public static getProvider(name?: string): EmailProvider {
    const requestedName =
      (name || process.env.DEFAULT_EMAIL_PROVIDER || "mock").toLowerCase();

    if (!this.providers.has(requestedName)) {
      switch (requestedName) {
        case "resend":
          this.providers.set("resend", new ResendProvider());
          break;
        case "mock":
        default:
          this.providers.set("mock", new MockEmailProvider());
          break;
      }
    }
    return this.providers.get(requestedName)!;
  }
}
