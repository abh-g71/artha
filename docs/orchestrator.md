# ARTHA — Agent Orchestrator & Tool Contract Discipline (P1-T6)

This design document defines the agent orchestrator responsibilities, agent-run state model, lifecycle, initial tool contracts, strict tool boundaries, deterministic vs AI responsibilities, failure handling, idempotency expectations, and integrations. This is design-only — no implementation is included.

Principles repeated from the spec:
- AI proposes. Policy decides. User authorizes when required. Backend executes. Razorpay processes. Webhook confirms. Audit records.
- Use approved conventions: `paise` integer currency, per-order authorization, policy precedence user>merchant>global, inventory reservation default 15 minutes, JWT bearer authentication for Phase 1.

1. Agent orchestrator responsibilities
-------------------------------------
- Coordinate end-to-end agent runs from intent to transaction.
- Maintain deterministic state for each run and step for audit, replay, and evaluation.
- Validate inputs/outputs for each tool call; sanitize merchant/product data.
- Enforce policy checks before money actions by invoking the policy engine.
- Orchestrate authorization request/verification flows.
- Ensure side-effecting operations (orders, payments, reservations) are performed only by backend-controlled tools and are idempotent.
- Record `agent_runs`, `agent_steps`, and `audit_events` for visibility and evaluation.

2. Agent run state model
-------------------------

Agent run top-level (`agent_run`):
- `id` (string)
- `userId` (string)
- `request` (string) - raw user intent
- `status` enum: `PENDING` | `RUNNING` | `AWAITING_AUTH` | `COMPLETED` | `FAILED` | `CANCELLED`
- `currentStep` (string)
- `resultSummary` (JSON)
- `startedAt`, `completedAt`, `updatedAt`
- `error` (optional string)

Agent step (`agent_step`): one per meaningful action/tool call
- `id` (string)
- `agentRunId` (string)
- `stepIndex` (integer)
- `stepType` enum: `INTENT_PARSE` | `TOOL_CALL` | `DECISION` | `ACTION` | `VERIFY` | `AUDIT`
- `toolName` (optional)
- `input` (JSON)
- `output` (JSON)
- `status` enum: `SUCCESS` | `FAILED` | `SKIPPED` | `RETRY`
- `startedAt`, `completedAt`, `error` (optional)

Notes:
- Steps must be immutable once recorded (append-only) to preserve auditability.
- Include compact deterministic snapshots of inputs used for decisions to support replay.

3. Agent lifecycle (high-level)
-------------------------------
User intent → Intent extraction → Product search → Product retrieval → Comparison/Ranking → Policy check → Authorization (if required) → Order creation → Payment initiation → Payment verification → Completion → Audit

4. Initial tool contracts
-------------------------

All tools must declare strict input and output schemas, validation rules, and failure modes. Tools are implemented by the backend; LLMs only propose inputs.

Tool: `search_products`
- Purpose: Find candidate products matching structured requirements.
- Input schema: `{ query: string, filters?: { merchantId?: string, priceRange?: { min?: number, max?: number }, features?: object, condition?: string }, limit?: number }`
- Output schema: `{ results: [ { productId, merchantId, name, sku, price (paise), currency, condition, features, availability } ], total: number }`
- Validation: `priceRange` values integers (paise); `limit` <= 100; `merchantId` must exist if provided.
- Failure cases: input validation error (400), backend timeout (retryable), data-store error (retryable), empty results (valid).
- Deterministic? Yes — relies on backend data stores and deterministic filters.
- Money side-effect? No

Tool: `get_product`
- Purpose: Retrieve canonical product record by `productId`.
- Input: `{ productId: string }`
- Output: `{ product: { id, merchantId, sku, name, price (paise), currency, condition, features, inventory, returnPolicy, availability, metadata } }`
- Validation: productId exists
- Failure: 404 if not found, transient DB errors (retryable)
- Deterministic? Yes
- Money side-effect? No

Tool: `compare_products`
- Purpose: Given candidate product details and user preferences, produce a deterministic ranking & scores.
- Input: `{ products: [product objects], preferences: { budgetPaise?: number, priorities?: string[] } }`
- Output: `{ ranked: [ { productId, score, reasons: [string] } ] }`
- Validation: product objects include required fields; scores numeric
- Failure: invalid input, internal ranking error (retryable)
- Deterministic? Yes — algorithmic scoring based on structured data.
- Money side-effect? No

