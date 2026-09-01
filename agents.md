# AGENTS.md

## Project Purpose

This repository is the MASTER reusable e-commerce template for our digital marketing agency.

It is used as the starting point for multiple client e-commerce websites.

This is NOT a client-specific website.

The repository must remain generic, reusable, and production-safe.

---

## Core Principle

The application is divided into:

1. Commerce Core
2. Theme / Presentation Layer
3. Provider / Integration Layer
4. Database / Repository Layer

Keep these responsibilities separate.

---

# 1. Commerce Core

The Commerce Core contains reusable business logic.

Examples:

- Products
- Categories
- Product variants
- Cart
- Checkout
- Orders
- Inventory
- Coupons
- Tax
- Shipping
- Customer accounts
- Payment orchestration

Important services include:

src/services/

Core services must remain client-independent.

Do NOT hard-code:

- client names
- client logos
- client phone numbers
- client addresses
- client-specific product categories
- client-specific payment credentials
- client-specific business rules

---

# 2. Theme / Presentation Layer

Client visual customization belongs here.

Examples:

- Colors
- Typography
- Logo
- Product card style
- Header
- Footer
- Homepage sections
- Layouts
- Animations
- Branding

Theme-related code belongs under:

src/theme/
src/components/storefront/

Client-specific visual changes should normally be made in the CLIENT repository, not this master repository.

---

# 3. Provider Architecture

External services must be accessed through provider interfaces.

Examples:

PaymentProvider
AuthProvider
StorageProvider
EmailProvider

Do NOT directly spread provider-specific SDK calls throughout components or business services.

Preferred pattern:

Commerce Service
→ Provider Interface
→ Provider Implementation

Example:

CheckoutService
→ PaymentProvider
→ RazorpayProvider

---

# 4. Database Architecture

The application uses repository interfaces and concrete repository implementations.

Preferred structure:

Service
→ Repository Interface
→ Repository Implementation
→ Database

Do NOT put database queries directly inside UI components.

Do NOT recreate the old in-memory production database.

The application must use real persistent storage in production.

---

# 5. Demo Mode

The application may support:

APP_MODE=demo

Demo mode exists for:

- frontend development
- client design previews
- Vercel previews
- UI demonstrations before backend infrastructure is finalized

Demo implementations must NEVER silently become production fallbacks.

Production must use real infrastructure.

---

# 6. Production Mode

When:

APP_MODE=production

use real:

- database
- authentication
- storage
- payment
- email
- business services

Never silently fallback to demo data when production infrastructure fails.

Fail clearly instead.

---

# 7. Client Repository Model

This repository is the MASTER.

New client projects are created from this repository.

Example:

e-commerce-template
    ↓
mujeeb-perfumes
    ↓
client-2
    ↓
client-3

Each client repository is independent.

Each client has its own:

- repository
- database/project
- environment variables
- deployment
- domain
- payment credentials
- branding

Never commit client production credentials into this repository.

---

# 8. What belongs in MASTER

Good changes for MASTER:

- bug fixes in Commerce Core
- security fixes
- reusable product features
- reusable cart improvements
- reusable checkout improvements
- reusable UI components
- database improvements
- reusable provider abstractions
- reusable admin improvements
- test improvements
- performance improvements

A feature should be generic enough to work for multiple future clients.

---

# 9. What does NOT belong in MASTER

Do NOT add:

- client logos
- client contact information
- client domains
- client API keys
- client products
- client-specific homepage content
- client-specific colors
- client-specific business names
- client-specific legal text
- client-specific one-off hacks

These belong in the client repository/configuration.

---

# 10. Before Adding a Feature

Ask:

"Is this feature reusable across multiple e-commerce clients?"

If YES:
consider implementing it in MASTER.

If NO:
implement it in the client repository.

Do not modify the Commerce Core for a visual/client-specific requirement unless absolutely necessary.

---

# 11. Client-Specific Feature That May Become Generic

Sometimes a client requests a feature that could be useful for future clients.

Example:

Mujeeb requests:
"Advanced product options."

Do not automatically merge the Mujeeb-specific implementation into MASTER.

