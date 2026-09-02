import { RepositoryFactory } from "@/repositories/repository.factory";
import {
  AdminChangeAction,
  AdminChangeEntityType,
  AdminChangeLogEntry,
  User,
} from "@/types/database";
import { ProductService } from "@/services/product.service";
import { CategoryService } from "@/services/category.service";
import { CouponService } from "@/services/coupon.service";
import { SettingsService } from "@/services/settings.service";
import { InventoryService } from "@/services/inventory.service";
import { ReviewService } from "@/services/review.service";

export interface RecordChangeInput {
  entityType: AdminChangeEntityType;
  entityId: string;
  entityLabel: string;
  action: AdminChangeAction;
  summary: string;
  before: Record<string, any> | null;
  after: Record<string, any> | null;
  actor?: Pick<User, "id" | "email"> | null;
  isRevert?: boolean;
}

/**
 * The admin undo history.
 *
 * Every admin write records what the record looked like before and after, so a
 * mistake can be reversed from the panel. Reverting is expressed in terms of
 * the same services the admin screens use, never raw table writes — that way a
 * restore goes through the same validation as an ordinary edit and cannot
 * reintroduce a state the app would reject.
 */
export class ChangeLogService {
  /**
   * Append an entry.
   *
   * Recording must never take down the operation it is describing: if the log
   * write fails, the product edit that just succeeded still succeeded. So this
   * swallows its own errors and reports them to the server console rather than
   * throwing into the caller's response.
   */
  static async record(input: RecordChangeInput): Promise<void> {
    try {
      const repo = RepositoryFactory.getChangeLogRepository();
      await repo.record({
        entity_type: input.entityType,
        entity_id: input.entityId,
        entity_label: input.entityLabel,
        action: input.action,
        summary: input.summary,
        before_state: input.before,
        after_state: input.after,
        actor_id: input.actor?.id ?? null,
        actor_email: input.actor?.email ?? "",
        is_revert: Boolean(input.isRevert),
      });
    } catch (error) {
      console.error("[ChangeLogService] Could not record change:", error);
    }
  }

  static async list(limit = 100): Promise<AdminChangeLogEntry[]> {
    const repo = RepositoryFactory.getChangeLogRepository();
    return await repo.list(limit);
  }

  static async findById(id: string): Promise<AdminChangeLogEntry | null> {
    const repo = RepositoryFactory.getChangeLogRepository();
    return await repo.findById(id);
  }

  /**
   * Undo one change, putting the record back the way it was.
   *
   * The reversal is the mirror of the original action:
   *   update  -> write `before_state` back
   *   create  -> delete the record that was created
   *   delete  -> recreate the record from `before_state`
   *
   * The undo is itself recorded, so the history stays a complete account of
   * what happened rather than quietly rewriting itself.
   */
  static async revert(
    entryId: string,
    actor?: Pick<User, "id" | "email"> | null
  ): Promise<{ success: boolean; message: string }> {
    const repo = RepositoryFactory.getChangeLogRepository();
    const entry = await repo.findById(entryId);

    if (!entry) {
      throw new Error("That change is no longer in the history.");
    }
    if (entry.reverted_at) {
      throw new Error("That change has already been undone.");
    }

    const restored = await this.applyReversal(entry);

    await repo.markReverted(entryId, actor?.id ?? null);

    await this.record({
      entityType: entry.entity_type,
      entityId: entry.entity_id,
      entityLabel: entry.entity_label,
      // Undoing a creation removes a record; undoing anything else writes one.
      action: entry.action === "create" ? "delete" : "update",
      summary: `Undid: ${entry.summary}`,
      before: entry.after_state,
      after: entry.before_state,
      actor,
      isRevert: true,
    });

    return { success: true, message: restored };
  }

