 # ARTHA — Merchant Sandbox & Product Catalog Design (P1-T4)

This document defines the merchant sandbox purpose, merchant model, AI-readable product catalog format, CRUD API design (high-level), products.csv template and validation rules, JSON-to-internal transformation, sample fixtures for evaluation, security rules, and connections to policy, orchestrator, orders, and audit.

NOTE: Design-only. No APIs, migrations, or implementation are included.

## 1. Merchant sandbox purpose and boundaries

- Purpose: Provide a controlled, deterministic merchant environment so the AI buyer can discover products, evaluate offers, and complete bounded transactions in Razorpay Test Mode without relying on external e-commerce sites.
- Boundaries:
  - The sandbox is authoritative for merchant data used by Artha (catalog, pricing, inventory, policies scoped to merchants).
  - Merchant-provided content is stored as data and treated as untrusted for authorization/policy decisions.
  - The sandbox exposes administrative capabilities for merchants to manage products, inventory, and AI-commerce configuration within defined limits.
  - The sandbox is not a payment processor — it works with the backend to create orders which then interact with Razorpay Test Mode.

## 2. Merchant model

Primary fields (subset):
- `id`: string (merchant_xxx)
- `name`: string
- `description`: string
- `ownerUserId`: string (references users.id)
- `policyId`: string (references policies.id)
- `aiCommerceConfig`: JSON {
    `allowAutonomousPurchase`: boolean,
    `maxAutonomousTransaction`: integer (paise),
    `requireConfirmationAbove`: integer (paise)
  }
- `createdAt`, `updatedAt`

Ownership and configuration:
- `ownerUserId` ensures merchant ownership; CRUD operations must verify ownership via backend authorization middleware.
- `aiCommerceConfig` allows merchant-scoped safe defaults; the policy engine remains authoritative and can override merchant settings when required by global/user policies.

Policy relationship:
- Each merchant can reference a `policies` record; policies apply during agent decisioning and order authorization. Merchant policy is applied with precedence below user-specific policy and above global policy (see DECISIONS.md).

## 3. AI-readable product catalog

Each product record must include (fields and types):
- `id`: string
- `merchantId`: string
- `name`: string
- `sku`: string
- `price`: integer (paise) — required; use integer paise convention
- `currency`: string (INR)
- `condition`: enum (`new` | `refurbished` | `used`)
- `features`: JSON object (structured attributes; avoid freeform text for critical attributes)
- `inventory`: integer (available units)
- `returnPolicy`: JSON `{ "days": number }`
- `availability`: boolean
- `metadata`: JSON (optional merchant data, treated as untrusted)

Important:
- The backend MUST treat product fields as data only. Any decision that affects money or policy must use validated fields (e.g., verified price at order creation) and not trust raw merchant input.

## 4. High-level merchant sandbox CRUD API design (design-only)

Auth and ownership: all endpoints require authentication and appropriate role checks (MERCHANT owner or ADMIN).

- Create merchant
  - POST /api/merchants
  - Body: merchant object (name, description, ownerUserId, aiCommerceConfig)

- Read merchant
  - GET /api/merchants/:merchantId

- Update merchant
  - PUT /api/merchants/:merchantId
  - Body: fields to update (owner-only restrictions apply)

- Delete merchant
  - DELETE /api/merchants/:merchantId (admin or owner with safeguards)

Products (merchant-scoped)
- Create product
  - POST /api/merchants/:merchantId/products
  - Body: product JSON (catalog format above)

- List products
  - GET /api/products?merchantId=...

- Get product
  - GET /api/products/:productId

- Update product
  - PUT /api/merchants/:merchantId/products/:productId

- Delete product
  - DELETE /api/merchants/:merchantId/products/:productId

Notes:
- All write operations must be validated server-side and recorded in `audit_events`.
- Price updates after an order is created should not retroactively change order totals — backend must record price at order creation.

## 5. `products.csv` format (template)

Path: `docs/fixtures/products.csv` (template included alongside this document)

Header columns (order matters):
- `id` — optional; if empty, system may generate one
- `merchantId` — required
- `sku` — required, string
- `name` — required
- `price_paise` — required integer (price in paise)
- `currency` — required (INR)
- `condition` — required (`new`|`refurbished`|`used`)
- `features_json` — optional JSON string (must be valid JSON)
- `inventory` — required integer
- `return_days` — optional integer (days)
- `availability` — required boolean (`true`|`false`)
- `metadata_json` — optional JSON string (untrusted)

Validation rules:
- `merchantId` must reference an existing merchant in the sandbox (validation at import time).
- `sku` must be unique per merchant.
- `price_paise` must be integer >= 0.
- `currency` must be `INR` for Phase 1.
- `condition` must be one of allowed enums.
- `features_json` and `metadata_json` must be valid JSON; fields inside are untrusted.
- `inventory` must be integer >= 0.
- `availability` must be `true` or `false`.

Transformation rules during import:
- Parse JSON fields and map to internal types.
- Normalize `price_paise` to integer paise and store in product.price.
- Validate and dedupe SKUs per merchant.
- If `id` is empty, create a new `id` (e.g., `prod_<uuid>`).
- Reject rows failing validation and return an import report indicating accepted rows, rejected rows, and reasons.

