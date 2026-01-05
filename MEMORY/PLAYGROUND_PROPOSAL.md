# SkillForge Playground: Unified Proposal

> Synthesized from research on January 4, 2026. Merges integration sandbox research with human preferences narrative.

---

## Dual Value Proposition

Skills in SkillForge encode two types of knowledge:

### 1. Procedural Knowledge (Integration Sandboxes)
**"Reference docs exist, but procedural reality is scattered, UI-driven, version-fragile, and developers end up learning from YouTube anyway."**

- Official docs are messy/fragmented
- Real gotchas cause first-attempt failures
- Agent can execute and verify success automatically
- High-signal errors enable self-correction

### 2. Human Preferences (Personal Taxonomy)
**"When using agentic software, users repeatedly mention preferences for how tasks are completed. Skills should capture these constraints."**

- Coding standards, library/version choices
- Database schemas and classification taxonomies
- Domain-specific rules (accounting categories, report structures)
- Personal mental models the LLM can't guess

**The ideal playground task combines both:** Integration pain (schema is strict, docs are scattered) + Preference encoding (taxonomy and classification rules are personal).

---

## Evaluation Criteria

| Criterion | Weight | Description |
|-----------|--------|-------------|
| Agent-executable | Required | No human-in-the-loop, no console clicking |
| E2E verifiable | Required | Objective pass/fail via automated tests |
| High-signal errors | High | Wrong usage produces learnable error messages |
| Preference encoding | High | Task benefits from personal taxonomy/rules |
| YouTube presence | Medium | Real developer pain = tutorial content exists |
| Local-first | Medium | Prefer emulators/mocks over real accounts |
| Setup complexity | Medium | Lower barrier = faster demo |

---

## Ranked Playground Options

### Tier 1: Recommended (Integration + Preferences)

