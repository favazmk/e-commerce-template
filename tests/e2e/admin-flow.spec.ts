import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

test.describe('E2E Admin Flow', () => {
  let adminEmail: string;
  let adminPass = 'admin123';

  test.beforeAll(async () => {
    // Inject deterministic admin data
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );
    
    adminEmail = `admin_${Date.now()}@example.com`;
    
    // Create admin auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPass,
      email_confirm: true,
      user_metadata: { name: 'E2E Admin' }
    });
    
    if (authError) throw authError;
    
    // Upsert into users table and set role
    if (authData?.user) {
      await supabase.from('users').upsert({
        id: authData.user.id,
        email: adminEmail,
        name: 'E2E Admin',
        role: 'admin'
      });
    }
  });

  test('Admin can login, view dashboard, and create a product', async ({ page }) => {
    // 1. Admin login
    await page.goto('/login');
    await page.fill('input[name="email"]', adminEmail);
    await page.fill('input[name="password"]', adminPass);
    await page.getByRole('button', { name: /^Sign In$/i }).click();

    // 2. View dashboard
    // When successful, login redirects to /account or whatever is in URL. Let's go to admin explicitly.
    await page.waitForURL(/\/account|\/admin/);
    await page.goto('/admin');
    await expect(page.getByText(/Merchant Overview/i)).toBeVisible();
    
    // 3. Create a product
    await page.goto('/admin/products/new');
    
    const pName = `New Admin Product ${Date.now()}`;
    await page.fill('input[name="name"]', pName);
    
    const slug = `new-admin-product-${Date.now()}`;
    await page.fill('input[name="slug"]', slug);
    
    await page.fill('input[name="short_description"]', 'Test short description for admin product');
    await page.fill('textarea[name="description"]', 'Test description for admin product');
    await page.fill('input[name="price"]', '199.99');
    await page.fill('input[name="sku"]', `SKU-${Date.now()}`);
    await page.fill('input[name="stock_quantity"]', '100');
    
    // Since we do not have an actual bucket for images in tests maybe, we can skip file upload
    // or upload a fake file if the test environment supports it. 
    // We'll skip file upload for hermetic test stability and just save.
    
    await page.getByRole('button', { name: /Save Product/i }).first().click();
    
    // Wait for success and exact redirect to the products list
    await page.waitForURL('**/admin/products', { timeout: 15000 });
    
    // Bypass Next.js client-side router cache to ensure we see the latest database state
    await page.reload();
    
    await expect(page.getByText(pName)).toBeVisible();
  });
});