## 6. JSON-to-internal-catalog transformation rules

When accepting JSON product payloads (API or CSV->JSON), apply the following deterministic transformations and validations server-side:

1. Schema validation: ensure required fields exist and types match.
2. Price normalization: coerce `price` or `price_paise` to integer paise. If a floating currency value is provided, reject and require paise.
3. Feature normalization: map `features` keys to a stable attribute set where possible (e.g., `anc`, `batteryHours`, `warrantyMonths`). Unknown keys are allowed in `metadata` but considered untrusted.
4. Inventory handling: import inventory as available units but do not reserve on import — reservation occurs at order creation (see policy/inventory decisions).
5. Return policy: convert `return_days` to `returnPolicy.days` and validate >=0.
6. Data hygiene: trim strings, validate SKU pattern (alphanumeric + limited separators), and strip control characters.

All transformations must be logged and any rejected fields should be surfaced to the merchant in the import report.

## 7. Sample merchant & product fixtures (for synthetic evaluation)

Sample merchant (docs/fixtures/sample-merchant.json):

```json
{
  "id": "merchant_demo",
  "name": "Demo Store",
  "description": "Sandbox merchant for evaluations",
  "ownerUserId": "user_merchant_owner",
  "policyId": "policy_merchant_demo",
  "aiCommerceConfig": { "allowAutonomousPurchase": true, "maxAutonomousTransaction": 500000, "requireConfirmationAbove": 300000 }
}
```

Sample products (docs/fixtures/sample-products.json):

```json
[
  {
    "id": "prod_001",
    "merchantId": "merchant_demo",
    "sku": "ANC-720",
    "name": "ANC Headphones",
    "price": 479900,
    "currency": "INR",
    "condition": "new",
    "features": { "anc": true, "batteryHours": 35 },
    "inventory": 12,
    "returnPolicy": { "days": 7 },
    "availability": true
  },
  {
    "id": "prod_002",
    "merchantId": "merchant_demo",
    "sku": "RUN-100",
    "name": "Running Shoes",
    "price": 299900,
    "currency": "INR",
    "condition": "new",
    "features": { "sizeRange": "7-11" },
    "inventory": 20,
    "returnPolicy": { "days": 14 },
    "availability": true
  }
]
```

Use these fixtures to seed evaluation scenarios such as: budget-based purchase, policy-blocked purchase above threshold, and price-change after authorization.

## 8. Security rules (summary)

- Merchant and product content are untrusted data.
- External content MUST NOT override system or application policies.
- Prices and inventory are authoritative only when validated and recorded by the backend; the frontend or CSV input cannot be trusted for final price.
- The AI must never treat merchant content as authorization; authorization records and policy checks are the only source of truth for money actions.
- All import and update operations must create `audit_events` entries describing who performed the change and why.

## 9. Integration points: policy engine, orchestrator, orders, audit

- Policy engine: invoked during product selection and before order/payment actions. Uses merchant policy, user policy, and global policy (in that precedence) to decide ALLOW/BLOCK/REQUIRE_CONFIRMATION.
- Agent orchestrator: uses the catalog tools (search_products, get_product) to discover items. Tool calls must return sanitized, structured data and be recorded as `agent_steps`.
- Orders: when an order is created from a cart/product selection, the backend must record the price, reserve inventory per policy, create an `order` record and emit `audit_events` for the order creation.
- Audit: every import, create, update, deletion, policy decision, authorization request, and payment action must be recorded to `audit_events` with sufficient structured metadata for replay and evaluation.

## Approved decisions

The following decisions have been approved for Phase 1 design. Implementation details remain out-of-scope for this document.

1. SKU uniqueness strategy
  - Decision: SKU uniqueness is enforced per merchant (not global).
  - Reason: Merchants manage independent catalogs and may reuse SKUs across merchants; per-merchant uniqueness simplifies onboarding and avoids cross-merchant conflicts.
  - Trade-offs: Global deduplication is not available; integrations that expect globally unique SKUs must map using `merchantId + sku`.
  - Status: Approved

2. Inventory reservation expiry
  - Decision: Inventory reservations expire after a configurable timeout; default design value is 15 minutes.
  - Reason: A default expiry prevents indefinite reservations and reduces risk of stock being locked by abandoned orders.
  - Trade-offs: Short expiry may increase false release of reservations for slow payments; long expiry can reduce availability. Make the timeout configurable per deployment.
  - Status: Approved

3. CSV import mode
  - Decision: Catalog CSV imports are asynchronous and produce an import report (accepted rows, rejected rows with reasons).
  - Reason: Asynchronous imports scale better for large files and provide a clear feedback mechanism to merchants.
  - Trade-offs: Requires an import job system and temporary storage for reports; synchronous imports are simpler but may time out for large files.
  - Status: Approved

If implementation is started, record the chosen parameters (default expiry, import job config) in `DECISIONS.md` and follow with implementation tickets.

---

End of `docs/merchant-sandbox.md`.
