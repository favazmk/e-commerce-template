import { IChangeLogRepository } from "../interfaces/changelog.repository.interface";
import { AdminChangeLogEntry } from "../../types/database";
import { SupabaseRepository } from "./base.repository";

export class SupabaseChangeLogRepository
  extends SupabaseRepository
  implements IChangeLogRepository
{
  /**
   * The change log names who changed what and embeds full record snapshots,
   * cost prices included. It carries no anon policy by design — every read and
   * write here sits behind requireAdmin().
   */
  private locked() {
    return this.serviceClient("no-anon-policy-by-design");
  }

  async record(
    entry: Omit<AdminChangeLogEntry, "id" | "created_at" | "reverted_at" | "reverted_by">
  ): Promise<AdminChangeLogEntry> {
    const { data, error } = await this.locked()
      .from("admin_change_log")
      .insert([
        {
          entity_type: entry.entity_type,
          entity_id: entry.entity_id,
          entity_label: entry.entity_label || "",
          action: entry.action,
          summary: entry.summary || "",
          before_state: entry.before_state ?? null,
          after_state: entry.after_state ?? null,
          actor_id: entry.actor_id ?? null,
          actor_email: entry.actor_email || "",
          is_revert: Boolean(entry.is_revert),
        },
      ])
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to record change${error ? `: ${error.message}` : ""}`);
    }
    return data as unknown as AdminChangeLogEntry;
  }

  async list(limit = 100): Promise<AdminChangeLogEntry[]> {
    const { data, error } = await this.locked()
      .from("admin_change_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return data as unknown as AdminChangeLogEntry[];
  }

  async findById(id: string): Promise<AdminChangeLogEntry | null> {
    const { data, error } = await this.locked()
      .from("admin_change_log")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return data as unknown as AdminChangeLogEntry;
  }

  async markReverted(id: string, actorId?: string | null): Promise<void> {
    // Guard on reverted_at being null so two concurrent undos of the same entry
    // cannot both proceed — the second update matches no row.
    const { error } = await this.locked()
      .from("admin_change_log")
      .update({ reverted_at: new Date().toISOString(), reverted_by: actorId ?? null })
      .eq("id", id)
      .is("reverted_at", null);

    if (error) throw new Error(`Failed to mark the change as undone: ${error.message}`);
  }
}
