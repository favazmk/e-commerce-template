import { AdminChangeLogEntry } from "../../types/database";

export interface IChangeLogRepository {
  /** Append an entry. The log is append-only; entries are never edited except to mark a revert. */
  record(
    entry: Omit<AdminChangeLogEntry, "id" | "created_at" | "reverted_at" | "reverted_by">
  ): Promise<AdminChangeLogEntry>;

  /** Recent entries, newest first. */
  list(limit?: number): Promise<AdminChangeLogEntry[]>;

  findById(id: string): Promise<AdminChangeLogEntry | null>;

  /** Mark an entry as undone so the same restore cannot be applied twice. */
  markReverted(id: string, actorId?: string | null): Promise<void>;
}