First generalize it.

Bad:

MujeebPerfumeOptions

Better:

ProductOptionsService

The reusable abstraction should not contain Mujeeb-specific assumptions.

---

# 12. Git Workflow

MASTER:

main
↓
stable reusable template

Client repositories:

main
↓
client production

Optional:

staging
↓
client testing

Never develop client-specific work directly inside MASTER.

---

# 13. Updating a Client From MASTER

A client repository may receive new reusable changes from MASTER.

Typical workflow:

git fetch upstream
git merge upstream/main

Resolve conflicts carefully.

Never blindly overwrite client-specific customization.

Verify:

- build
- lint
- typecheck
- tests
- relevant E2E tests

before deployment.

---

# 14. Merging Client Improvements Back to MASTER

A client improvement may be merged into MASTER only when it is genuinely reusable.

Preferred process:

Client branch
→ Pull Request
→ MASTER

Before merging:

1. Remove client-specific branding.
2. Remove client-specific credentials.
3. Generalize names and logic.
4. Verify configuration.
5. Add tests.
6. Run full validation.

---

# 15. Important Security Rules

Never commit:

.env
.env.local
production credentials
API secrets
database passwords
payment secrets
service-role keys

Never expose server secrets to browser code.

Never trust prices, tax, shipping, discounts, or totals from the client.

Always recalculate authoritative commerce values on the server.

---

# 16. Do Not Break Provider Separation

Do not replace:

PaymentProvider

with direct Razorpay calls throughout the application.

Do not replace:

StorageProvider

with direct Supabase Storage calls in random components.

Do not replace:

Repository interfaces

with direct database calls in UI code.

Keep provider-specific logic isolated.

---

# 17. Testing Requirements

Before declaring a change complete, run:

npm run lint

npx tsc --noEmit

npm run test

npm run test:integration

npm run build

npx playwright test

Do not claim a test passed unless it was actually executed.

Do not delete or weaken tests just to make a build pass.

---

# 18. Test Changes

When modifying business logic:

- update/add unit tests
- update integration tests where database behavior changes
- update E2E tests where user behavior changes

Tests may use mock repositories.

Production code must NOT use test repositories as fallback.

---

# 19. Database Changes

All schema changes must use migrations.

Do NOT manually modify production schema without a migration.

Example:

supabase/migrations/

Every migration must be tested against a fresh database when practical.

---

# 20. Documentation

When architecture changes, update relevant documentation:

README.md
ARCHITECTURE.md
DATABASE.md
PAYMENTS.md
THEMING.md
DEPLOYMENT.md
TESTING.md
SECURITY.md

Documentation must describe the actual implementation.

Do not document planned functionality as implemented.

---

# 21. Before Modifying Code

First inspect:

- repository structure
- existing implementation
- relevant interfaces
- existing tests
- relevant documentation

Do not duplicate functionality that already exists.

Prefer modifying existing abstractions over creating competing systems.

---

# 22. Avoid Unnecessary Refactoring

Do not rewrite unrelated code.

Do not change architecture without a reason.

Do not introduce new libraries when existing project dependencies can solve the problem.

Keep changes focused.

---

# 23. Client Safety

When working in a client repository:

Assume client production data may be present.

Never:

- reset production databases
- delete production records
- run destructive migrations without confirmation
- replace production environment variables
- overwrite client content

Use development/staging environments for testing.

---

# 24. AI Development Rules

This repository is maintained heavily with AI coding agents.

AI agents MUST:

1. Inspect before editing.
2. Understand existing abstractions.
3. Make focused changes.
4. Run relevant tests.
5. Report actual results.
6. Never invent verification results.
7. Never hide errors.
8. Never remove tests simply because they fail.
9. Never commit secrets.
10. Preserve the reusable architecture.

---

# 25. Final Principle

The most important rule:

KEEP MASTER GENERIC.

If a change helps only one client, keep it in that client repository.

If a change improves the reusable commerce engine for many clients, consider bringing it back into MASTER after generalizing and testing it.

The MASTER repository is the source of the reusable foundation for all future agency e-commerce projects.
