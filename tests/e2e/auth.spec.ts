import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

test.describe('E2E Auth & Security Flow', () => {
  test('Customer Authentication Lifecycle', async ({ page }) => {
    // 1. Register test customer
    await page.goto('/login');
    // Click the toggle button to switch to sign up mode
    await page.getByRole('button', { name: /Create an account/i }).click();
    
    const testEmail = `auth_test_${Date.now()}@example.com`;
    await page.fill('input[name="name"]', 'Auth Test User');
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', 'password123');
    await page.getByRole('button', { name: /^Sign Up$/i }).click();
    
    // Wait for redirect to /account after successful sign up
    try { await page.waitForURL('/account', {timeout: 10000}); } catch(e) { console.error('BODY:', await page.content()); throw e; }
    await expect(page.getByText(/Order History/i)).toBeVisible();
    
    // 4. Logout
    // There isn't an explicit logout button in the simple account UI, 
    // so we can test it by manually calling the auth signout on client or adding a sign out route.
    // For now, let's clear cookies to simulate logout and verify redirection.
    await page.context().clearCookies();
    
    // 5. Protected account route denied
    await page.goto('/account');
    await expect(page.url()).toContain('/login');
  });

  test('Security: Unauthorized Access Restrictions', async ({ page, request }) => {
    // 1. Logged-out user cannot access /admin
    await page.goto('/admin');
    await expect(page.url()).toContain('/login');
    
    // 3. Logged-out user cannot call protected admin API routes
    const apiRes = await request.get('/api/admin/orders');
    expect(apiRes.status()).toBe(401);
  });

  test('Security: Frontend tampering rejected during checkout', async ({ page }) => {
    // 1. Setup cart
    // Since we don't want to rely on the homepage having featured products in this specific spec,
    // we will inject a product and navigate directly to it.
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const pSlug = `e2e-tamper-${Date.now()}`;
    const { data: p } = await supabase.from('products').insert({
      name: "Tamper Test Product",
      slug: pSlug,
      sku: pSlug,
      price: 100,
      stock_quantity: 10,
      status: 'active'
    }).select().single();

    await page.goto(`/products/${p.slug}`);
    await page.getByRole('button', { name: /Add to.*Bag/i }).first().click();
    await expect(page.getByRole('button', { name: /Added to Bag/i })).toBeVisible();
    await page.goto('/checkout');
    // Fill Dummy Address
    await page.fill('input[name="firstName"]', 'Hacker');
    await page.fill('input[name="lastName"]', 'User');
    await page.fill('input[name="email"]', 'hacker@example.com');
    await page.fill('input[name="phone"]', '1234567890');
    await page.fill('input[name="address1"]', '123 Fake St');
    await page.fill('input[name="city"]', 'Hackville');
    await page.fill('input[name="state"]', 'NY');
    await page.fill('input[name="postalCode"]', '10001');
    
    const countrySelect = page.locator('select[name="country"]');
    if (await countrySelect.isVisible()) {
      await countrySelect.selectOption({ label: 'United States' });
    }
    
    const mockPayment = page.locator('input[value="mock"]');
    if (await mockPayment.isVisible()) {
      await mockPayment.click();
    }

    // Intercept checkout request and tamper prices
    await page.route('/api/checkout', async (route) => {
      const req = route.request();
      if (req.method() === 'POST') {
        const postData = req.postDataJSON();
        // Malicious client tampers with totals
        postData.total_amount = 0.01;
        postData.subtotal = 0.01;
        if (postData.items && postData.items.length > 0) {
          postData.items[0].price_snapshot = 0.01;
        }
        const response = await route.fetch({
          method: 'POST',
          postData: JSON.stringify(postData),
        });
        await route.fulfill({ response });
      } else {
        await route.continue();
      }
    });
    
    // Place order
    await page.getByRole('button', { name: /Place Order/i }).click();
    
    // Order confirmed
    await page.waitForURL(/\/checkout\/success\/.*/, { timeout: 15000 });
    
    // To verify the server ignored the tampered 0.01 amount, we check the real total is still 100+
    // or we check that the API responded with the correct amount.
    // Let's assert the UI doesn't show $0.01 in the receipt.
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('$0.01'); 
  });
});
