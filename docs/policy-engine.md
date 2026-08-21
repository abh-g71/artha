# ARTHA — Policy Engine & Authorization Design (P1-T5)

This document defines the deterministic policy and authorization layer for ARTHA. It is a design artifact only — no implementation, code, or migrations are included.

1. Purpose and security boundary
--------------------------------
- Purpose: Provide a deterministic, auditable decision service that evaluates proposed money actions (and related guarded actions) and returns structured decisions that the backend enforces.
- Security boundary:
  - The policy engine is authoritative for policy decisions. AI may propose actions, but it may NOT authorize money actions.
  - The backend (not the LLM) enforces policy outcomes and performs all money actions.
  - Policy evaluation must be deterministic and reproducible given the same inputs.

2. Policy primitives
--------------------
The engine supports the following primitives (from project spec and prior approvals):

- `maxAutonomousTransaction` (integer, paise): maximum amount an agent may autonomously transact without explicit user confirmation.
- `requireConfirmationAbove` (integer, paise): threshold above which user confirmation is required.
- `approvedAgents` (array[string]): list of agent identifiers allowed to act under merchant/user policy.

Only include other primitives if explicitly present in the specification. Do not invent new money primitives.

3. Policy evaluation contract
-----------------------------
Inputs (structured):
- `actor`: `{ id, role }` (user or agent identity)
- `user`: `{ id, policies[] }` (user-specific policy references)
- `merchant`: `{ id, policies[] }`
- `proposedAction`: string (e.g., `ORDER_PURCHASE`)
- `amount`: integer (paise)
- `currency`: string (INR)
- `orderContext`: optional object containing `{ orderId, items, subtotal, recordedPrices, cartSnapshot }`
- `applicablePolicies`: aggregated policy references for evaluation

Output (structured):
- `decision`: one of `ALLOW` | `BLOCK` | `REQUIRE_CONFIRMATION`
- `reason`: machine-readable reason code string
- `explanation`: human-friendly explanation for UI/audit
- `appliedPolicy`: reference to the policy that caused the decision
- `metadata`: optional structured data (e.g., evaluated thresholds, computed totals)

4. Policy precedence
---------------------
Apply policies in the following order of precedence (higher overrides lower):

- User-specific policy
- Merchant-specific policy
- Global policy

If multiple policies at the same precedence level conflict, the engine must use the most restrictive outcome (BLOCK > REQUIRE_CONFIRMATION > ALLOW) and record the conflict in `metadata` and `reason`.

5. Authorization workflow
-------------------------
End-to-end flow for a proposed money action (e.g., purchase):

1. AI proposes an action (tool output) — this is a non-authoritative proposal.
2. Backend constructs the `policy evaluation input` using authenticated actor, order context, and applicable policies.
3. Policy engine evaluates and returns `ALLOW` | `BLOCK` | `REQUIRE_CONFIRMATION`.
4. If `REQUIRE_CONFIRMATION`, backend issues an authorization request to the user (per-order authorization) and records an `authorization` entity with `scope=ORDER_PURCHASE`.
5. When authorization is granted, the backend validates the authorization against the order (amount binding) and then proceeds to execute payment actions.
6. Backend records all steps and decisions in `audit_events` and `agent_steps` as appropriate.

Important: Authorization is per-order (per the approved decision). Authorization records must include the bound `orderId`, authorized `amount`, `expiry`, and `actor` who approved.

6. Money-action safety
----------------------
To protect money actions, enforce the following deterministic checks in the backend before executing any payment:

- Amount validation: Verify `order.total` equals the amount presented to the policy engine and is within authorization scope.
- Currency validation: Only allow `INR` for Phase 1; reject mismatched currencies.
- Stale-price protection: If recorded prices changed between selection and payment, re-run policy evaluation and block if over-limit.
- Authorization binding: Authorization must reference the `orderId` and `amount`; payments must check authorization match before execution.
- Prevent policy bypass: All tool outputs (AI proposals) must be treated as untrusted; enforce policy evaluation on server-side canonical data.
- No LLM-controlled authorization: The LLM may prepare requests but cannot set `authorization.status` to `APPROVED`.

7. Audit events required
-------------------------
Record the following events in `audit_events` with structured metadata:

- `POLICY_EVALUATION` — includes input snapshot, decision, appliedPolicy, reason, metadata
- `POLICY_ALLOW` — when decision is ALLOW (reference evaluation id)
- `POLICY_BLOCK` — when decision is BLOCK (with reason)
- `POLICY_REQUIRE_CONFIRMATION` — when confirmation is required
- `AUTHORIZATION_REQUESTED` — when backend asks user to authorize (include orderId, amount, expiry)
- `AUTHORIZATION_APPROVED` / `AUTHORIZATION_REJECTED` — record actor and binding
- `POLICY_VIOLATION` — when a later action violates policy (e.g., price change exceeding authorization)

Audit records must include timestamps, actor identity, relevant resource ids, and a deterministic snapshot of inputs used for the decision.

8. Example policy JSON
-----------------------
```json
{
  "id": "policy_merchant_demo",
  "merchantId": "merchant_demo",
  "maxAutonomousTransaction": 500000,
  "requireConfirmationAbove": 300000,
  "approvedAgents": ["artha"]
}
```

9. Example evaluation cases
---------------------------
- Allowed purchase:
  - User-level policy allows up to 500000 paise. Proposed amount 459900 paise. Decision: ALLOW.

- Blocked purchase:
  - Merchant policy maxAutonomousTransaction: 500000 paise; user-specific override sets maxAutonomousTransaction: 300000 paise. Proposed amount 450000 paise. Decision: BLOCK (user policy more restrictive).

- Confirmation-required purchase:
  - requireConfirmationAbove = 300000 paise; proposed = 350000 paise. Decision: REQUIRE_CONFIRMATION.

- Amount exceeding autonomous limit:
  - proposed = 600000 paise, maxAutonomousTransaction = 500000 paise. Decision: BLOCK.

- Invalid/stale order:
  - recorded order total changed from 459900 to 529900 before payment; re-evaluate policy and block if authorization insufficient.

- Unauthorized agent:
  - `approvedAgents` does not contain the calling agent id; Decision: BLOCK.

10. Deterministic vs AI responsibilities
---------------------------------------
- AI responsibilities:
  - Propose candidate products and actions
  - Generate human-readable explanations and summaries
  - Assist with natural-language clarifications

- Deterministic backend responsibilities:
  - Policy evaluation and enforcement
  - Authorization issuance and binding
  - Payment execution and verification
  - Audit logging

11. Failure and edge-case handling
----------------------------------
- Unknown policy inputs: If required policy data is missing, default to the most restrictive outcome (BLOCK) and record `POLICY_VIOLATION`/`POLICY_EVALUATION` with reason `MISSING_DATA`.
- Partial failures: If policy engine is unavailable, fail-safe: block money actions and return an error explaining service unavailability.
- Concurrent modifications: Re-run policy evaluation at the time of money execution; use idempotent operations and optimistic locking on orders/payments.
- Authorization expiry: If authorization expires before payment, require re-authorization.

Decisions required (if any)
---------------------------
- No new high-level policy primitives are proposed beyond the approved list. If future work needs finer-grained primitives (e.g., per-category restrictions), those must be added via an approved decision.

---

End of `docs/policy-engine.md`.
