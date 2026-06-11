# LunarLogic × Forvis Mazars — Presentation Script
**Peter Sukits · Accounting Advisory · Chicago**
*Internal use only — Jonathan Rodriguez*

---

## BEFORE YOU START

- Pull up the dashboard in a browser tab before the meeting — have it ready to switch to live
- Confirm Peter is in accounting advisory / has clients in professional services
- Goal of this meeting: get a yes to a 2-week read-only pilot — that is the only ask
- Keep energy on the *problem* — let him say "yes, that's exactly what we deal with" before you pitch anything

---

## SLIDE 1 — COVER

**What to say:**

> "Thanks for taking the time, Peter. What I want to do today is pretty focused — I'm going to show you a specific problem that shows up in almost every professional services firm we've talked to, walk you through exactly how we solve it, and then show you the actual dashboard your team would be working in. We have about 30 minutes, so I'll keep it tight and leave time for questions. The proof point on the right there — 84% reduction in processing time, 19-day DSO improvement — that's a real client, Kaptain Clean, achieved in under 90 days. I'll come back to that. Let's start with the problem."

**Transition:** Click to Slide 2.

---

## SLIDE 2 — THE PROBLEM

**What to say:**

> "This is the workflow your clients are running today, and honestly it's probably something your team has seen firsthand during engagements."

*(walk the flow left to right, pointing at each box)*

> "It starts simply enough — bank statement comes in, they pull the invoice list from the ERP, and then the manual work begins. The matching step is where everything slows down. Someone is in a spreadsheet, cross-referencing deposit amounts against open invoices. That alone takes three to five hours per close cycle.

> Then a bulk wire arrives — let's say $218,000 from a single client covering eleven different invoices. Who decides how that gets split? There's no rule. It's whoever is in the office that day making a judgment call. And that decision gets documented nowhere.

> Then the entry goes into the ledger by hand, introducing re-keying risk. And when something doesn't match — which happens every cycle — the whole process starts over."

*(gesture to the three red cards at the bottom)*

> "The three things that fall out of this: a three-to-five day close cycle every single month, zero audit trail on any of the split decisions, and DSO creep — because the cash has effectively been received but it's sitting unposted, so the balance sheet still shows it as outstanding."

**Pause here.** Let him respond. If he says "yeah, we see this" — you're in. Move on.

**Transition:** "So here's what it looks like when we fix it."

---

## SLIDE 3 — THE SOLUTION

**What to say:**

> "Same workflow. Same six steps. We didn't reinvent the process — we automated it."

*(walk the flow again)*

> "Instead of someone downloading a bank statement, a Plaid webhook fires the moment a deposit hits. The invoice lookup is live against the ERP via API — no export, no stale data. The AI matching engine takes that deposit, scores every open invoice combination, and if it hits 87% confidence or above, it posts automatically. No human touch."

*(point to the exception path box)*

> "When it's below that threshold — say a partial payment or a new customer — it doesn't fail silently. It surfaces in Slack with the suggested match highlighted, and the reviewer approves it with one tap. That decision gets logged with their name, the timestamp, and the rule that was applied."

*(gesture to the stat strip)*

> "The result: under eight minutes from bank receipt to ledger posting. 87-plus percent of payments touched by no one. DSO improvement that typically shows up within the first 30 days. And every single decision is auditable — which matters a lot when you're talking about SOC 2 or internal controls work."

**Transition:** "Let me show you the side-by-side so the difference is really concrete."

---

## SLIDE 4 — BEFORE vs AFTER

**What to say:**

> "I want to be really direct about what changes here, step by step."

*(read down each row, left then right)*

> "Bank statement arrives — today, someone downloads a file and opens a spreadsheet. With us, a webhook fires. Nothing to download.

> Invoice list — today it's exported from the ERP and it's stale immediately. With us, it's a live API call.

> The matching — today that's three to five hours of manual work per cycle. With us, it's seconds.

> Bulk wire — today it's a judgment call with no documentation. With us, the oldest-invoice-first rule applies by default, it's applied automatically, and it's logged.

> And when mismatches happen — today the close cycle extends. With us, the dashboard reflects reality in real time and the close cycle closes the same day."

**Pause.** Let that sink in.

> "The question I always ask at this point is: which column does your client's team want to be in?"

**Transition:** "Here's what they'd actually be looking at day to day."

---

## SLIDE 5 — THE DASHBOARD

**What to say:**

> "This is the dashboard — and I'll actually pull it up live in a minute, but let me walk you through the four views first."

*(top left)*

> "DSO Trend. Rolling chart — 30, 60, or 90 days. The most important thing on this panel is the vertical line that marks the activation date. You can literally see the moment the trend changes direction. That's the visual I use in every renewal conversation."

*(top right)*

> "AR Aging by Customer. Not just buckets — an actual sortable table by customer, showing risk tier, average days to pay, and how much of their balance is in each aging bucket. Click any customer row and you drill straight to their invoices."

*(bottom left)*

> "Cash Application Queue. Every incoming payment, confidence score visible, matched customer, auto-applied flag. Click a row and you see the customer's running balance before and after that payment lands — so you know exactly what their exposure looks like."

*(bottom right)*

> "Cash Flow Forecast. This one is particularly useful for your clients' CFOs. Expected receipts by week, adjusted for each customer's actual payment history — not just contract terms. So if a customer is consistently 12 days late, the forecast reflects that."

**If time allows:** "Want me to pull this up live?"

