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

### Phase 2 — AI buyer and orchestration build

## P2-T1: Natural-language intent extraction
- Task ID: P2-T1
- Goal: Implement an intent-extraction service that converts free-text user requests into a normalized intermediate representation (IR).
- Scope: implement intent parsing service (server-side), LLM prompt templates (design-only for Phase 1), an internal API endpoint to parse and return IR, unit tests for common intents, and validation logic that enforces the IR schema.
 - Scope: implement intent parsing service (server-side), LLM prompt templates and intent extraction logic, an internal API endpoint to parse and return IR, unit tests for common intents, and validation logic that enforces the IR schema.
- Acceptance criteria: `/api/intent` (internal) returns a validated IR for sample inputs; test coverage for intent parsing; IR conforms to `docs/orchestrator.md` expectations; uses `paise` for numeric currency fields.
- Status: COMPLETE

## P2-T2: Structured buying requirements
- Task ID: P2-T2
- Goal: Define and implement the canonical schema for structured buying requirements and server-side validators/transforms.
- Scope: author `docs/requirements-schema.md` (or extend `docs/data-model.md`), implement a validation module, converters from IR to structured requirements, and unit tests for schema conformance and edge cases.
- Acceptance criteria: canonical schema checked into docs, validation module with tests, example transformations from IR to structured requirements present.
- Status: NOT_STARTED

## P2-T3: Merchant/product search and retrieval
- Task ID: P2-T3
- Goal: Implement `search_products` and `get_product` APIs that return deterministic product records from the merchant sandbox/catalog fixtures.
- Scope: API endpoints, index/query layer over fixtures, pagination and filter support (price ranges in paise), and integration tests aligning with fixtures in `docs/fixtures`.
- Acceptance criteria: deterministic responses for identical queries, filters validated (max results cap), tests demonstrating search and product retrieval, fixtures used for reproducible results.
- Status: NOT_STARTED

## P2-T4: Product filtering, comparison and ranking
- Task ID: P2-T4
- Goal: Implement `compare_products` service to score and rank candidate products deterministically using structured data.
- Scope: ranking algorithm implementation, deterministic scoring rules, explainability metadata (reasons per score), and unit/integration tests.
- Acceptance criteria: `compare_products` returns stable ranked lists given identical inputs, includes per-item reasons referencing canonical product fields, and tests cover priority weights and tie-breakers.
- Status: NOT_STARTED

## P2-T5: Recommendation explanations based on validated facts
- Task ID: P2-T5
- Goal: Build explanation generation that produces human-readable rationales strictly derived from validated, canonical product and policy data.
- Scope: explanation template library, integration with `compare_products`, tests ensuring explanations only reference validated fields (no hallucinated facts), and sample UI-friendly text outputs.
- Acceptance criteria: explanation outputs reference only canonical fields (price, inventory, seller ratings if available), include links to policy decisions when relevant, and tests to catch hallucination-like content.
- Status: NOT_STARTED

## P2-T6: Agent run and step state/traceability
- Task ID: P2-T6
- Goal: Implement persistence and APIs for `agent_run` and `agent_step` following `docs/orchestrator.md` to enable traceability, replay, and evaluation.
- Scope: storage schema/migrations (lightweight file/DB fixtures for Phase 2), APIs to create/read agent runs and steps, audit linkage via `record_audit_event`, and tests that persist and retrieve an example run.
- Acceptance criteria: example agent run can be persisted and retrieved; step-level inputs/outputs and timestamps are stored; audit linkage present; tests validate append-only semantics for steps.
- Status: NOT_STARTED

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
 - Status: COMPLETE

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
 - Status: COMPLETE

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
 - Status: COMPLETE