Tool: `check_policy`
- Purpose: Evaluate policy for a proposed action and amount.
- Input: `{ actor: { id, role }, userId, merchantId, action: string, amountPaise: number, currency: string, orderContext?: object }`
- Output: `{ decision: 'ALLOW'|'BLOCK'|'REQUIRE_CONFIRMATION', reason: string, appliedPolicyId?: string, metadata?: object }`
- Validation: amountPaise integer, currency 'INR' for Phase 1
- Failure: missing policy data (treat as BLOCK), policy service unavailable (fail-safe BLOCK)
- Deterministic? Yes
- Money side-effect? No

Tool: `request_authorization`
- Purpose: Create an authorization request for user approval (per-order scope).
- Input: `{ userId, orderId, amountPaise, currency, expiresAt }`
- Output: `{ authorizationId, status: 'PENDING' }`
- Validation: order exists, amount matches order total, userId owns order
- Failure: mismatch between order and amount (reject), user not found
- Deterministic? Yes
- Money side-effect? No (creates authorization record only)

Tool: `create_order`
- Purpose: Create an authoritative order record (binds prices, items, merchant, user).
- Input: `{ userId, merchantId, items: [ { productId, quantity, unitPricePaise } ], shipping?: object }`
- Output: `{ orderId, status: 'CREATED', subtotalPaise, totalPaise }`
- Validation: product availability, price verification from canonical product, inventory check (reservation step may be triggered)
- Failure: insufficient inventory, price mismatch, validation error
- Deterministic? Yes
- Money side-effect? Potential (inventory reservation) — must be idempotent and performed server-side

Tool: `create_razorpay_order`
- Purpose: Create a Razorpay Test Mode order and prepare payment initiation.
- Input: `{ orderId, amountPaise, currency, receipt?: string }`
- Output: `{ razorpayOrderId, amountPaise, currency }`
- Validation: order exists, amount matches order total, idempotency key required
- Failure: external API failure (retry/backoff), invalid signature
- Deterministic? No (external system), but backend must make it behave deterministically with idempotency
- Money side-effect? Yes (prepares payment in Razorpay)

Tool: `verify_payment`
- Purpose: Verify final payment state (via webhook or direct check).
- Input: `{ razorpayPaymentId | razorpayOrderId }`
- Output: `{ status: 'SUCCESS'|'FAILED'|'PENDING', paymentId, amountPaise, metadata }`
- Validation: match order and amount
- Failure: timeout, mismatch (treat as PENDING and require reconciliation)
- Deterministic? Depends on Razorpay responses; backend must verify signatures and reconcile
- Money side-effect? No (verification only) — but may trigger order state transitions

Tool: `record_audit_event`
- Purpose: Persist a structured audit event.
- Input: `{ actor, action, resource, resourceId, decision, reason, metadata }`
- Output: `{ auditEventId }`
- Validation: minimal required fields
- Failure: storage error (retryable)
- Deterministic? Yes
- Money side-effect? No

5. Strict tool boundaries
------------------------
- LLM cannot directly call payment APIs or change authorization records.
- LLM cannot authorize transactions; only `request_authorization` creates a pending authorization; only explicit user action (or approved automation per policy) sets an authorization to `APPROVED`.
- LLM cannot bypass policy; every money action must pass `check_policy` prior to side-effects.
- Financial tools (`create_order`, `create_razorpay_order`) are backend-controlled, idempotent, and require server-side validation and idempotency keys.
- Tool inputs must be fully validated and canonicalized before use.
- Merchant/product content is untrusted; tools must treat `metadata` and free-text fields as data only.

6. Deterministic vs AI responsibility table
-----------------------------------------
- Intent extraction: AI (LLM) proposes → orchestrator validates and canonicalizes
- Product discovery: search_products (deterministic) invoked by orchestrator
- Recommendation/ranking: deterministic `compare_products` using structured data
- Policy decision: deterministic `check_policy` (backend)
- Authorization: backend records and validates per-order (deterministic)
- Payment: backend + Razorpay Test Mode (external) — orchestrator triggers but backend enforces

