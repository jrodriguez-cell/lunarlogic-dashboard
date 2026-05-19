# n8n Best Practices — LunarLogic AR Platform

## 1. Config-Driven Architecture

### The Master Config Pattern
Store all client-specific settings in a Google Sheet, never in workflow nodes. Every workflow starts by reading the config sheet, filtering active clients, and looping with Split in Batches (batch size 1).

```
Schedule Trigger
  → Read Client_Master_Config (Google Sheets getAll)
  → Enforce Sandbox & Filter Active (Code node)
  → Loop: Process Each Client (Split in Batches, batch=1)
  → Get OAuth Credentials
  → [Token refresh logic]
  → Merge Config + Token
  → [Your workflow logic, referencing $('Merge Config + Token').first().json.*]
  → Next Client → (empty return → loops back to Split in Batches)
```

**Why:** Adding a new client means adding one row to the config sheet. No workflow edits required.

### What goes in the config sheet vs. n8n credentials
| Config Sheet | n8n Credentials Store |
|---|---|
| QB realm ID (per client) | QB OAuth client ID + secret (per QB app) |
| QB environment (sandbox/production) | Google Sheets OAuth token |
| Google Sheet document IDs | Outlook OAuth token |
| Slack channel IDs | Slack bot token |
| Email from addresses | |
| Cron expressions | |
| Net terms, lookback windows | |

**Rule:** If it changes per client, it belongs in the config sheet. If it's an OAuth secret, it belongs in n8n credentials.

---

## 2. OAuth Token Management

### Always refresh before QB calls after Slack waits
Slack approval nodes introduce unpredictable delays (minutes to hours). QuickBooks tokens expire after 60 minutes. Any QB API call that follows a Slack approval node MUST be preceded by a fresh token refresh.

```
[Slack Approval] → Refresh Token (HTTP POST /oauth2/v1/tokens/bearer) → Merge Config + Token → [QB API Call]
```

### Token storage pattern
- Store in Google Sheets: `access_token`, `refresh_token`, `expires_at`, `client_id`
- Read at workflow start, update after refresh
- Check expiry with a buffer: `Date.now() < new Date(expires_at).getTime() - 120000` (2-minute buffer)
- Route: token fresh → skip refresh branch; token expiring → refresh branch

### HTTP Request authorization header
```
Name: Authorization
Value: ={{ $('Merge Config + Token').first().json.authorization_header }}
```
The `authorization_header` field is pre-built as `Bearer <token>` in the Merge Config + Token node. Never use `= prefix` syntax in header values — n8n HTTP Request nodes do not support it.

---

## 3. QuickBooks API Rules

### Sandbox by default — always
All QB API base URLs must be derived from the `environment` column in the config sheet:
- sandbox: `https://sandbox-quickbooks.api.intuit.com`
- production: `https://quickbooks.api.intuit.com`

The `Enforce Sandbox & Filter Active` code node handles this derivation. Never hardcode a QB URL.

### QB Query Language limitations
- No `OR` operators in WHERE clauses — QB SQL does not support them
- Use a single WHERE condition per query
- Use `MAXRESULTS 100` to cap response size
- Date format: `YYYY-MM-DD` as a string literal
- Number comparisons: wrap values in single quotes — `Balance > '0'`

### minorversion
Always include `minorversion=73` as a query parameter on every QB API call. Store in config as `qb_minor_version` (integer). Older minor versions return different field shapes.

### Idempotency
QB API calls are not inherently idempotent. Guard against duplicate processing:
- For invoice emails: check `EmailStatus !== 'EmailSent'` before sending
- For appends: use `appendOrUpdate` with a stable matching column (e.g., `qb_invoice_id`)
- For lookback windows: set lookback = cron interval + 1 minute to avoid gaps without creating double-processing windows

---

## 4. Google Sheets Node Rules

### Always use defineBelow mode for writes
When writing multiple columns, always use **Define Below** mapping mode. Never use "Map Automatically" — it concatenates all values into a single cell.

