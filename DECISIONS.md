# ARTHA Architectural Decisions

Each decision below is taken from the project specification and recorded here as a project-level decision for future implementation work.

## Decision: React + TypeScript for the frontend
Reason: The specification explicitly identifies React, TypeScript, and Tailwind CSS as the frontend stack. This matches the need for a responsive, interactive AI buyer and merchant dashboard experience.
Trade-offs if explicitly known: React adds component structure and state management complexity, but it provides strong UI ergonomics and is the approved stack for the project.
Status: Approved

## Decision: Node.js + TypeScript + Express for the backend
Reason: The specification explicitly identifies Node.js, TypeScript, and Express as the backend stack. This matches the API, orchestration, policy, payment, and webhook responsibilities required by the system.
Trade-offs if explicitly known: JavaScript runtime flexibility is traded for a clear, standardized server-side stack that fits the project requirements and team constraints.
Status: Approved

## Decision: PostgreSQL for the database
Reason: The system requires strongly related entities such as users, merchants, products, carts, orders, payments, authorizations, policies, agent runs, agent steps, and audit events. The specification specifically states that relational consistency is important.
Trade-offs if explicitly known: PostgreSQL introduces relational schema management and migration discipline, but supports integrity and consistency needed for payment and audit records.
Status: Approved

## Decision: Razorpay Test Mode only
Reason: The project is required to use Razorpay Test Mode only and must not use real-money transactions during development. This is a buildathon requirement and a safety constraint.
Trade-offs if explicitly known: Test Mode limits realism of production financial flows, but it preserves safety, cost control, and compliance with the project directive.
Status: Approved

## Decision: Deterministic policy enforcement
Reason: The specification makes policy enforcement a core safety requirement and explicitly states that the LLM cannot override policy. Deterministic checks are required for spending, merchants, product validity, and price changes.
Trade-offs if explicitly known: Deterministic checks reduce flexibility in dynamic decisioning, but they provide near-100% safety compliance and predictable enforcement.
Status: Approved

## Decision: LLM cannot directly authorize financial transactions
Reason: The specification states that the LLM must never independently authorize financial transactions and that the architecture separates AI reasoning from money control.
Trade-offs if explicitly known: This reduces AI autonomy in payment decisions but is essential for risk control, safety, and auditability.
Status: Approved

## Decision: Audit trail is mandatory
Reason: The project requires complete audit traces for important actions, including user requests, intent parsing, product selection, authorization requests, policy checks, payment initiation, verification, and order confirmation.
Trade-offs if explicitly known: Audit logging adds implementation and storage overhead, but it creates explainability and reviewability for money actions.
Status: Approved

## Decision: Evaluation framework is mandatory
Reason: The specification requires synthetic datasets, safety metrics, and model comparison. It explicitly states that evidence should drive model and system decisions rather than popularity or demo performance.
Trade-offs if explicitly known: Evaluation adds overhead, but it sharpens decision quality and safety accountability.
Status: Approved

## Decision: Merchant sandbox instead of fully external dependency
Reason: The specification introduces a merchant sandbox with example merchants, product catalogs, policies, and AI commerce configuration. This allows the project to demonstrate a complete AI buyer ecosystem without depending entirely on external e-commerce sites.
Trade-offs if explicitly known: A merchant sandbox requires internal modeling of product and policy data, but it gives deterministic control and testability.
Status: Approved

## Decision: Prompt injection defense is required
Reason: The specification explicitly calls out malicious merchant or product content that attempts to override user policies, budgets, or transaction controls. Merchant content is designated as untrusted data.
Trade-offs if explicitly known: Defensive filtering and strict tool contracts reduce flexibility, but they are necessary for safe and policy-compliant commerce behavior.
Status: Approved

## Decision: Webhook processing must be idempotent and verified
Reason: The specification requires signature verification, event validation, duplicate prevention, late-event handling, and audit logging for webhook processing.
Trade-offs if explicitly known: Idempotent logic adds complexity, but it prevents double-processing and payment-state corruption.
Status: Approved

## Decision: AI should be used for reasoning, not for final safety enforcement
Reason: The project explicitly states that AI should handle intent understanding, product reasoning, explanation, and tool use, but it should not handle final payment authorization, budget calculation, permission enforcement, or secret management.
Trade-offs if explicitly known: This narrows the AI role to the strengths of language reasoning while keeping deterministic control over money decisions.
Status: Approved

## Decision: Initial orchestrator should be a lightweight custom orchestrator
Reason: The specification says to initially build a lightweight custom orchestrator and evaluate frameworks such as LangGraph only if they solve a real problem.
Trade-offs if explicitly known: A custom orchestrator is simpler and more controlled initially, but it may require more custom engineering compared with a framework-based orchestration system.
Status: Approved

## Decision: Security controls must be implemented as core system requirements
Reason: The specification explicitly includes authentication, authorization, input validation, output validation, rate limiting, server-side secret management, webhook verification, idempotency, least-privilege tools, and prompt-injection defense.
Trade-offs if explicitly known: Safety controls add engineering work, but they are necessary for trustworthy transaction flows and buildathon compliance.
Status: Approved

## Decision: Transaction flow must be explainable and bounded
Reason: The buildathon and project goals require every money action to be explainable, bounded, and gated. The system must show why a transaction is allowed, what amount is involved, and what policy was applied.
Trade-offs if explicitly known: Explainability adds transparency and friction in the UI, but it is required for trust and compliance.
Status: Approved


## Decision: Currency representation — use minor units (paise)
Reason: Using integer minor units (paise) prevents floating-point rounding errors in money calculations and aligns with common payments practices.
Trade-offs if explicitly known: UI and reporting code must convert paise to rupees for display; developers must remember to use integer minor units across systems.
Status: Approved


## Decision: Authorization scope — per-order `ORDER_PURCHASE`
Reason: Restricting initial authorization scope to per-order keeps the authorization surface small, auditable, and safer for the initial implementation.
Trade-offs if explicitly known: This prevents issuing broader autonomous-spend tokens initially, which may reduce convenience in later advanced automation scenarios.
Status: Approved


## Decision: Policy precedence — user > merchant > global
Reason: More specific policies should override less specific ones to allow user or merchant exceptions while retaining global defaults.
Trade-offs if explicitly known: Policy evaluation logic must implement and document precedence rules to avoid unexpected behavior.
Status: Approved


## Decision: Inventory reservation at order creation
Reason: Reserving inventory when an order is created (while payment is pending) reduces oversell risk and keeps order state deterministic for agent flows.
Trade-offs if explicitly known: Requires reservation lifecycle management (expiration, release) and introduces complexity in inventory accounting and concurrency.
Status: Approved
