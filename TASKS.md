# ARTHA — Phase 1 Tasks (Foundation and Architecture Build)

Notes: These tasks are derived strictly from the "Foundation and architecture build" section in [ROADMAP.md](ROADMAP.md). Do not implement tasks outside Phase 1 here.

## P1-T1: Backend foundation scaffold
- Task ID: P1-T1
- Goal: Initialize a minimal backend foundation using Node.js, TypeScript and Express.
- Scope: Project scaffold, TypeScript config, Express app, dev server, health endpoint, basic logging and error handling, environment configuration, and tests. No DB, AI, payments, or auth code.
- Acceptance criteria:
  - TypeScript project compiles
  - `npm run dev` starts the server
  - GET `/api/health` returns 200 and JSON
  - Basic request logging and centralized error handling present
  - Tests for health endpoint exist and pass
- Status: COMPLETE

## P1-T2: Define frontend, backend, and data-model boundaries
- Task ID: P1-T2
- Goal: Produce a clear specification describing responsibiI'll add docs/data-model.md describing entities, relationships, responsibilities, ER diagram, JSON samples, and API surface; I'll also update the todo list to mark P1-T2 in-progress.

Created data-model.md.

Summary:

What I created: data-model.md containing entity definitions, relationships, frontend/backend responsibilities, a Mermaid ER diagram, example JSON payloads for primary entities, a high-level API surface, verification against the architecture and safety model, and a short list of ambiguities/decisions needing approval.
Data model summary: Entities represent users, merchants, products, carts, orders, payments, policies, authorizations, agent_runs, agent_steps, and audit_events. Relationships link users→merchants→products, carts→orders→payments, agent_runs→agent_steps, and audit_events reference resources. Policies and authorizations are deterministic backend controls. Frontend is UI/validation only; backend enforces policies, pricing, payment, and audit.
Ambiguities / decisions requiring approval:
Use of paise (minor units) for currency representation.
Authorization scope granularity (per-order vs autonomous tokens).
Policy precedence when multiple policies apply (suggest user > merchant > global).
Inventory handling approach (reservation vs optimistic reduction).
I have not marked P1-T2 complete. Stopping now.lity boundaries for frontend, backend, and the initial data model (entities and relationships) to guide Phase 2.
- Scope:
  - Document key entities (users, merchants, products, carts, orders, payments, policies, authorizations, agent_runs, agent_steps, audit_events)
  - Specify ownership of responsibilities between frontend and backend (validation, rendering, compute)
  - Provide an initial ER diagram and JSON examples for primary entities
  - Produce a short API surface list (high-level endpoints) to be implemented later
- Acceptance criteria:
  - A `docs/data-model.md` (or equivalent) draft exists in the repo
  - ER diagram and example JSON payloads present
  - API surface list that aligns with the spec
- Status: COMPLETE

## P1-T3: Establish authentication and authorization structure (design)
- Task ID: P1-T3
- Goal: Design the authentication and role-based authorization model (USER, MERCHANT, ADMIN) and integration points for Phase 2/3.
- Scope:
  - Define authentication methods (JWT/session) and token lifecycle decisions
  - Define roles, permissions, and high-level protected resources
  - Specify where middleware will enforce authorization in the backend
  - Provide migration path for secure secret management
- Acceptance criteria:
  - Auth design document saved at `docs/auth.md`
  - Role & permission matrix defined
  - Example protected endpoint patterns documented
- Status: NOT_STARTED
 - Status: COMPLETE

## P1-T4: Design merchant sandbox and product-catalog model
- Task ID: P1-T4
- Goal: Define the merchant sandbox shape and the AI-readable product catalog format for onboarding merchants and synthetic testing.
- Scope:
  - Define merchant sandbox APIs (CRUD) at a high level (no implementation)
  - Specify CSV/JSON import format for `products.csv` and transformation rules to the internal catalog
  - Provide sample merchant and product fixtures for evaluation scenarios
- Acceptance criteria:
  - `docs/merchant-sandbox.md` with catalog schema and sample fixtures
  - Example `products.csv` template included under `docs/fixtures/`
- Status: NOT_STARTED

## P1-T5: Define deterministic policy and authorization layer (design)
- Task ID: P1-T5
- Goal: Design the policy engine contract and authorization workflow to ensure AI cannot bypass money controls.
- Scope:
  - Define policy primitives (maxAutonomousTransaction, requireConfirmationAbove, approvedAgents)
  - Define policy evaluation API signatures and expected structured outputs (ALLOW, BLOCK, REQUIRE_CONFIRMATION)
  - Specify audit events required for each policy decision
- Acceptance criteria:
  - `docs/policy-engine.md` describing primitives, APIs, and example rule sets
  - Example policy JSON files and sample evaluation cases
- Status: NOT_STARTED

## P1-T6: Confirm agent orchestration pattern and tool contract discipline (design)
- Task ID: P1-T6
- Goal: Define the orchestrator responsibilities, agent boundaries, and the strict tool contracts the agents will call.
- Scope:
  - Define orchestrator state model (agent run, steps, statuses)
  - Enumerate initial tool contracts (search_products, get_product, compare_products, create_order, check_policy, request_authorization, create_razorpay_order, verify_payment, record_audit_event)
  - Specify input/output schemas for each tool and validation rules to prevent injection
  - Clarify which systems are deterministic vs AI-driven
- Acceptance criteria:
  - `docs/orchestrator.md` with state model and tool contract definitions
  - Example agent run JSON demonstrating step sequence
- Status: NOT_STARTED