  /**
   * Perform the actual reversal for one entry, returning a sentence describing
   * what was put back.
   */
  private static async applyReversal(entry: AdminChangeLogEntry): Promise<string> {
    const label = entry.entity_label || entry.entity_id;

    switch (entry.entity_type) {
      // -------------------------------------------------------------- product
      case "product": {
        if (entry.action === "create") {
          await ProductService.deleteProduct(entry.entity_id);
          return `Removed the product "${label}" that had been created.`;
        }

        const before = entry.before_state;
        if (!before) throw new Error("This change has no earlier version to restore.");

        if (entry.action === "delete") {
          const recreated = await ProductService.createProduct(before as any);
          return `Restored the deleted product "${label}" (${recreated.images?.length ?? 0} images, ${
            recreated.variants?.length ?? 0
          } sizes).`;
        }

        const updated = await ProductService.updateProduct(entry.entity_id, before as any);
        if (!updated) throw new Error("The product no longer exists, so it cannot be restored.");
        return `Restored "${label}" to how it was before that edit.`;
      }

      // ------------------------------------------------------------- category
      case "category": {
        if (entry.action === "create") {
          await CategoryService.deleteCategory(entry.entity_id);
          return `Removed the category "${label}" that had been created.`;
        }

        const before = entry.before_state;
        if (!before) throw new Error("This change has no earlier version to restore.");

        if (entry.action === "delete") {
          await CategoryService.createCategory(before as any);
          return `Restored the deleted category "${label}". Re-file its products if they were reassigned.`;
        }

        const updated = await CategoryService.updateCategory(entry.entity_id, before as any);
        if (!updated) throw new Error("The category no longer exists, so it cannot be restored.");
        return `Restored the category "${label}".`;
      }

      // --------------------------------------------------------------- coupon
      case "coupon": {
        if (entry.action === "create") {
          await CouponService.deleteCoupon(entry.entity_id);
          return `Removed the coupon "${label}" that had been created.`;
        }

        const before = entry.before_state;
        if (!before) throw new Error("This change has no earlier version to restore.");

        if (entry.action === "delete") {
          await CouponService.createCoupon(before as any);
          return `Restored the deleted coupon "${label}".`;
        }

        const updated = await CouponService.updateCoupon(entry.entity_id, before as any);
        if (!updated) throw new Error("The coupon no longer exists, so it cannot be restored.");
        return `Restored the coupon "${label}".`;
      }

      // ----------------------------------------------------- homepage section
      case "homepage_section": {
        const before = entry.before_state;
        if (!before) throw new Error("This change has no earlier version to restore.");

        // A reorder is recorded against the whole page rather than one block.
        if (entry.entity_id === "order" && Array.isArray(before.order)) {
          await SettingsService.reorderHomepageSections(before.order as string[]);
          return "Put the homepage sections back in their previous order.";
        }

        const updated = await SettingsService.updateHomepageSection(
          entry.entity_id,
          before as any
        );
        if (!updated) throw new Error("That homepage section no longer exists.");
        return `Restored the "${label}" homepage section.`;
      }

      // ------------------------------------------------------------- settings
      case "settings": {
        const before = entry.before_state;
        if (!before) throw new Error("This change has no earlier version to restore.");

        // entity_id is the settings category: "shipping", "features", …
        await SettingsService.replaceStoreSettings(entry.entity_id, before);
        return `Restored the ${label || entry.entity_id} settings to their previous values.`;
      }

      // --------------------------------------------------------------- review
      case "review": {
        const before = entry.before_state;
        if (!before) throw new Error("This change has no earlier version to restore.");

        if (entry.action === "delete") {
          // A deleted review cannot be recreated with its original id, and
          // republishing a review the merchant deliberately removed would be a
          // surprise. Deletion of a review is final.
          throw new Error(
            "A deleted review cannot be restored. Ask the customer to submit it again."
          );
        }

        const restored = await ReviewService.setStatus(entry.entity_id, before.status);
        if (!restored) throw new Error("That review no longer exists.");
        return `Set the review by ${before.customer_name} back to "${before.status}".`;
      }

      // ------------------------------------------------------------ inventory
      case "inventory": {
        const before = entry.before_state;
        if (!before || typeof before.quantity !== "number") {
          throw new Error("This stock change has no earlier count to restore.");
        }

        // Restoring stock writes a fresh adjustment rather than editing the
        // ledger, so the audit trail keeps both the mistake and its correction.
        await InventoryService.adjustStock(
          before.productId as string,
          (before.variantId as string | null) ?? null,
          before.quantity as number,
          `Undo of: ${entry.summary}`
        );
        return `Set "${label}" back to ${before.quantity} units.`;
      }

      default:
        throw new Error("This kind of change cannot be undone automatically.");
    }
  }
}
