# Advisor review — Anna Weber, Steuerberaterin (Leipzig)

Reviewed: advisor queue + case detail, and the client app my clients see.
Written between two appointments, so I'll be direct.

Short version: the client side is genuinely good — better than anything my clients
have used. The advisor side is a demo of a workflow, not a workplace. It is built
around one case at a time and it assumes I trust it. I don't yet, and I'll tell you
exactly where the trust breaks.

---

## 1. My workday through this: morning triage

I open the laptop at 08:10 with coffee. I have somewhere between thirty and sixty
open Mandate. I want one question answered before I've swallowed: **what can I bill
today?**

**What works.** The line "4 cases · 1 ready to start · 2 waiting on clients" is the
right sentence. That is the sentence I would write myself. The filter pills with
live counts are right. Sorting by deadline proximity is right — that is the only
sort order that exists in July. Whoever added "Waiting on: Bank details for the
refund" on the row understood something important: I should never have to open a
case to learn why it's stuck. Priya's row tells me she owes me a bank detail and
that I chased her two days ago. Good. That is a row I can act on without clicking.

**Where it fails my throughput, in order of how much it costs me:**

**a) The queue is built for four rows and I have forty.** There is no search, no
client-name jump, no keyboard navigation, no density control. The rows are large
soft buttons with wrapping text — at forty rows that is a scroll of maybe four
screens. In July I'm looking for "Rossi" because he just phoned me, and I will be
scrolling with the phone against my shoulder. Give me a search box and let me type
three letters.

**b) The pinned case breaks the one rule the queue got right.** Amara sits at the
top with a 📌 regardless of her deadline. Marco is due in five days and is pushed
below her. The moment one case can outrank the deadline sort, I stop believing the
sort — and a sort I don't believe is decoration. Worse: Amara's row carries **no
deadline and no last-activity line at all**. Every other row tells me "Due in 12
days · Uploaded 2 documents · yesterday". The one live case tells me nothing. So
the single case I actually work is the one I have least information about in the
queue.

**c) "Last activity" is not "new activity".** The row says "Uploaded 2 documents ·
yesterday". It does not tell me whether I have already *seen* those two documents.
After a weekend I cannot tell my read cases from my unread ones, and I will open
eight cases to find the two that changed. That is eight clicks and about six
minutes I am not paid for. I need a "new since you last looked" mark — a dot, a
bold row, anything.

**d) Filed cases fall out of the world.** They count in "All" but belong to none of
the three pills. So the pills don't sum to All, and a filed case is only findable
by scrolling the unfiltered list. Add a "Filed" pill (or "Done this month"), because
when a client rings in October about their Bescheid, I need last season's case in
two seconds.

**e) It's July, hardcoded.** "Your cases — July." My year has a second season —
the Fristverlängerung cases, the Einsprüche, the Bescheid checks in November. The
header should follow the calendar, not the demo.

**f) Nothing tells me a client has gone quiet.** Priya was chased two days ago.
Nothing in this screen will ever tell me she was chased *twelve* days ago and has
not opened the app. I need aging on the wait, and I need it to change colour on its
own. Client no-shows are the single largest silent cost in my practice.

Verdict on triage: it answers "what can I work on?" in about five seconds *for four
cases*. It will not survive forty.

---

## 2. Case detail: is verify / flag / follow-up really ≤2 touches?

Let me count honestly, and then let me tell you the thing that matters more than
the count.

**Verify: one click.** Good. But see the next paragraph, because right now that
click is a promise I cannot legally make.

**I cannot see the document.** The table has a column called "File" and it shows me
a filename, or a dash. There is no thumbnail, no preview, no viewer, no download,
no page count. And next to that, a button that says **Verify ✓**. I am being asked
to certify a document I have never looked at. I sign these returns. If a client
uploads page 1 of a two-page Lohnsteuerbescheinigung sideways at 8 megabytes, this
screen will happily let me click Verify and will then tell the client "Checked ✓".
That is not a missing feature; that is the product asking me to take a legal risk on
its behalf. **Nothing else on this list matters more.** Give me a preview pane —
open on click, arrow keys between documents, rotate, zoom, page count visible on the
row — and then Verify becomes an honest button.

**Flag: three touches and a blank page.** Click "Flag issue", type free text into a
single-line box, click Confirm. Two problems. First, I type the same four sentences
forty times a week: blurry, wrong year, page missing, cropped edge. Those must be
one-click reason chips, with the note optional. Second, the note is a *one-line
input*. "The second page with the Sozialversicherung figures is missing — please
photograph the whole sheet flat on a table, not at an angle" does not fit in a
one-line input, and I write that exact sentence constantly. Make it a textarea, and
let a flag reason attach an example image, because a picture of a good photo fixes
more clients than a paragraph does.

**Flag only works on uploaded items.** I cannot flag, annotate, or nudge a row that
is still "To share". So for the item I most want to chase — the one that isn't
there — the row itself is dead, and I have to scroll to the composer at the bottom
and re-select the same item from a dropdown I just clicked past. That is the
clumsiest thing in the screen. Every row needs a "Chase this" action, and it should
prefill the composer, not make me restate what I just pointed at.

