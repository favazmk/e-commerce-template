# Product photos

Drop image files here and run `npm run images:sync` to attach them to products.

## Naming

Name each file after the product **slug**:

```
public/products/merino-overcoat.jpg      primary image
public/products/merino-overcoat-2.jpg    second gallery image
public/products/merino-overcoat-3.webp   third, and so on
```

Accepted: `.jpg` `.jpeg` `.png` `.webp` `.avif`

## Workflow

```bash
npm run images:check
```
Lists which slugs still need a photo and what would change — makes no edits.

```bash
npm run images:sync
```
Attaches the files to their products and prints catalog coverage.

Add `--prune` to also drop database rows whose file has been deleted:

```bash
node scripts/sync-product-images.mjs --prune
```

## No photo yet?

Nothing breaks. Any product without an image renders a designed monogram tile
derived from its name, so the storefront stays presentable while photography is
still being produced. Photos can also be added one at a time through
**Admin → Products → Edit → Product Images**.