```
columns:
  mappingMode: defineBelow
  value:
    column_a: ={{ $json.field_a }}
    column_b: ={{ $json.field_b }}
```

### appendOrUpdate vs. append
- Use `appendOrUpdate` with `matchingColumns` when you want to update an existing row (e.g., logging a payment link that may already exist)
- Use `append` for pure event logs where you always want a new row
- The matching column must be a value that `Extract/Prepare` nodes actually output — verify the column name matches exactly

### Dynamic sheet and tab references
Use `mode: "id"` for document IDs (supports expressions):
```json
"documentId": { "__rl": true, "value": "={{ $('Merge Config + Token').first().json.data_sheet_id }}", "mode": "id" }
```
For GID-based tab references:
```json
"sheetName": { "__rl": true, "value": "gid={{ $('Merge Config + Token').first().json.sales_log_gid }}", "mode": "name" }
```

---

## 5. IF Node Logic

### IF node output order
- Output 0 = condition is **TRUE**
- Output 1 = condition is **FALSE**

This is the source of the most common WF bug — inverted connections. Always label your IF nodes with what TRUE and FALSE mean (use the node Notes field).

### Defensive IF conditions
Check for existence before comparing:
```js
// Bad — throws if QueryResponse is undefined
$json.QueryResponse.Invoice.length > 0

// Good
($json.QueryResponse?.Invoice?.length || 0) > 0
```

---

## 6. Code Node Patterns

### Referencing upstream nodes safely
```js
// Always use ?. when the node might not have run
const cfg = $('Loop: Process Each Client').item?.json || {};

// $input.first() — the node directly connected upstream
// $('NodeName').first() — any node by name (must have run in this execution)
// $('NodeName').item — the CURRENT batch item from Split in Batches
```

### Never call $('NodeName') on a node that might not have executed
If a node is on a conditional branch that did not run, calling `$('NodeName')` throws a non-catchable error even inside try/catch. Use optional chaining and defaults:
```js
let token;
try {
  token = $('Store Fresh Token').first().json;
} catch (e) {
  token = $('Get OAuth Credentials').first().json;
}
```

### LangChain AI node output extraction
LangChain nodes wrap their output under an `output` key:
```js
const result = $input.first().json.output || $input.first().json;
```

### Returning no items to advance a loop
```js
// Signals the Split in Batches node to advance without output
return [];
```

---

## 7. Error Handling Pattern

### Circuit breaker (3-retry max)
Every QB API HTTP Request node should have its error output connected to an error handler chain:

```
[QB API Call] (error output) → Analyze Error → Increment Retry Count → Circuit Breaker?
  TRUE (≥3 retries) → Log to DLQ Sheet → Alert Dev Slack → Next Client
  FALSE (< 3 retries) → Get OAuth Credentials (retry from token refresh)
```

### Error classification
Retry-safe errors (network, rate limit, service unavailable):
- Status 0 — network/timeout
- Status 429 — rate limit (add delay node before retry)
- Status 503 — QB service unavailable
- Status 504 — gateway timeout

