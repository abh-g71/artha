# ARTHA Roadmap

This roadmap reflects the approved project direction in ARTHA_PROJECT_SPEC.md and intentionally stops at the project documentation and control layer for Phase 0. It tracks the ordered path from project specification through final Razorpay submission without adding extra phase numbers beyond the phases already established by the specification.

## Phase 0 — Project Specification
Goal: establish the project identity, problem definition, scope, constraints, architecture, safety principles, and development controls.

Completed activities in scope:
- Confirm the project concept and value proposition
- Define the AI buyer workflow and user experience
- Capture the risk model and safety constraints
- State the architecture, tool boundaries, and payment safeguards
- Establish the audit, policy, and evaluation expectations
- Create project-level documentation and repository control files

Outcome:
- A clear project specification ready for implementation decisions
- A disciplined project foundation for future build work

## Core product implementation path
The project then proceeds through the implementation sequence implied by the specification, in this order:

### 1. Foundation and architecture build
- Define the frontend, backend, and data model boundaries
- Establish authentication and authorization structure
- Set up the merchant sandbox and product catalog model
- Define the deterministic policy and authorization layer
- Confirm the agent orchestration pattern and tool contract discipline

### 2. AI buyer and orchestration build
- Implement natural-language intent extraction
- Convert requests into structured buying requirements
- Search and retrieve merchant offerings
- Filter, compare, and rank products using trusted structured data
- Generate recommendation explanations from validated facts
- Maintain agent run and step state for traceability

### 3. Merchant platform and catalog flow
- Add merchant records, product data, inventory, pricing, and policy metadata
- Support merchant dashboards for catalog, AI commerce configuration, and policy setup
- Enable merchant approval patterns and autonomous purchase thresholds
- Ensure product and merchant content is treated as untrusted input

### 4. Authorization, policy, and transaction safety
- Enforce deterministic policy checks before any purchase action
- Require user authorization when the action falls outside policy or user permission
- Validate final order totals and prevent over-limit or stale-price transactions
- Ensure the AI never directly authorizes financial transactions
- Keep the money flow bounded and explainable

### 5. Razorpay Test Mode and payment execution
- Create merchant order flow before payment initiation
- Create Razorpay payment orders in Test Mode only
- Execute payment through the approved backend flow
- Verify payment state and ensure server-side secret handling
- Handle timeout, retry, and idempotency safely

### 6. Webhooks, verification, and payment lifecycle handling
- Verify webhook signatures
- Validate event payloads and payment states
- Update order and payment records safely
- Prevent duplicate processing and out-of-order state races
- Maintain a complete payment audit trail

### 7. Audit, explainability, and evaluation
- Record all meaningful actions across the user, agent, payment, and policy flow
- Present the agent timeline and transaction reasoning to users
- Build a synthetic evaluation dataset for safe commerce scenarios
- Measure policy compliance, authorization correctness, failure handling, and recommendation quality
- Track key safety metrics such as invalid-action rate, hallucination rate, and false approvals

### 8. Final Razorpay submission readiness
- Validate that the AI buyer behaves as a bounded, policy-governed commerce agent
- Demonstrate the full flow from user intent to transaction completion in Test Mode
- Confirm that every money action is explainable, authorized, verified, and auditable
- Ensure failure scenarios are handled gracefully
- Deliver a project that demonstrates strong engineering judgment and project safety

## Completion gate for the buildathon submission
The project is ready for the final Razorpay submission when all of the following are true:
- The agent can understand a user request and structure buying requirements
- Merchant discovery and product comparison are fact-based and trusted
- Policy enforcement is deterministic and cannot be bypassed by the LLM
- The user is required to authorize transactions when policy demands it
- Razorpay Test Mode is used exclusively
- Payment verification and webhook processing are complete and idempotent
- Audit records are complete and reviewable
- The system demonstrates at least one failure path and a graceful recovery flow
- Evaluation evidence supports policy compliance and transaction safety

This roadmap stops at the approved specification and buildathon submission scope. It does not extend into unapproved production or deployment work.