**Follow-up: four touches, and it will embarrass me.** Item dropdown, template
dropdown, read the text, Send. That is already over budget. But the real problem is
this: your template reads *"I need your <item> — the numbers on your
Lohnsteuerbescheinigung show a gap."* Pick "Photo ID" as the item and it generates
*"I need your Photo ID — the numbers on your Lohnsteuerbescheinigung show a gap."*
That message goes to a client under **my name**, and it is nonsense. It makes me
look like I don't know which document I'm asking for. Templates must be scoped to
the item they make sense for. Three templates is also not a template library; it's a
placeholder. Let me save my own — I already have them, in a Word file, and I will
paste them in on day one.

**"Recently sent: …" is not a history.** I need a dated thread per case: what I sent,
when, whether it was opened, whether it was answered. When a client says "you never
asked me for that", I need the timestamp, not a hint that fades on refresh.

**Client questions: one click sends a canned sentence under my name.** The three
quick replies are decent Anna-voice, I'll give you that — brief, warm, no bot
smell. But they are *generic* and there is no confirmation step. One mis-aimed
click sends "Not this time — I'll flag it if that changes" in answer to a question
about her Kirchensteuer, and now I own that sentence professionally. At minimum:
show me what will be sent and let me edit before it goes. Better: let the quick
replies be mine, saved per question type, and let me turn a client's question into a
checklist item or a follow-up in one click instead of retyping it into the composer.

**And a structural one: I cannot change the checklist.** The list is fixed —
identity, income, ALG-I, receipts. Real Mandate are not fixed. Pendlerpauschale
needs the commute distance and working days. Homeoffice needs the days count. A
Handwerkerrechnung needs the invoice *and* the bank transfer proof, because the
Finanzamt rejects cash. A second employer means a second Lohnsteuerbescheinigung.
Right now my only tool for all of that is free-text follow-ups, which means the
client gets a tidy structured checklist for the easy half of their case and a wall
of my messages for the half that actually needs structure. **Let me add an item to
the checklist** — title, plain-English explainer, required or optional — and it
appears on their phone with the same lovely explainer treatment as everything else.
That single change would move more cases per day than every other item on this page.

---

## 3. The prepare → approval → file loop: does it protect me?

Partly. The *shape* is right and I want to say so clearly: the client approves
before anything is filed, the client is told "Nothing is filed until you approve",
and the approval is an explicit act on their device. That is the correct architecture
and it is more than most tools give me.

Now the holes, and one of them is serious.

**Serious: the client is told I checked things I never said I checked.** The review
screen shows "What Anna checked — Your income statement against employer records /
Unemployment benefits declared correctly / Every deduction you're entitled to."
Three assertions of professional diligence, in my name, in a fixed list I did not
write and cannot edit. "Every deduction you're entitled to" is an absolute claim.
If I miss a Handwerkerleistung the client never mentioned, that screen is the
sentence they will read back to me. Either that list is generated from what I
actually ticked in the case, or it does not carry my name. This is the one item in
the whole product I would refuse to launch with.

**The draft form is four free-text boxes.** Income, tax paid, deductions, refund —
all strings, no validation, no arithmetic, no relationship to the documents I just
verified. I can type €54,200 into "income" when the Bescheinigung says €45,200 and
nothing in this system will blink. The numbers should be extracted from the
Lohnsteuerbescheinigung and shown to me *next to the document* for confirmation.
Reading a Lohnsteuerbescheinigung and typing four numbers is fifteen of my
forty-five minutes. That is the automation that makes this business model work, and
it isn't here.

**The approval leaves no record I could use.** "Approved" flips a status. I need a
locked snapshot: these figures, this document set, approved by this client at this
timestamp, retrievable in three years. Right now if a client disputes a figure after
the Bescheid arrives, I have a status word.

**"Mark as filed" is me telling the system a story.** No submission, no ELSTER
transfer ticket, no confirmation number, no Bescheid tracking. The client is then
shown "Filed." with a date and told the Bescheid arrives in four to eight weeks.
That is a promise made in my name on the strength of a button I pressed by hand. At
minimum give me a field for the transfer ticket and a place to log the Bescheid and
whether the assessed refund matched my estimate — checking the Bescheid *is* part of
the mandate, and this product currently believes the job ends at filing.