7. Example complete agent-run JSON
---------------------------------
```json
{
  "agentRun": {
    "id": "run_123",
    "userId": "user_123",
    "request": "Buy ANC headphones under 5000",
    "status": "COMPLETED",
    "startedAt": "2026-08-21T10:01:00Z",
    "completedAt": "2026-08-21T10:02:00Z"
  },
  "steps": [
    { "id": "s1", "stepIndex": 1, "stepType": "INTENT_PARSE", "toolName": null, "input": { "text": "Buy ANC..." }, "output": { "category": "headphones", "maxBudgetPaise": 500000 }, "status": "SUCCESS" },
    { "id": "s2", "stepIndex": 2, "stepType": "TOOL_CALL", "toolName": "search_products", "input": { "query": "ANC headphones", "filters": { "priceRange": { "max": 500000 } } }, "output": { "results": [ { "productId": "prod_001", "price": 479900 } ] }, "status": "SUCCESS" },
    { "id": "s3", "stepIndex": 3, "stepType": "TOOL_CALL", "toolName": "compare_products", "input": { "products": ["prod_001"], "preferences": {} }, "output": { "ranked": [ { "productId": "prod_001", "score": 91 } ] }, "status": "SUCCESS" },
    { "id": "s4", "stepIndex": 4, "stepType": "TOOL_CALL", "toolName": "check_policy", "input": { "actor": { "id": "user_123", "role": "USER" }, "merchantId": "merchant_demo", "action": "ORDER_PURCHASE", "amountPaise": 479900 }, "output": { "decision": "ALLOW", "reason": "Within authorized spending limit" }, "status": "SUCCESS" },
    { "id": "s5", "stepIndex": 5, "stepType": "TOOL_CALL", "toolName": "create_order", "input": { "userId": "user_123", "merchantId": "merchant_demo", "items": [ { "productId": "prod_001", "quantity": 1, "unitPricePaise": 479900 } ] }, "output": { "orderId": "order_001", "status": "CREATED", "totalPaise": 479900 }, "status": "SUCCESS" },
    { "id": "s6", "stepIndex": 6, "stepType": "TOOL_CALL", "toolName": "create_razorpay_order", "input": { "orderId": "order_001", "amountPaise": 479900 }, "output": { "razorpayOrderId": "rzp_order_1" }, "status": "SUCCESS" },
    { "id": "s7", "stepIndex": 7, "stepType": "TOOL_CALL", "toolName": "verify_payment", "input": { "razorpayOrderId": "rzp_order_1" }, "output": { "status": "SUCCESS", "paymentId": "pay_1" }, "status": "SUCCESS" },
    { "id": "s8", "stepIndex": 8, "stepType": "AUDIT", "toolName": "record_audit_event", "input": { "actor": "ARTHA_AGENT", "action": "PAYMENT_VERIFIED", "resource": "payment", "resourceId": "pay_1" }, "output": { "auditEventId": "audit_001" }, "status": "SUCCESS" }
  ]
}
```

8. Failure handling
-------------------
- Tool failure: mark step `FAILED`, record error details, escalate to `agentRun.status=FAILED` or retry based on failure policy.
- Invalid tool arguments: return `FAILED` with validation reason; do not execute side effects.
- Stale product price: if price differs at order creation, block and require re-confirmation or re-evaluation via policy.
- Policy BLOCK: stop orchestration, record `POLICY_BLOCK` audit, return human-friendly explanation.
- Authorization rejection: mark run `AWAITING_AUTH` or `FAILED` depending on flow; do not proceed to payment.
- Payment failure: rollback reservation if applicable, record audit, inform user and provide retry options.
- Duplicate execution: use idempotency keys for side-effecting tools; detect repeats and return existing resource instead of creating duplicates.
- Webhook delay: treat payment as `PENDING` and poll/await webhook; ensure idempotent webhook processing.

9. Idempotency and retry expectations
-----------------------------------
- Side-effecting tools must accept an `idempotencyKey` and be idempotent within a retention window.
- Retries should be exponential with capped attempts; transient errors are retryable, deterministic failures are not.
- Orchestrator must record attempts and avoid duplicate payments/orders by checking existing resources before creation.

10. Orchestrator integrations
----------------------------
- Policy engine: call `check_policy` prior to any money action; record inputs and outputs.
- Authorization system: create and validate per-order authorizations via `request_authorization` and authorization records.
- Merchant catalog: use `search_products` and `get_product` as canonical sources for product data; do not trust merchant free-text.
- Razorpay Test Mode: only backend executes `create_razorpay_order` and `verify_payment`; orchestrator triggers but backend enforces secrets and verification.
- Webhook verification: webhook handler updates payment state and notifies orchestrator; handler must verify signature and emit audit events.
- Audit system: every step, decision, and side-effect must be recorded via `record_audit_event` and linked to `agent_run`/`agent_step`.
- Evaluation system: agent runs and step outputs are persisted to enable later evaluation and metrics calculation.

Decisions required
------------------
- No new high-level decisions introduced; any future tool additions or policy primitives must be approved.

---

End of `docs/orchestrator.md`.
