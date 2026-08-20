# ARTHA Architecture

## Overview
ARTHA is designed as a policy-aware AI commerce system that moves from natural-language intent to a bounded, verifiable transaction. The architecture separates reasoning from money control so that AI can assist with discovery, recommendation, and explanation while deterministic backend and policy systems control authorization, execution, and payment safety.

## Core principle
AI proposes.
Policy decides.
User authorizes when required.
Backend executes.
Razorpay processes.
Webhook confirms.
Audit records.
Evaluation proves.

The LLM must never directly authorize financial transactions.

## High-level system flow
User
→ React frontend
→ Node.js / Express backend
→ Authentication and authorization layer
→ Agent orchestrator
→ Intent, discovery, decision, and purchase agents
→ Policy engine and authorization checks
→ Merchant APIs and product data
→ Razorpay Test Mode payment flow
→ Webhook processing and payment verification
→ Audit event logging
→ Evaluation and reporting

## Frontend
Technology: React, TypeScript, Tailwind CSS

Responsibilities:
- AI buyer interface
- Product recommendations and comparison views
- Purchase authorization UI
- Agent execution timeline visualization
- Payment status display
- Merchant dashboard
- Policy management screens
- Audit and transaction history views

Purpose:
The frontend is the user-facing layer for requesting intent, reviewing recommendations, confirming or rejecting purchase actions, and observing the action timeline.

## Backend
Technology: Node.js, TypeScript, Express

Responsibilities:
- Authentication and user management
- Merchant management
- Product APIs
- Cart and order APIs
- Agent APIs
- Policy enforcement
- Authorization logic
- Razorpay integration
- Webhook processing
- Audit logging
- Evaluation APIs

Purpose:
The backend is the control plane for security, policy enforcement, orchestration coordination, and payment execution.

## Database
Technology: PostgreSQL

Responsibilities:
- Store users, merchants, products, carts, orders, payments, authorizations, policies, agent runs, agent steps, and audit events
- Maintain relational consistency across commerce and safety metadata
- Support auditing and future evaluation dataset storage

Purpose:
The database provides the trusted record layer for transaction state, policy decisions, and audit evidence.

## Authentication
Responsibilities:
- Identify users and merchants
- Enforce access control for commerce and administration actions
- Protect sensitive APIs and administrative operations
- Prevent unauthorized access to order, payment, or policy data

Purpose:
Authentication establishes who is acting, while authorization determines what they can do.

## Agent Orchestrator
Responsibilities:
- Coordinate the end-to-end shopping workflow
- Manage agent run state and progress
- Sequence requests from intent understanding to transaction completion
- Pass trusted structured outputs to policy and authorization layers
- Record major steps and decisions

Purpose:
The orchestrator is the central controller of the AI buyer workflow. It keeps task state, step history, and decision points explicit.

## AI components
AI should be used for natural-language understanding and reasoning where language or judgment adds real value.

AI responsibilities:
- Natural-language intent understanding
- Requirement extraction
- Ambiguous request clarification
- Product reasoning and ranking
- Recommendation explanation
- Tool selection where appropriate
- Conversational interaction

AI boundaries:
- The AI does not directly make final payment authorization decisions
- The AI does not calculate or enforce spending limits
- The AI does not verify payment state or database integrity
- The AI does not manage secrets
- The AI does not override system policy

## Tools
Initial controlled tools include:
- search_products()
- get_product()
- get_merchant()
- compare_products()
- calculate_order_total()
- create_cart()
- create_order()
- get_order()
- request_authorization()
- check_policy()
- create_razorpay_order()
- get_payment_status()
- verify_payment()
- record_audit_event()

Each tool must have:
- strict input schema
- strict output schema
- authentication
- authorization
- logging
- error handling

Purpose:
Tools give the agent bounded capabilities. They are the controlled interface between AI reasoning and system execution.

## Policy Engine
Responsibilities:
- Enforce deterministic checks on spending, merchant approval, product validity, and price changes
- Reject requests that exceed the allowed autonomous amount or violate merchant rules
- Block unsafe or stale transactions before execution
- Return structured decisions such as ALLOW, BLOCK, or REQUIRE_CONFIRMATION

Purpose:
The policy engine is the authoritative safety layer. The LLM cannot override it.

## Authorization system
Artha supports multiple autonomy levels:
- Level 0: Recommendation only
- Level 1: Assisted purchase requiring explicit user confirmation
- Level 2: Bounded autonomous purchase within approved policy limits

Responsibilities:
- Evaluate whether the user or merchant policy allows the action
- Require explicit authorization when required
- Record the authorization decision and its scope
- Guarantee that financial transactions cannot proceed without the required approval gate

Purpose:
Authorization turns an AI recommendation into a safe, permitted action.

## Merchant platform
Responsibilities:
- Provide merchant sandbox data and product catalogs
- Store pricing, inventory, delivery, and returns metadata
- Support AI-commerce configuration and policy settings
- Allow merchants to configure autonomous transaction limits and approvals
- Record transaction and audit history

Purpose:
The merchant platform gives Artha a complete commerce ecosystem for testing AI buyer behavior without relying on external sites alone.

## Razorpay Test Mode
Responsibilities:
- Create Razorpay orders in Test Mode only
- Execute payment flows under sandbox conditions
- Protect secret keys and keep them server-side only
- Support payment verification and lifecycle checks

Purpose:
Razorpay Test Mode allows the project to simulate real payment behavior without real-money transactions.

## Webhooks
Responsibilities:
- Receive payment lifecycle events from Razorpay
- Verify signature and event integrity
- Validate payloads and update payment status safely
- Prevent duplicate processing and late-event errors
- Record audit events for each processing outcome

Purpose:
Webhooks are the trusted confirmation path after the initial payment action. They must be idempotent and safe.

## Payment verification
Responsibilities:
- Confirm that the payment matches the expected order and amount
- Reconcile payment states after execution
- Reject mismatches and stale or unexpected amounts
- Protect against timeouts and retried operations without blind duplication

Purpose:
Verification closes the loop between transaction initiation and trusted final state.

## Audit system
Responsibilities:
- Record major user, agent, tool, policy, authorization, payment, and webhook events
- Preserve a timeline of actions and decisions
- Support explainability and post-transaction review
- Provide evidence for safety and evaluation

Purpose:
Audit records make every meaningful money action inspectable and accountable.

## Evaluation system
Responsibilities:
- Create synthetic scenarios for testing buyer behavior
- Measure intent extraction, policy compliance, recommendation quality, and payment safety
- Compare models and tools against objective criteria
- Track safety-sensitive events such as false approvals, blocked transactions, and prompt-injection handling

Purpose:
Evaluation provides evidence rather than assumptions and ensures the system is tuned around safety and success rather than demo performance alone.

## Safety rule
The LLM must never directly authorize financial transactions.

This is a hard architectural and product boundary. The AI may propose, explain, and recommend, but deterministic systems and user or policy gates must decide and authorize money actions.