**Transition:** "So — what does getting here actually look like?"

---

## SLIDE 6 — NEXT STEPS

**What to say:**

> "Three steps. Thirty days to live. No changes to anything they're running today."

*(step 1)*

> "First two weeks: we connect read-only. We're not touching any data — we're just watching. We measure current DSO, aging distribution, how long the cash application cycle is taking. That's the baseline. We need it to prove the ROI later."

*(step 2)*

> "Week three: automation goes live. Payments start matching. The dashboard is on. For anything below the confidence threshold, the Slack prompt handles it."

*(step 3)*

> "Day 30: we hand you a report. DSO before, DSO after. Hours per close cycle before, after. Auto-match rate. That report is built from your ERP data — not our estimates. It's the document you'd use to present this internally."

**The ask:**

> "What I'm asking for today is one pilot client — wherever the AR pain is highest on your book. We run the two-week baseline, go live, and in 30 days you have a documented result. If it doesn't move the numbers, you cancel. Sixty-day satisfaction guarantee, no questions asked."

**Pause. Wait for response.**

---

## CLOSING — IF THEY ASK ABOUT PRICING

> "Pricing is based on invoice volume. The Essentials tier is $697 a month for up to 150 invoices — that covers most of the firms we work with. The $2,500 implementation fee is waived on annual commitments. And we have a referral structure if this ends up being something you want to bring to your broader client portfolio — 20% recurring MRR, which adds up quickly at scale."

---
---

# COMMON OBJECTIONS & RESPONSES

---

## "We don't use QuickBooks — our clients are on [NetSuite / Sage / SAP / other]"

> "Understood — and that's exactly why we built this ERP-agnostic. The core engine connects via read-only API to whatever system is already in place. QuickBooks Online is where we started, but the matching logic and dashboard layer are independent of the ERP. When we set up the pilot, the first thing we do is confirm the API connection — that conversation usually takes about 15 minutes with your IT contact. What ERP are most of your professional services clients running?"

*(Listen — this tells you a lot about whether there's a near-term fit.)*

---

## "This sounds like it's for smaller companies. Our clients are more complex."

> "That's actually a really fair point to raise. The sweet spot right now is professional services firms in the 8-to-50 employee range — think consulting, advisory, legal, accounting practices. The complexity of the cash application problem scales with invoice volume and customer count, not necessarily headcount. If your clients are running more than 150 invoices a month or have a lot of bulk/partial payments, that's usually where the pain is sharpest. What does the AR volume look like for a typical engagement?"

---

## "Our clients already have AR staff handling this."

> "Right — and that's usually where the 200-plus hours per year comes from. The staff isn't going away; they're just spending those hours on exceptions and judgment calls instead of rote matching. What we typically see is that the AR person becomes the reviewer of exceptions rather than the doer of everything. The goal isn't to eliminate that role — it's to make it actually interesting work. The matching decisions that used to take a day now take eight minutes."

---

## "How does the AI matching actually work? What if it gets it wrong?"

> "Great question — and it's the right one to ask. The engine scores every possible match combination for an incoming payment: amount alignment, customer name fuzzy match, payment reference number, invoice age. That produces a 0-to-100 confidence score. We post automatically at 90 and above. Below that, nothing posts — it surfaces in Slack with the suggested match highlighted and a human approves it. So the risk of an incorrect posting is actually lower than the manual process, because the human is reviewing a suggested answer rather than building the answer from scratch. And every single decision — auto or human — is logged with the rule applied."

---

## "What happens to the data? Security concerns."

> "The connection is read-only during the baseline period — we can't write anything. When we go live, we write only payment application records back to the ERP, through the same OAuth flow the ERP vendor publishes. We don't store invoice data or customer PII beyond what's needed for the matching session. If your compliance team wants a security review before we connect, we support that — we can provide documentation on the integration architecture. That conversation typically takes a week and doesn't delay the pilot."

---

## "We'd need to get our client's approval to connect their ERP."

> "Absolutely — and that's the right way to run it. The pitch to their client is simple: read-only access, two-week observation, no changes to anything. In practice we've found that clients approve this quickly because the ask is low-risk and the payoff — a documented baseline and potential automation — is easy to explain. We can put together a one-paragraph summary you could send on their behalf if that helps."

---

## "What if the pilot doesn't work?"

> "Then you cancel and owe nothing beyond the first month. The 60-day guarantee is real — we don't make retention arguments if the numbers don't move. What we've found in practice is that the baseline measurement alone is valuable, because most clients have never had a clean measure of their cash application cycle time. Even if they decide not to continue, they leave with data they didn't have before."

---

## "We're not in a position to make a decision today."

> "Totally fair — I'm not asking for a decision today. The only ask is whether there's one client on your roster where this problem is real enough to run a two-week read-only observation. No commitment, no change to their setup. If what we see in two weeks looks interesting, we talk about going live. If not, we've both learned something. Is there a client that comes to mind where the AR close cycle is a source of frustration?"

*(Redirect to the pilot — always redirect to the pilot.)*

---

## "We already have a solution / they use [competitor]."

> "Good to know — what are they using? [Listen.] The comparison I'd make is less about features and more about where the work is still happening manually. Most of the tools in this space handle reminders and aging reports well. Where they fall short is the actual cash application step — the matching of incoming deposits to open invoices, especially when payments are bulk or partial. That's the 3-to-5 day close cycle problem. Is that part of the process covered by what they have, or is it still manual?"

---

*End of script.*
