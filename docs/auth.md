 # ARTHA — Authentication & Authorization Design (P1-T3)

This document designs the authentication and authorization structure for ARTHA. It is a design artifact only — no code, libraries, secrets, or migrations are included.

Summary:
- Authentication identifies who is acting.
- Authorization enforces what the actor is permitted to do.
- All security-sensitive checks (policy, payment, authorization) run on the backend.

## 1. Authentication model

Status: The project specification and architecture identify authentication and role-based authorization as required but do not mandate a specific mechanism (JWT vs server sessions). Therefore the choice of JWT vs sessions is a Decision Required (see section "Decisions Required").

What is established:
- Roles: USER, MERCHANT, ADMIN (documented in PROJECT.md and ARCHITECTURE.md).
- Authentication must be server-side and protect all money-related endpoints and administrative operations.

Recommendations (design-level):
- Design the system to allow either stateless tokens (JWT) or stateful sessions behind a short-lived session store; do not hard-code one approach in the design documents. Keep interfaces (login, logout, token refresh, revoke) abstract and testable.

## 2. Token / Session lifecycle (conceptual)

Login:
- User submits credentials (or third-party SSO) to `POST /api/auth/login`.
- Server authenticates credentials; if valid, server issues authentication artifact(s): e.g., access token and optional refresh token, or session identifier.

Authentication state:
- Backend validates the authentication artifact on every protected request via middleware.
- Authentication middleware MUST also attach the authenticated `userId` and `role` to the request context for downstream authorization and audit.

Expiration:
- Access tokens / sessions should be short-lived (e.g., 15 minutes to 1 hour) to reduce risk.
- If refresh tokens are used, they should be long-lived but revocable and stored securely (see Secret Management).

Logout / Revocation:
- Logout endpoint (`POST /api/auth/logout`) invalidates the session or revokes refresh tokens.
- Revocation strategy is a Decision Required (blacklist store vs short-lived tokens without refresh tokens). The design must support server-side revocation for compromised tokens.

Secret handling:
- Cryptographic secrets used to sign tokens or encrypt sessions must be stored server-side in environment-protected storage or a secrets manager (see Secret Management section).

## 3. Roles

- USER: End users who request purchases, run agents, and authorize purchases when required.
- MERCHANT: Merchant owners/operators who manage product catalogs, configure merchant policies, and view merchant transactions and audits.
- ADMIN: Platform administrators with elevated privileges over merchants, policies, system configuration, and evaluation datasets.

## 4. Role & Permission Matrix (high-level)

Permissions map common actions to roles. This is a starting point and can be refined.

- Product CRUD: MERCHANT (own merchant products), ADMIN (all), USER (read-only)
- Merchant management: MERCHANT (own), ADMIN (all)
- Place order / initiate payment: USER (own orders), ADMIN (as needed)
- View orders/payments: USER (own), MERCHANT (own merchant orders), ADMIN (all)
- Policies CRUD: MERCHANT (own merchant policies), ADMIN (global)
- Authorizations: USER (request/approve own), ADMIN (inspect/revoke)
- Agent runs: USER (own), ADMIN (inspect)
- Audit events: ADMIN (full), MERCHANT (merchant-scoped), USER (own-related)