Non-retriable (route directly to DLQ):
- Status 400 — bad request (data problem, retry won't help)
- Status 401 — auth failure (token issue, needs manual fix)
- Status 404 — resource not found
- Status 5xx other — escalate

### Dead Letter Queue sheet columns
```
failed_at | workflow | client_id | node_name | status_code | error_message | retry_count | circuit_breaker_tripped | resolved_at | resolution_notes
```

---

## 8. Slack Credential Rules

| Token type | Credential type in n8n | Use case |
|---|---|---|
| `xoxb-` (bot token) | `slackOAuth2Api` | Posting messages, channel operations |
| `xoxp-` (user token) | `slackApi` | User-scoped operations (rarely needed) |

Never mix these. Bot token is correct for all AR notification and approval use cases.

---

## 9. Sub-Workflows for Shared Logic

For logic shared across WF1, WF2, WF3 (OAuth refresh, error routing, Slack alerts), extract into sub-workflows called via the Execute Workflow node:

```
Sub-workflow: "LL — OAuth Refresh"
  Input: { client_id, refresh_token, qb_oauth_basic_auth }
  Output: { access_token, authorization_header, expires_at }

Sub-workflow: "LL — Log Error + Alert"
  Input: { client_id, workflow, error_message, status_code, retry_count }
  Output: (none — side effects only)
```

**When to extract vs. inline:**
- Inline if the logic is < 20 lines and only used in one workflow
- Extract if the logic is reused across 2+ workflows or is > 30 lines

---

## 10. Testing Strategy

### Per-node testing
1. Pin test data on the node immediately upstream (right-click → Pin Data)
2. Execute the node in isolation
3. Verify output shape before connecting downstream

### Integration testing order
1. Test OAuth refresh in isolation — confirm token returned
2. Test one QB API call with a pinned token — confirm response shape
3. Test the full happy path with one client, `active=TRUE` for only that client
4. Test error path: temporarily break the QB URL and confirm DLQ receives the error

### Sandbox safety
- Always leave `environment=sandbox` in the config sheet during development
- Only change to `environment=production` after explicit client sign-off
- The `Enforce Sandbox & Filter Active` code node is the single enforcement point — never bypass it

### Execution log review
After each test run:
1. Check n8n execution log for any red nodes
2. Verify Google Sheets log rows were written with correct values
3. Verify Slack messages appeared in the correct channel
4. Confirm QB sandbox shows the expected records (invoices, payments, etc.)

---

## 11. Version Control

### Export workflows as JSON after every significant change
1. Open workflow → ⋮ menu → Download
2. Save to `artifacts/` directory in your repo with a version suffix: `WF2_v2.1.json`
3. Commit with a descriptive message: `wf2: add circuit breaker, fix timezone cron`

### Naming convention
```
WF1A_updated.json   — WF1A Sales Order Processing (PDF path)
WF1B_updated.json   — WF1B Sales Order Processing (text command path)
WF2_updated.json    — Proactive Payment Reminders
WF3A_updated.json   — Payment Receipt & Cash Application
read_config_3nodes.json — Reusable config pattern (paste into any workflow)
WF1_patches.json    — Patch nodes for WF1 (not a standalone workflow)
```

### What to never commit
- Real OAuth tokens or refresh tokens
- Production realm IDs (keep them only in your n8n credential store and config sheet)
- Any file containing `xoxb-` or `xoxp-` Slack tokens

---

## 12. Monitoring Checklist

Set up these checks in your n8n monitoring or a simple daily Slack cron:

| Check | Expected | Alert if |
|---|---|---|
| WF2 last run | Daily before 9:15 AM ET | No run by 9:20 AM |
| DLQ sheet row count | Stable or decreasing | New rows added |
| OAuth token `expires_at` | > 7 days out (refresh token) | < 7 days → manually re-authorize |
| QB API response time | < 2s | > 5s consistently |
| Slack AR summary | Posted daily | Missing in channel |

---

## Quick Reference: Common Expression Patterns

```js
// QB API URL
={{ $('Merge Config + Token').first().json.qb_base_url }}/v3/company/{{ $('Merge Config + Token').first().json.qb_realm_id }}/query

// Authorization header
={{ $('Merge Config + Token').first().json.authorization_header }}

// minorversion query param
={{ $('Merge Config + Token').first().json.qb_minor_version }}

// Today's date for QB query
={{ new Date().toISOString().split('T')[0] }}

// Payment link
={{ $('Merge Config + Token').first().json.qb_payment_link_base }}/app/invoice?invoiceId={{ $json.qb_invoice_id }}

// Slack channel from config
={{ $('Merge Config + Token').first().json.slack_ar_channel_id }}

// Current client name (in error handlers)
={{ $('Loop: Process Each Client').item?.json.client_name || 'Unknown' }}
```
