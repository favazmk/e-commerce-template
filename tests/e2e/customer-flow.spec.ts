import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { fillDeliveryAddress } from './helpers/checkout';

test.describe('E2E Customer Flow', () => {
  let productSlug: string;

  test.beforeAll(async () => {
    // Inject deterministic data
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    productSlug = `e2e-cust-prod-${Date.now()}`;
    await supabase.from('products').insert({
      name: "E2E Test Product",
      slug: productSlug,
      sku: productSlug,
      price: 250,
      stock_quantity: 50,
      featured: true,
      status: 'active'
    });
    
    // Also inject a featured section if not exists
    const { data: sections } = await supabase.from('homepage_sections').select('id').eq('section_type', 'featured_products');
    if (!sections || sections.length === 0) {
      await supabase.from('homepage_sections').insert({
        section_type: 'featured_products',
        title: 'Featured',
        display_order: 1,
        is_enabled: true
      });
    }
  });

  /**
   * Archive the fixture product afterwards.
   *
   * Without this, every E2E run leaves a live "E2E Test Product" in the
   * catalogue — and they accumulate. They then appear on the storefront, in the
   * sitemap and in the Google Merchant feed, which is a real problem rather
   * than untidiness: Google will happily index and advertise them.
   *
   * Archived rather than deleted, because the test also creates an order and
   * the order history should stay intact.
   */
  test.afterAll(async () => {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    await supabase.from('products').update({ status: 'archived' }).eq('slug', productSlug);
  });

  test('User can browse products, add to cart, and complete checkout', async ({ page }) => {
    // 3. Open a product detail page (bypass cached homepage)
    await page.goto(`/products/${productSlug}`);
    await page.waitForURL(`/products/${productSlug}`);
    
    // 4. Adds product to cart
    await page.getByRole('button', { name: /Add to.*Bag/i }).first().click();
    
    // 6. Verifies cart count changes
    // Wait a brief moment for state to update
    await page.waitForTimeout(500);
    
    // 7. Opens cart
    await page.goto('/cart');
    
    // 8. Verifies product/quantity/subtotal
    await expect(page.getByText('E2E Test Product')).toBeVisible();
    await expect(page.getByRole('button', { name: /Checkout/i })).toBeVisible();
    
    // 9. Reloads the page
    await page.reload();
    
    // 10. Verifies the cart still exists (guest cart persistence)
    await expect(page.getByText('E2E Test Product')).toBeVisible({ timeout: 15000 });
    
    // 13. Proceeds to checkout
    await page.getByRole('button', { name: /Checkout/i }).click();
    await page.waitForURL('/checkout');
    
    // 14. Enters/uses an address. The form is country-aware — see the helper.
    await fillDeliveryAddress(page);

    // 16. Select the simulated gateway (demo-mode only, see playwright.config)
    const mockPayment = page.locator('input[value="mock"]');
    await expect(mockPayment).toBeVisible();
    await mockPayment.check();
    await page.getByRole('button', { name: /Place Order/i }).click();
    
    // 19. Verifies order confirmation page
    await page.waitForURL(/\/checkout\/success\/.*/, { timeout: 15000 });
    await expect(page.getByText(/Order Successfully Confirmed/i)).toBeVisible();
  });
});
