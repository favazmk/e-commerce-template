import { NextRequest, NextResponse } from "next/server";
import { SettingsService } from "@/services/settings.service";

export async function GET(request: NextRequest) {
  try {
    const settings = await SettingsService.getStoreSettings();
    const sections = SettingsService.getHomepageSections();
    return NextResponse.json({ success: true, data: { settings, sections } });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: { code: "FETCH_SETTINGS_ERROR", message: error.message } },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { category, data, sectionId, sectionData } = body;

    if (category && data) {
      const updated = await SettingsService.updateStoreSettings(category, data);
      return NextResponse.json({ success: true, data: updated });
    }

    if (sectionId && sectionData) {
      const updatedSection = SettingsService.updateHomepageSection(sectionId, sectionData);
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