**There is no Vollmacht anywhere.** I cannot file for anyone without a power of
attorney, and there is a Vollmachtsdatenbank for exactly this. No Steuernummer
field, no responsible Finanzamt field (the app hardcodes "Finanzamt Berlin" for a
client I'd file in wherever she actually lives), no identity-verification record. A
tool for Steuerberater that has no Vollmacht step is not yet a tool for
Steuerberater.

**No "client declines" path.** Pricing says "Pay only when you approve." Fine for
the client. For me: I do the forty-five minutes, send the draft, and the client
goes silent or says no. What happens? There is no declined state, no revision loop,
no way to park or withdraw the mandate, and — critically — nothing that records that
the work was done. I need a "client requested changes" state with their reason, and
I need to know who pays for my time when approval never comes.

**One factual thing that will cost me phone calls.** The client's screen says
"Deadline 31 July — plenty of time with an expert". 31 July is the *self-filer*
deadline. My clients, precisely because they have a Steuerberater, get the extended
deadline under §149 AO — end of February of the second following year. So the app
is putting artificial July panic on people who have seven extra months, and it's
doing it on a screen with my face on it. Show the deadline that applies to *their*
case, and use it — it's also a lovely thing to be able to tell a client in June.

---

## 4. What's missing for a real practice

Beyond what's above:

- **Internal notes.** Not one field anywhere for "client is a Grenzgänger, check
  treaty" or "husband files separately, do not merge". Every case tool has this
  because every advisor needs it, and it must never be visible to the client.
- **Bulk actions.** Select six waiting cases, send the chase. In July I do this
  daily. Doing it one composer at a time is twenty-five minutes of clicking.
- **Multi-year and household.** One "Return 2025" per person. Backlog clients
  (2022–2025 in one go) are common and profitable, and married couples file
  together. Neither exists here.
- **Document quality signals.** Page count, resolution, orientation, file size,
  duplicate detection — shown on the row before I open it. Ideally the *client's*
  camera rejects the blurry one so it never reaches me; the scanner UI already has
  the corner brackets, make them do work.
- **Handover / holiday cover.** I take two weeks in August. There is no way to
  reassign a case, no case summary a colleague could read, no coverage state. My
  clients would simply sit unattended with my name on their screen.
- **Time and fee record.** Flat €119.99 per case is only a good deal if I know my
  actual minutes. Nothing here measures them, so neither of us can tell which case
  types are worth my time.
- **Deadline pressure view.** Filters are by status; my July crisis is by *date*.
  I want "overdue / this week / this month", and I want the tab title or a badge to
  tell me the count without opening the browser tab.
- **Export / archive.** I have a ten-year retention obligation. There is no export
  of the case, the documents, or the correspondence.
- **A destructive "Reset demo" button sits beside the case title,** in the exact
  spot a real product would put "Archive case". Move it before someone believes it.

---

## 5. Would I recommend it — and what makes me quit in July?

**What I'd recommend it for, honestly.** The client side does the thing I cannot do
at any price: it gets a nervous English-speaking client to send me the right
document, photographed properly, without phoning me. The item screens with
"Where do I find this?", the "I don't have this" escape that isn't a dead end, the
follow-ups arriving as small tasks with a *reason* instead of an open chat thread —
that is the difference between a two-touch case and a five-touch case, and I would
tell any colleague in my network that this half of it is worth having. The
structured non-chat is the whole product. Keep it non-chat. The day you add a free
message box, my margin dies and I leave.

**What makes me quit in July.** Not one big thing — the accumulation of small ones
on a Tuesday when I have nineteen cases due in ten days. I quit when I've opened
eleven cases to find the three that changed. I quit the first time I click Verify on
a document I couldn't see and it turns out to be page one of two. And I quit the
moment a client shows me the "What Anna checked" screen and asks me why I said I
found every deduction they were entitled to, when I never said it.

Fix the preview, fix that sentence, and this becomes a tool I'd defend to my
Kammer colleagues. Ship it as-is and it's a beautiful client app with an advisor
screen bolted on.

---

## TOP 5 CONCRETE ASKS (ranked)

1. **A real document viewer next to Verify — preview, rotate, zoom, page count on
   the row, arrow keys between documents.**
   *I am legally accountable for what I file, and right now you are asking me to
   certify a document you never show me.*

2. **Stop putting words in my mouth on the client's review screen — generate
   "What Anna checked" from what I actually ticked, or take my name off it.**
   *"Every deduction you're entitled to" is a professional claim, and I never made
   it.*

3. **Let me add and edit checklist items per case, with the same plain-English
   explainer treatment the built-in ones get.**
   *Half my real work is Pendlerpauschale, Homeoffice days and Handwerkerrechnungen
   with the transfer proof — none of which exist in your fixed list, so today they
   fall out of the tidy checklist and into free text.*

4. **Per-row actions with one-click reason chips: chase this item, or flag it
   "blurry / wrong year / page missing / cropped" with an optional note.**
   *Right now a flag is three touches with a one-line box, and chasing a missing
   document means scrolling to a dropdown to re-select the row I was already
   pointing at.*

5. **Make the queue survive forty cases: search, a "new since you last looked"
   mark, deadline-honest sorting with no pinned exceptions, and an aging indicator
   on cases waiting too long.**
   *In July I don't need to know what happened, I need to know what changed — and I
   won't trust a deadline sort that one case is allowed to jump.*

---

*Anna Weber*
*Steuerberaterin, Leipzig*
