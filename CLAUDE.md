# LunarLogic — Claude Code Project Brain

## Product
AR automation platform targeting small professional services firms (8–20 employees) using QuickBooks Online and Slack. Automates the full Order-to-Cash cycle.

Owner: Jonathan Rodriguez — jrodriguez@lunarlogic.ai

## Proof Point
Kaptain Clean LLC: 84% reduction in invoice processing time, 19-day DSO improvement. Always lead with DSO reduction. It is the core value proposition.

## Pricing
- Essentials: $697/mo — 150 invoices
- Professional: $1,497/mo — 250 invoices  
- Business: $2,497/mo — 400 invoices
- Implementation fee: $2,500 (waived for 12-month commitments)
- Overage: $5/invoice
- Referral fee: 20% recurring MRR
- Guarantee: 60-day satisfaction guarantee

---

## Workflow Architecture

### WF1A/1B — Sales Order Processing & Invoice Creation
- 92 nodes (combined workflow)
- Trigger: Slack message — PDF upload OR text command
- Path A (PDF): Slack upload → Extract PDF → AI parsing (Claude + Structured Output Parser) → Customer validation in QB → New customer approval via Slack → QB Estimate creation → Milestone matching → Sales order approval via Slack → Invoice creation → Send via QB email
- Path B (Text): Slack text → AI intent classification (OpenAI) → QB customer lookup → Invoice draft → Slack approval → Send via QB email
- Has CFO agent node and EA agent node
- Uses Claude (Anthropic LangChain) for PDF parsing and customer matching
- Uses OpenAI for invoice request classification
- OAuth tokens stored in Google Sheets, refreshed via HTTP Request nodes
- Logs to Google Sheets (Sales Registry + Success Log + Dead Letter Queue)
- Status: Production

### WF2 — Proactive Payment Reminders v2.0
- 36 nodes
- Trigger: Scheduled daily at 9 AM Monday–Friday
- Flow: OAuth refresh → QB query for unpaid invoices → Filter pilot customers only → Filter out VIP exemptions → Process invoice data → Build email body → Send via Outlook (Microsoft Graph API) → Post AR aging summary to Slack → Log to Google Sheets
- VIP customer list stored in Google Sheets (exempt from reminders)
- Pilot customer list stored in Google Sheets (only these clients receive reminders)
- Sends reminder emails via Outlook, not QuickBooks native email
- Generates AR aging summary and posts to Slack daily
- Status: Production (client: Gualapack)

### WF4 — AR Aging Report (planned enhancement)
- Currently outputs to Google Sheets
- Target: Replace with interactive React dashboard

### WF3 — Payment Receipt & Cash Application (not yet built)
- TOP PRIORITY after dashboard
- Plaid webhook → parse transaction → fuzzy match against open QB invoices → auto-apply if confidence above 90% → Slack prompt for ambiguous bulk payments → update QB → log to Sheets
- Default rule: apply to oldest open invoice first

---

## Critical Technical Rules

### QuickBooks OAuth
- Tokens expire during human-in-the-loop Slack approval waits
- ALWAYS insert a fresh OAuth refresh node immediately before any QB API call that follows a Slack approval node
- Sandbox company ID: 9341456702590433
- OAuth credentials stored in Google Sheets and pulled at workflow start

### n8n / LangChain
- LangChain AI nodes wrap output under an output key
- Downstream nodes extract with: $input.first().json.output || $input.first().json
- Intermediate Slack nodes overwrite $input — reference upstream nodes by name using $('NodeName')
- Never call $('NodeName') on a node that might not exist — throws non-catchable error even inside try/catch

### Google Sheets
- Append Row requires Define Below for Each Column mode for multi-column writes
- Map Automatically mode concatenates into one cell — never use for structured data

### QuickBooks Query Language
- Does NOT support OR operators in URL parameters
- Use single WHERE condition only

### HTTP Request Nodes
- Authorization header must NOT use = prefix even inside expressions

### Slack Credentials
- Bot token (xoxb-): slackOAuth2Api credential type
- User token (xoxp-): slackApi credential type — never mix these

---

## Active Integrations
- QuickBooks Online: Accounting source of truth, OAuth 2.0
- Slack: Human-in-the-loop approvals and daily AR summary notifications
- Outlook / Microsoft Graph API: Customer-facing reminder emails (WF2)
- Google Sheets: OAuth token store, VIP list, pilot customer list, logging layer
- Plaid: Planned for WF3 payment receipt
- Claude (Anthropic LangChain): PDF parsing, customer matching
- OpenAI: Invoice request intent classification

---

## Client-Facing AR Dashboard — CURRENT BUILD TARGET

### Goal
Single URL dashboard a client can bookmark. Shows the health of their AR at a glance. Slack is the input device — this is the visualization layer.

### Stack
- React with Vite
- Recharts for all charts
- Vercel for hosting
- Clerk.dev for authentication (future — skip for now, build unauthed first)
- QuickBooks API as live data source (15-minute refresh)
- Data already available: WF2 already queries unpaid invoices and generates aging buckets daily

### Four Core Views to Build
1. AR Aging waterfall — Current / 1-30 / 31-60 / 61-90 / 90+ day buckets with dollar totals and invoice counts
2. DSO trend line — 90-day rolling chart with annotation marking the LunarLogic go-live date (this is the money metric — shows the line bending down)
3. Invoice status board — Sent / Viewed / Overdue / Paid with days outstanding per invoice
4. Customer payment behavior table — average days to pay per customer (identifies chronic late payers)

### Design
- Dark mode
- DSO is the hero metric — large number at the top, always visible
- Mobile responsive
- The go-live date annotation on the DSO chart is the single most important retention feature

---

## Active Clients and Prospects
- Kaptain Clean LLC: Live anchor client — 84% faster processing, 19-day DSO drop
- Gualapack: Live on WF2 payment reminders
- Pedro Fernandez: Manufacturing company implementation in progress
- Bluepoint M&A Advisory: Prospect — needs NetSuite integration demo
- Alex Calienes: Referral partner — media/creative agency, verbal agreement May 2026

---

## Memory Log
- 2026-05-16: Claude Code project initialized. Reviewed WF1A/1B (92 nodes) and WF2 (36 nodes) source files. Corrected node counts and confirmed WF2 uses Outlook via Graph API not QB email. Dashboard build starting now — React + Vite + Recharts + Vercel. WF3 is next after dashboard.
- 2026-07-10: Added the Accounts Payable (AP) suite and the combined Full Suite to the dashboard, mirroring the AR structure per the Complete Suite use-cases deck. New suite switcher in the sidebar (Receivables / Payables / Full Suite). AP tabs: AP Dashboard (DPO hero + trend into target sweet-spot band + payables aging + payment calendar), Bills (capture & GL coding), Approvals (routing rules + escalation timeline + queue), Payments (scheduling & discount capture), Vendors (payables by vendor + W-9/1099 tracking). Full Suite shows the Cash Conversion Cycle (CCC = DSO − DPO). DPO goal is a controlled number in the ~28–32d band, not the lowest. AP runs on demo data for every login (new src/data/apData.js generator); live QB path remains AR-only for qbsandbox and the honesty rule is intact. AP is labelled "Preview" in the UI — no live QB/n8n AP wiring yet.
