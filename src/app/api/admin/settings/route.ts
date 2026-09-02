import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { SettingsService } from "@/services/settings.service";
import { ChangeLogService } from "@/services/changelog.service";
import { requireAdmin } from "@/lib/auth/session";

/**
 * Settings categories the merchant is allowed to change from the panel.
 *
 * Tax, branding, currency and payment configuration are deliberately absent:
 * a wrong value there mis-charges every order placed until someone notices, so
 * those stay code changes the development team reviews and can roll back.
 */
const CLIENT_EDITABLE_CATEGORIES = ["shipping", "features"] as const;
type EditableCategory = (typeof CLIENT_EDITABLE_CATEGORIES)[number];

function isEditableCategory(value: unknown): value is EditableCategory {
  return CLIENT_EDITABLE_CATEGORIES.includes(value as EditableCategory);
}

export async function GET() {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  try {
    const settings = await SettingsService.getStoreSettings();
    const sections = await SettingsService.getHomepageSections();
    return NextResponse.json({ success: true, data: { settings, sections } });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "FETCH_SETTINGS_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const { category, data, sectionId, sectionData, sectionOrder } = body;

    // ------------------------------------------------- homepage reordering
    if (Array.isArray(sectionOrder)) {
      const previous = await SettingsService.getHomepageSections();

      await SettingsService.reorderHomepageSections(sectionOrder);

      await ChangeLogService.record({
        entityType: "homepage_section",
        entityId: "order",
        entityLabel: "Homepage section order",
        action: "update",
        summary: "Reordered the homepage sections",
        before: { order: previous.map((s) => s.id) },
        after: { order: sectionOrder },
        actor: auth.user,
      });

      revalidatePath("/");
      return NextResponse.json({
        success: true,
        data: await SettingsService.getHomepageSections(),
      });
    }

    // ------------------------------------------------------ store settings
    if (category && data) {
      if (!isEditableCategory(category)) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "CATEGORY_NOT_EDITABLE",
              message: `"${category}" is configured by the development team and cannot be changed from the panel.`,
            },
          },
          { status: 403 }
        );
      }

      const before = await SettingsService.getSettingCategory(category);
      const updated = await SettingsService.updateStoreSettings(category, data);
      const after = await SettingsService.getSettingCategory(category);

      await ChangeLogService.record({
        entityType: "settings",
        entityId: category,
        entityLabel: category === "shipping" ? "Shipping" : "Store features",
        action: "update",
        summary:
          category === "shipping"
            ? "Updated shipping rates and thresholds"
            : "Updated which store features are switched on",
        before,
        after,
        actor: auth.user,
      });

      revalidatePath("/");
      revalidatePath("/checkout");
      return NextResponse.json({ success: true, data: updated });
    }

    // ---------------------------------------------- one homepage section
    if (sectionId && sectionData) {
      const existing = (await SettingsService.getHomepageSections()).find(
        (s) => s.id === sectionId
      );

      const updatedSection = await SettingsService.updateHomepageSection(sectionId, sectionData);

      if (updatedSection && existing) {
        const visibilityOnly =
          Object.keys(sectionData).length === 1 &&
          Object.prototype.hasOwnProperty.call(sectionData, "is_enabled");

        await ChangeLogService.record({
          entityType: "homepage_section",
          entityId: sectionId,
          entityLabel: updatedSection.title || updatedSection.section_type,
          action: "update",
          summary: visibilityOnly
            ? `${updatedSection.is_enabled ? "Showed" : "Hid"} the "${
                updatedSection.title || updatedSection.section_type
              }" homepage section`
            : `Edited the "${updatedSection.title || updatedSection.section_type}" homepage section`,
          before: existing as unknown as Record<string, any>,
          after: updatedSection as unknown as Record<string, any>,
          actor: auth.user,
        });
      }

      revalidatePath("/");
      return NextResponse.json({ success: true, data: updatedSection });
    }

    return NextResponse.json(
      { success: false, error: { code: "BAD_REQUEST", message: "Missing payload" } },
      { status: 400 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "UPDATE_SETTINGS_ERROR", message: error.message } },
      { status: 400 }
    );
  }
}
