import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { fillDeliveryAddress } from './helpers/checkout';

test.describe('E2E Auth & Security Flow', () => {
  test('Register form rejects a weak or mismatched password before submitting', async ({ page }) => {
    // Pure client-side behaviour, so it needs no Supabase round trip and cannot
    // be affected by project-level email validation.
    await page.goto('/register');

    await page.fill('input[name="name"]', 'Auth Test User');
    await page.fill('input[name="email"]', `auth_test_${Date.now()}@example.com`);

    // Too weak: the old "password123" fixture now fails, which is the point.
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'password123');
    await page.getByRole('button', { name: /Create account/i }).click();

    // .first() because Next.js renders its own role="alert" route announcer.
    const alert = page.getByRole('alert').first();
    await expect(alert).toBeVisible();
    await expect(alert).toContainText(/stronger password/i);

    // Strong, but the two fields disagree.
    const strong = `E2e-Test-${Date.now()}!`;
    await page.fill('input[name="password"]', strong);
    await page.fill('input[name="confirmPassword"]', `${strong}x`);
    await page.getByRole('button', { name: /Create account/i }).click();

    await expect(alert).toContainText(/do not match/i);

    // Still on the form; nothing was created.
    await expect(page).toHaveURL(/\/register/);
  });

  test('Customer Authentication Lifecycle', async ({ page }) => {
    // The account is provisioned through the admin API rather than the sign-up
    // form: Supabase's own email validator rejects synthetic domains on the
    // client-side signUp path, which is a project setting rather than an app
    // behaviour. This spec therefore exercises what the app actually owns —
    // sign in, the account area, and the protected-route redirect.
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const testEmail = `auth_test_${Date.now()}@example.com`;
    const testPassword = `E2e-Test-${Date.now()}!`;

    const { data: created, error } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: { name: 'Auth Test User' },
    });
    expect(error).toBeNull();
    // `created.user` is nullable in the SDK type even on success; assert rather
    // than non-null-assert, so a provisioning failure fails here with a clear
    // message instead of a null dereference further down.
    expect(created?.user).toBeTruthy();
    const userId = created!.user!.id;

    try {
      await page.goto('/login');
      await page.fill('input[name="email"]', testEmail);
      await page.fill('input[name="password"]', testPassword);
      await page.getByRole('button', { name: /^Sign in$/i }).click();

      await page.waitForURL(/\/account/, { timeout: 20000 });
      await expect(page.getByRole('heading', { name: /Recent orders/i })).toBeVisible();

      // A signed-in customer landing on /login belongs in their account.
      await page.goto('/login');
      await expect(page).toHaveURL(/\/account/);

      // Clearing cookies stands in for signing out.
      await page.context().clearCookies();

      await page.goto('/account');
      await expect(page).toHaveURL(/\/login/);
    } finally {
      await supabase.from('users').delete().eq('id', userId);
      await supabase.auth.admin.deleteUser(userId).catch(() => {});
    }
  });

  test('Security: sign-in does not reveal whether an email is registered', async ({ page }) => {
    // Distinct messages for "no such user" and "wrong password" would let
    // anyone enumerate the customer list one address at a time.
    await page.goto('/login');

    await page.fill('input[name="email"]', `definitely-not-registered-${Date.now()}@example.com`);
    await page.fill('input[name="password"]', 'Wrong-Password-1!');
    await page.getByRole('button', { name: /^Sign in$/i }).click();

    const alert = page.getByRole('alert').first();
    await expect(alert).toBeVisible({ timeout: 15000 });
    await expect(alert).toContainText(/does not match an account/i);
    // Must not confirm or deny the address exists.
    await expect(alert).not.toContainText(/no account|not found|unknown user/i);
  });

  test('Security: open redirect is not followed after sign in', async ({ page }) => {
    // A phishing link of this shape shows the real store while the customer
    // types their password, then bounces them to the attacker.
    await page.goto('/login?redirectTo=https://example.com/evil');

    // The destination is sanitised before it ever reaches the browser, so even
    // the "create an account" link carries the safe fallback instead.
    const registerLink = page.getByRole('link', { name: /Create an account/i });
    await expect(registerLink).toHaveAttribute('href', /redirectTo=%2Faccount/);
  });

  test('Security: Unauthorized Access Restrictions', async ({ page, request }) => {
    // 1. Logged-out user cannot access /admin
    await page.goto('/admin');
    await expect(page.url()).toContain('/login');

    // 2. Logged-out user cannot call protected admin API routes
    const apiRes = await request.get('/api/admin/orders');
    expect(apiRes.status()).toBe(401);

    // 3. Nor the customer account API
    const accountRes = await request.get('/api/account/addresses');
    expect(accountRes.status()).toBe(401);
  });

  test('Security: Frontend tampering rejected during checkout', async ({ page }) => {
    // Inject a product directly so this spec does not depend on the homepage
    // having featured products.
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

    // Archive the fixture afterwards so it never reaches the live storefront,
    // the sitemap or the Google Merchant feed.
    const archiveFixture = async () => {
      await supabase.from('products').update({ status: 'archived' }).eq('slug', pSlug);
    };

    try {
    await page.goto(`/products/${p.slug}`);
    await page.getByRole('button', { name: /Add to bag/i }).first().click();
    await expect(page.getByRole('button', { name: /Added to bag/i }).first()).toBeVisible();

    await page.goto('/checkout');
    await fillDeliveryAddress(page, {
      firstName: 'Hacker',
      email: 'hacker@example.com',
      address1: '123 Fake St',
      city: 'Hackville',
    });

    const mockPayment = page.locator('input[value="mock"]');
    await expect(mockPayment).toBeVisible();
    await mockPayment.check();

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

    await page.getByRole('button', { name: /Place Order/i }).click();

    await page.waitForURL(/\/checkout\/success\/.*/, { timeout: 15000 });

    // The server recalculated from the database and ignored the tampered
    // amounts, so the receipt must show the real total, not 0.01.
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toContain('0.01');
    } finally {
      await archiveFixture();
    }
  });
});
