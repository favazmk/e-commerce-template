# 🎨 Theming & Visual Presentation Engine

The theme engine enables digital agencies to transform the visual presentation of a store from minimal Scandinavian apparel to luxury jewellery, bakery, or streetwear without altering any commerce logic.

---

## 1. CSS Variable Token Inversion

Tailwind CSS styles throughout the application are bound to dynamic CSS custom properties:

```css
:root {
  --brand-primary: #0f172a;
  --brand-secondary: #334155;
  --brand-accent: #10b981;
  --brand-surface: #ffffff;
  --brand-muted: #f8fafc;
  --brand-border: #e2e8f0;
  --brand-radius: 0.5rem;
  --font-heading: 'Outfit', sans-serif;
  --font-body: 'Inter', sans-serif;
}
```

The `ThemeProvider` component injects these properties at runtime from either `src/theme/theme.config.ts` or database `store_settings`.

---

## 2. ProductCard Visual Variants

The `<ProductCard />` component supports 6 distinct visual variants:
1. `luxury`: High-contrast typography, border accents, hover slide-up quick add, floating wishlist button, and discount tags.
2. `minimal`: Clean, stripped-back layout with text below image and subtle image zoom.
3. `compact`: Horizontal card with small thumbnail, price, and inline quick-add button.
4. `modern`: Bold card with elevated drop shadows and rounded pills.
5. `classic`: Traditional e-commerce card with explicit add-to-cart button.
6. `image-focused`: Large editorial aspect ratio with overlaid captions.

---

## 3. Dynamic Homepage Builder

Homepage sections are rendered dynamically using `<DynamicSectionRenderer />`:
- `hero`: Full-width or split hero banner with CTA links and badge.
- `categories`: Grid of category collection cards with hover zoom.
- `featured_products`: Curated carousel/grid of top selling items.
- `banner`: Mid-page promotional manifesto or discount teaser.
- `testimonials`: Verified client quotes and star ratings.
- `newsletter`: VIP email subscription box.

Sections can be reordered, enabled, or disabled in `/admin/homepage`.
