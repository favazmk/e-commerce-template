import type { Page } from "@playwright/test";

/**
 * Fill the checkout delivery address.
 *
 * Extracted into a helper because the address form is country-aware: the region
 * field is a `<select>` of emirates for the UAE and a free-text input elsewhere,
 * and the postal code disappears entirely for countries that have no postal
 * system. Specs that hard-code `fill('input[name="state"]')` break the moment
 * the store's default market changes, which is not a useful thing for an E2E
 * test to be sensitive to.
 *
 * See src/lib/config/regions.ts for the rules this mirrors.
 */
export async function fillDeliveryAddress(
  page: Page,
  overrides: Partial<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address1: string;
    city: string;
  }> = {}
): Promise<void> {
  const values = {
    firstName: "Test",
    lastName: "User",
    email: `test-${Date.now()}@example.com`,
    phone: "+971501234567",
    address1: "123 Test Street",
    city: "Test City",
    ...overrides,
  };

  await page.fill('input[name="firstName"]', values.firstName);
  await page.fill('input[name="lastName"]', values.lastName);
  await page.fill('input[name="email"]', values.email);
  await page.fill('input[name="phone"]', values.phone);
  await page.fill('input[name="address1"]', values.address1);
  await page.fill('input[name="city"]', values.city);

  // Country first: changing it resets the region and postal-code fields, so
  // filling those before the country would throw the answers away.
  const countrySelect = page.locator('select[name="country"]');
  if (await countrySelect.count()) {
    await countrySelect.selectOption({ index: 0 });
  } else {
    await page.fill('input[name="country"]', "United Arab Emirates");
  }

  // Region: a dropdown where the country has a fixed list, otherwise free text.
  const regionSelect = page.locator('select[name="state"]');
  if (await regionSelect.count()) {
    // Index 1 skips the "Select emirate" placeholder.
    await regionSelect.selectOption({ index: 1 });
  } else {
    await page.fill('input[name="state"]', "Test Region");
  }

  // Postal code is absent for countries with no postal system (UAE, Qatar).
  const postalCode = page.locator('input[name="postalCode"]');
  if (await postalCode.count()) {
    await postalCode.fill("00000");
  }
}
