import { EmailProvider } from "./email-provider.interface";
import { MockEmailProvider } from "./mock.provider";
import { ResendProvider } from "./resend.provider";

export class EmailFactory {
  private static providers: Map<string, EmailProvider> = new Map();

  /**
   * Resolve the configured email provider.
   *
   * Accepts EMAIL_PROVIDER (documented in .env.example) and the legacy
   * DEFAULT_EMAIL_PROVIDER name. "console" is an alias for the mock provider,
   * which logs instead of sending.
   */
  public static getProvider(name?: string): EmailProvider {
    const requested = (
      name ||
      process.env.EMAIL_PROVIDER ||
      process.env.DEFAULT_EMAIL_PROVIDER ||
      "console"
    ).toLowerCase();

    const key = requested === "resend" ? "resend" : "mock";

    if (key === "resend" && !process.env.RESEND_API_KEY) {
      // Fail loudly at configuration time rather than dropping every
      // transactional email in production (AGENTS.md section 6).
      throw new Error("EMAIL_PROVIDER=resend requires RESEND_API_KEY to be set");
    }

    if (!this.providers.has(key)) {
      this.providers.set(key, key === "resend" ? new ResendProvider() : new MockEmailProvider());
    }
    return this.providers.get(key)!;
  }

  /** Test helper: drop cached provider instances. */
  public static reset(): void {
    this.providers.clear();
  }
}