#### 1. Notion Database Page Creation ⭐ TOP PICK
**Why it's perfect:**
- Schema validation is notoriously strict ([explicit "body failed validation" errors](https://developers.notion.com/reference/post-page))
- Heavy YouTube tutorial presence for "fix validation error" scenarios
- Naturally combines integration pain + preference encoding
- User has real personal use case (podcast classification)

**Integration Gotchas:**
| Gotcha | Error Message | Why It Trips People |
|--------|---------------|---------------------|
| Wrong property type | `body failed validation` | Select vs multi-select, date format |
| Missing required field | `property X is required` | Schema enforcement is strict |
| Invalid enum value | `X is not a valid option` | Must match exact database options |
| Template properties | `unsupported property` | Some props can't be set via API |

**Preference Encoding (in SKILL.md):**
```markdown
---
name: notion-podcast-tracker
description: Add podcast episodes to Notion with correct schema and classification
---
# Notion Podcast Tracker

## Database Schema
- **Type** (select): tech, business, science, culture
- **Priority** (select): high, medium, low
- **Status** (select): to-listen, in-progress, done
- **Duration** (number): minutes
- **Host** (text): primary host name

## Classification Rules
- Lex Fridman, Dwarkesh Patel → Priority: high
- Duration > 180 min → add "deep dive" tag
- Topics containing "AI", "programming" → Type: tech

## Common Gotchas
- Use select not multi_select for single-value fields
- Date format must be ISO 8601: "2026-01-04"
- Empty strings cause 400 errors - omit optional fields instead
```

**Verification:**
- Create page → GET page → assert properties match schema
- Classification accuracy: predicted category vs gold labels
- Validation error rate: should be 0 with skill, >0 without

**Demo Task Prompt:**
```
Add this podcast episode to my Notion database:

Title: "The Future of AI Agents"
Host: Lex Fridman
Duration: 195 minutes
Topics: AI, autonomous systems, robotics

Database ID: [DATABASE_ID]

Classify it according to my taxonomy and create the page.
```

**Setup:** Notion API token + test database (free tier works)

---

#### 2. Stripe Webhooks + stripe-mock
**Why it's good:**
- Webhooks + signatures + event types are common gotchas
- Fully local with [stripe-mock](https://github.com/stripe/stripe-mock)
- Excellent type/param errors for self-correction
- Some preference angle (event handling patterns, retry logic)

**Integration Gotchas:**
| Gotcha | Error Message | Why It Trips People |
|--------|---------------|---------------------|
| Wrong signature | `Webhook signature verification failed` | Timing, encoding, secret rotation |
| Unknown event type | `Unrecognized event type` | Must handle specific events |
| Idempotency key reuse | `Keys for idempotent requests...` | Must generate unique keys |
| API version mismatch | `API version X is not supported` | Event schema changes between versions |

**Preference Encoding (in SKILL.md):**
```markdown
## Event Handling Patterns
- payment_intent.succeeded → notify Slack + update DB
- customer.subscription.deleted → send churn email

## Retry Policy
- Use exponential backoff (1s, 2s, 4s...)
- Max 3 retries before dead-letter queue
- Use event ID as idempotency key
```

**Verification:**
- `stripe trigger payment_intent.succeeded` → assert handler side effects
- Signature verification: valid sig → 200, invalid → 400
- Idempotency: replay same event → no duplicate side effects

**Setup:** `docker run stripemock/stripe-mock` + Stripe CLI

---

### Tier 2: Strong Integration Story

#### 3. Firebase Emulator (Auth + Firestore Rules)
**Why it's good:**
- Rules/emulator wiring is nuanced; many step-by-step tutorials
- 100% local via [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)
- "Permission denied" errors are high-signal and learnable
- Deterministic, great for testing

**Integration Gotchas:**
| Gotcha | Error Message | Why It Trips People |
|--------|---------------|---------------------|
| Rules syntax | `Rules compilation failed` | Security rules DSL is tricky |
| Missing auth context | `Missing or insufficient permissions` | Must mock auth state |
| Wrong port | `Connection refused` | Emulator ports aren't obvious |
| Rules not deployed | `No rules configured` | Must explicitly deploy to emulator |

**Verification:**
- Unit tests that attempt reads/writes → assert allow/deny outcomes
- Rules coverage report shows which paths were tested

**Limitation:** Preference encoding is weaker (rules are technical, not personal taxonomy).

**Setup:** `firebase emulators:start`

---

#### 4. AWS Cognito Authentication
**Why it's good:**
- Docs are [notoriously confusing](https://repost.aws/questions/QUUytW_Z2PRQGp28Tko1y-sw/aws-sdk-documentation-is-a-mess)
- Heavy YouTube tutorial presence
- 100% local via [cognito-local](https://github.com/jagregory/cognito-local)
- Objective verification via JWT validation

**Integration Gotchas:**
| Gotcha | Error Message | Why It Trips People |
|--------|---------------|---------------------|
| SECRET_HASH required | `Unable to verify secret hash for client` | Must compute HMAC-SHA256 + base64 |
| Wrong hash encoding | `SecretHash does not match` | Hex instead of base64 |
| JS SDK + client secret | Silent failures | SDK doesn't support secrets |
| Auth code reuse | `invalid_grant` | Each code can only be exchanged once |

**Verification:**
- Signup → user created
- Login → valid JWT tokens
- JWT verifies against JWKS endpoint
- Protected endpoint: 200 with token, 401 without

**Limitation:** Preference encoding doesn't fit naturally.

**Setup:** `npx cognito-local`

---

#### 5. Webhook Signature Verification (Generic)
**Why it's good:**
- Universal pain point (Stripe, GitHub, Slack all use it)
- Real gotchas with encoding, timing, replay protection
- Fully local, no external service needed

**Integration Gotchas:**
| Gotcha | Source | Impact |
|--------|--------|--------|
| Payload encoding | Must use raw JSON, not parsed | Signature mismatch |
| Hex vs Base64 | Wrong encoding | Signature mismatch |
| Timestamp tolerance | Default 5 min window | Replay attacks |
| Timing attacks | Non-constant-time comparison | Security vulnerability |

**Limitation:** Very focused task, less impressive as standalone demo.

---

### Tier 3: Viable Alternatives

#### 6. Supabase Local Stack (Auth + RLS)
- RLS is famously "works until it doesn't"
- `supabase start` spins up local Postgres/Auth/Storage
- Similar to Firebase but PostgreSQL-based
- **Setup:** Requires Docker

#### 7. LocalStack AWS Pipeline (S3→SQS→Lambda)
- AWS "glue" has configuration footguns
- Put object → expect message → expect Lambda invoked
- **Setup:** Complex, many moving parts

#### 8. Kubernetes cert-manager + Ingress
- Classic "follow a video" setup
- `kind` creates local K8s in Docker
- **Setup:** High complexity, niche audience

#### 9. Terraform + LocalStack
- "Why does apply fail?" is common pain
- Explicit diagnostics and provider errors
- **Setup:** Requires LocalStack + Terraform knowledge

---

## Intentional Failure Test Suite

For each playground, bake in failure scenarios to demonstrate self-correction:

| Failure Type | Example | Expected Behavior |
|--------------|---------|-------------------|
| Schema-wrong | Missing required field | Agent reads error → fixes → retries |
| Auth-wrong | Invalid token/signature | Agent reads error → fixes auth → retries |
| Config-wrong | Wrong endpoint/port | Agent reads error → fixes config → retries |
| Preference-wrong | Wrong classification | Agent reads feedback → adjusts → retries |

**Repair Loop:**
1. `run` (attempt integration)
2. `verify` (check acceptance criteria)
3. If verify fails → agent uses error output to patch
4. Repeat until green or max iterations

---

## A/B Evaluation Framework

### Metrics

| Metric | Run 1 (No Skill) | Run 2 (With Skill) |
|--------|------------------|-------------------|
| Time to success | 3-5 minutes | < 1 minute |
| Failed attempts | 3-5 | 0-1 |
| External lookups | 5+ | 0 |
| Total steps | 15-20 | 3-5 |
| Preference corrections | 2-3 | 0 |

### Test Design

**Control (Run 1):**
- Agent starts fresh, can search/research
- No skill loaded
- Must discover gotchas through trial-and-error
- Must learn user preferences through corrections

**Treatment (Run 2):**
- Agent has skill pre-loaded
- Skill includes both procedural knowledge and preference rules
- Should skip research and corrections

**Measurements:**
- Time-to-green
- Success rate
- Token usage
- Error count before success
- Preference accuracy (for Notion)

---

## Recommended Demo Strategy

### Primary Demo: Notion Database + Classification
**Why:**
- Strongest combined story (integration + preferences)
- User has authentic personal use case
- Clear "without skill = repeated corrections" narrative
- Lower setup complexity than emulators

### Backup Demo: Stripe Webhooks
**Why:**
- 100% local with stripe-mock
- Widespread developer pain point
- Excellent error signals

### Quick Verification: Discord Webhooks (existing)
**Why:**
- Already implemented
- Good for "hello world" sanity check

---

## Implementation Priority

1. **P0: Notion playground** - Primary demo, validates both value propositions
2. **P1: Intentional failure suite** - Schema-wrong, auth-wrong scenarios
3. **P2: Stripe webhook backup** - Alternative demo if Notion setup is problematic
4. **P3: Metrics dashboard** - Visual comparison of Run 1 vs Run 2

---

## References

- [Notion API - Create Page](https://developers.notion.com/reference/post-page)
- [stripe-mock GitHub](https://github.com/stripe/stripe-mock)
- [Firebase Emulator Suite](https://firebase.google.com/docs/emulator-suite)
- [cognito-local GitHub](https://github.com/jagregory/cognito-local)
- [Webhook Signature Failures](https://www.svix.com/blog/common-failure-modes-for-webhook-signatures/)
