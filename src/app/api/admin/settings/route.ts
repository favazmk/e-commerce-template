import { NextRequest, NextResponse } from "next/server";
import { SettingsService } from "@/services/settings.service";
import { requireAdmin } from "@/lib/auth/session";

export async function GET(request: NextRequest) {
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

    if (Array.isArray(sectionOrder)) {
      await SettingsService.reorderHomepageSections(sectionOrder);
      return NextResponse.json({
        success: true,
        data: await SettingsService.getHomepageSections(),
      });
    }

    if (category && data) {
      const updated = await SettingsService.updateStoreSettings(category, data);
      return NextResponse.json({ success: true, data: updated });
    }

    if (sectionId && sectionData) {
      const updatedSection = await SettingsService.updateHomepageSection(sectionId, sectionData);
      return NextResponse.json({ success: true, data: updatedSection });
    }

    return NextResponse.json({ success: false, error: { code: "BAD_REQUEST", message: "Missing payload" } }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "UPDATE_SETTINGS_ERROR", message: error.message } },
      { status: 400 }
    );
  }
}
