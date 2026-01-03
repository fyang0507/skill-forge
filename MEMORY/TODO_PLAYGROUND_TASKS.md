# Playground Task Environments

> Future planning document for SkillForge demo tasks.

---

## Approach: Simulated "Poorly Documented" APIs

For a reliable hackathon demo, we'll create mock APIs that simulate real poorly-documented APIs. This gives us:
- Full control over the demo (no rate limits, no auth failures)
- Intentionally incomplete docs that mirror real frustrations
- "YouTube tutorial" content the agent can research via Gemini's video understanding

**Key insight:** The demo showcases Gemini 3's ability to learn from video content. We can either:
1. Use real YouTube tutorials about notoriously confusing APIs
2. Create short unlisted "tutorial" videos explaining our mock APIs

---

## Task 1: "PayGate" Payment API (Easy)

**Inspired by:** Stripe Connect, PayPal's confusing sandbox

**Mock API quirks (intentionally not in docs):**
- Auth token must be Base64 encoded (not mentioned in docs)
- Amounts are in cents, not dollars
- `currency` field is required but docs show it as optional
- Error responses use non-standard format

**Incomplete docs provided:**
```
POST /v1/charges
Creates a charge.
See authentication guide (link broken).
```

**YouTube research needed:** "PayGate API Integration Tutorial - Common Mistakes"

**Success:** Create a $10 charge that returns `status: succeeded`

---

## Task 2: "DataSync" Webhook API (Medium)

**Inspired by:** Slack Events API, Discord Webhooks

**Mock API quirks:**
- Requires signature verification with HMAC-SHA256
- Timestamp must be within 5 minutes (undocumented)
- Must respond with challenge on first request (buried in FAQ)
- Content-Type must be exactly `application/json` (not `application/json; charset=utf-8`)

**Incomplete docs provided:**
```
POST /webhooks/register
Registers a webhook endpoint.
Requires: url, events[]
Returns: webhook_id
```

**YouTube research needed:** "DataSync Webhook Setup - Why Your Verification Keeps Failing"

**Success:** Register webhook and pass verification handshake

---

## Task 3: "CloudStore" File API (Hard)

**Inspired by:** Google Drive API, AWS S3 presigned URLs

**Mock API quirks:**
- Two-step upload: get presigned URL, then PUT to it
- File metadata must be set BEFORE upload completes
- Max file size header name is `X-CloudStore-Max-Size` (not `Content-Length`)
- Presigned URLs expire in 60 seconds (docs say 5 minutes)

**Incomplete docs provided:**
```
Files API
Upload files to CloudStore.
Step 1: Create upload session
Step 2: Upload file
(That's it. No details.)
```

**YouTube research needed:** "CloudStore Upload Tutorial - The Presigned URL Gotcha"

**Success:** Upload a file and retrieve its public URL

---

## Video Content Strategy

**Constraint:** Gemini 3 can only process **public** YouTube videos (unlisted/private won't work).

**Approach: Real APIs + Real YouTube Tutorials**

This makes the demo MORE impressive - showing Gemini learning from real community-created content!

**Revised Task Selection Criteria:**
1. Must have free tier / sandbox mode
2. Must have genuinely confusing official documentation
3. Must have popular YouTube tutorials explaining the quirks
4. Must be achievable in a demo timeframe

---

## Revised Task Environments (Real APIs)

### Task 1: Spotify Web API - OAuth Flow (Medium)
- **Why it's hard:** Complex OAuth2 PKCE flow, refresh tokens, scopes confusion
- **YouTube tutorials exist:** Many creators explain "Spotify API for Beginners"
- **Free:** Yes, just needs a Spotify developer account
- **Demo task:** Get user's top tracks

### Task 2: Discord Bot with Slash Commands (Medium)
- **Why it's hard:** Gateway intents, privileged intents, slash command registration
- **YouTube tutorials exist:** Tons of "Discord.js Bot Tutorial" videos
- **Free:** Yes, free bot hosting
- **Demo task:** Create a bot that responds to `/hello`

### Task 3: Google Sheets API - Read/Write (Easy-Medium)
- **Why it's hard:** Service account vs OAuth, scopes, sharing permissions
- **YouTube tutorials exist:** "Google Sheets API Node.js Tutorial"
- **Free:** Yes, via Google Cloud free tier
- **Demo task:** Read data from a spreadsheet

---

## Alternative: Hybrid Mock + Real

For demo reliability, we can create **mock APIs that mimic real API quirks**, but have the agent research **real YouTube tutorials** about the actual APIs:

```
Mock "PayGate" API → Agent researches real "Stripe API Tutorial" videos
Mock "DataSync" API → Agent researches real "Discord Webhook Tutorial" videos
Mock "CloudStore" API → Agent researches real "Google Drive API Tutorial" videos
```

The agent learns from real videos but executes against controlled mock endpoints. Best of both worlds!

---

## Agent Research Flow

1. Agent receives task with incomplete mock docs
2. Agent tries API, encounters errors
3. Agent searches for YouTube tutorials (web search tool)
4. Agent analyzes video content using Gemini 3's native YouTube URL support:
   ```typescript
   // Gemini 3 can process YouTube URLs directly
   const response = await model.generateContent({
     contents: [
       { fileData: { fileUri: "https://youtube.com/watch?v=..." } },
       { text: "Extract the API authentication pattern from this tutorial" }
     ]
   });
   ```
5. Agent extracts learnings and succeeds
6. Agent creates skill capturing the knowledge

---

## Demo Flow for Judges

1. **Show empty skill library**
2. **Run Task 1 (Weather API) - First time:**
   - Watch agent research via YouTube
   - See trial-and-error attempts
   - Observe skill creation at the end
3. **Run Task 1 again:**
   - Skill lookup finds match immediately
   - Direct execution (no research)
   - Compare step count: ~20 steps → ~3 steps
4. **Show the generated SKILL.md**
5. **Repeat with Task 2/3 for variety**