Enforcement note: Ownership checks (e.g., `merchantId` belongs to requester's merchant) MUST be performed server-side in authorization middleware.

## 5. Protected resources and endpoint patterns

Protect money- and policy-sensitive endpoints. Example patterns:

- `POST /api/orders` — protected: authenticated USER; server verifies authorization and policy before creating order
- `POST /api/orders/:orderId/payments` — protected: server role checks + policy + authorization
- `POST /api/webhooks/razorpay` — public receiver but must verify webhook signature and process idempotently
- `POST /api/merchants/:merchantId/products` — protected: MERCHANT (owner) or ADMIN
- `GET /api/audit` — protected: ADMIN (global) or merchant-scoped for MERCHANT
- `POST /api/policies` — protected: ADMIN (global) or MERCHANT for merchant-scoped policies

Pattern conventions:
- Use `Authorization: Bearer <token>` or secure `HttpOnly` cookie for session token (Decision Required).
- All protected endpoints must return 401 for unauthenticated requests and 403 for authenticated but unauthorized requests.

## 6. Backend authorization middleware responsibilities

Authorization middleware should:
- Validate authentication artifact and attach `userId` and `role` to request context.
- Perform role checks and ownership checks (e.g., merchant owner, order owner).
- Enforce policy checks where required (call to policy engine) before money actions.
- Normalize errors into standard 401/403 responses and record audit events for authorization failures.
- Rate-limit or flag suspicious authentication attempts (brute-force protection is out-of-scope for P1 but must be included in security plan).

Implementation guidance (design only):
- Keep middleware small and composable: `requireAuth()`, `requireRole(role)`, `requireOwnership(resource, paramName)`, `requirePolicyCheck(action)`.

## 7. Authentication vs Authorization separation

- Authentication answers "who are you?" — implemented by login, token validation, session state.
- Authorization answers "what can you do?" — implemented via role checks, ownership checks, and policy engine decisions.
- The code path MUST call authorization checks even when authentication succeeded; never rely on the presence of `role` alone to permit money actions without explicit policy/authorization validation.

## 8. Secret-management approach

- Secrets (signing keys, session encryption keys, third-party API keys) MUST be stored in a secrets manager (recommended) or environment variables for local dev. Examples:
  - Use Vault / AWS Secrets Manager / Azure Key Vault in production
  - Use `.env` only for local development; ensure `.env` is in `.gitignore` (already present)
- Rotate signing keys periodically and support key rotation in token verification (key identifiers).
- Limit access to secrets by role and audit access to secrets retrieval.

## 9. Security constraints relevant to ARTHA

- The LLM cannot authorize financial transactions: all money-related authorizations must go through policy and authorization records.
- Payment secrets (Razorpay keys) must never be exposed to clients.
- Webhooks must be verified via signature and processed idempotently.
- All network traffic must use TLS in production.
- Enforce input validation and treat merchant content as untrusted data.
- Log authentication and authorization events to `audit_events` with minimal sensitive data (do not log secrets or raw credentials).
- Enforce least-privilege on tokens: short-lived access tokens and minimal scopes.

## Verification against ARTHA safety principle

This design enforces:
- "AI proposes" — AI outputs are not trusted for authorization.
- "Policy decides" — Authorization middleware calls the policy engine before money actions.
- "User authorizes when required" — The system records and validates authorizations for orders.
- "Backend executes" — Payments and Razorpay interactions remain backend-only responsibilities.
- "Audit records" — Authorization and auth events are recorded in `audit_events`.

## Approved decisions

The following authentication decisions have been reviewed and approved for Phase 1 implementation. These choices are documented here for implementation guidance; P1-T3 remains a design task and no code has been added.

1. Authentication mechanism
  - Decision: Use JWT-based authentication (stateless access tokens).
  - Reason: JWTs provide a clear, standard stateless access token format suitable for APIs and simplify scaling the API servers.
  - Trade-offs: JWTs require careful handling of refresh tokens and rotation to support revocation and key rotation.

2. Access-token transport
  - Decision: Use `Authorization: Bearer <access-token>` header for access tokens.
  - Reason: Simpler for API clients and aligns with many HTTP API patterns.
  - Trade-offs: Cookies with `HttpOnly` flags can provide CSRF protection patterns; using bearer tokens requires attention to storage on the client to avoid XSS risks.

3. Refresh tokens
  - Decision: Use rotating refresh tokens.
  - Reason: Rotating refresh tokens mitigate replay attacks and enable revocation on reuse.
  - Trade-offs: Requires server-side tracking of refresh token identifiers and rotation logic.

4. Revocation strategy
  - Decision: Access tokens will be short-lived; refresh tokens are revocable and rotated on use. Do not introduce an access-token blacklist in the initial implementation.
  - Reason: Short-lived access tokens limit exposure; rotating revocable refresh tokens enable revocation without the complexity of an access-token blacklist.
  - Trade-offs: Some revocation edge-cases remain (e.g., active access tokens until expiry); a blacklist can be added later if required.

5. Phase 1 authentication scope
  - Decision: Support email/password authentication only in Phase 1. No SSO or MFA in Phase 1.
  - Reason: Narrowing scope reduces implementation complexity and risk for the initial milestone.
  - Trade-offs: SSO and MFA are deferred; plan to add them in later phases if required for increased security or enterprise use.

## Next steps (after approval)

- Capture approved choices in `DECISIONS.md` and implement middleware interfaces accordingly in P1-T3 implementation.
- Add tests for authentication flows and middleware behavior before integrating with other systems.

---

End of `docs/auth.md`.
