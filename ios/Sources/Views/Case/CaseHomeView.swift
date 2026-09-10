import SwiftUI

// The home, from commitment to filed. Reads top to bottom as: a sentence that knows
// where you are, the four chapters to fill as tiles, who is helping you, then the plan.
// The sentence and the chips change with the phase; the layout stays.
struct CaseHomeView: View {
    @Environment(CaseStore.self) private var store
    @AppStorage(HomeLayout.storageKey) private var homeLayoutRaw = HomeLayout.carousel.rawValue
    @State private var showChat = false

    private var layout: HomeLayout {
        if let forced = ProcessInfo.processInfo.environment["HOME_LAYOUT"].flatMap(HomeLayout.init(rawValue:)) { return forced }
        return HomeLayout(rawValue: homeLayoutRaw) ?? .carousel
    }

    private var sent: Int { store.state.sharedCount }
    private var demoDraft: ReturnDraft { ReturnDraft(income: "52,400 €", taxPaid: "9,870 €", deductions: "2,310 €", refundEstimate: "1,184 €", note: nil) }
    private var total: Int { store.state.requiredItems.count }

    private var currentIndex: Int {
        switch store.state.phase {
        case .onboarding: 0
        case .sharing: store.state.submitted ? 2 : 1
        case .preparing: 2
        case .awaitingApproval, .approved: 3
        case .filed: 4
        }
    }

    private var steps: [TimelineStep] {
        let phase = store.state.phase
        let docsDone = currentIndex > 1
        return [
            TimelineStep(id: 0, title: "Started, matched with Anna", detail: "Your case is open and assigned."),
            TimelineStep(id: 1, title: docsDone ? "Documents sent" : "You send the documents",
                         detail: docsDone ? "Everything she needs is in. Tap to see it."
                            : (store.state.allRequiredIn ? "All filled. Send them to Anna when you're ready." : "\(sent) of \(total) filled so far."),
                         route: docsDone || store.state.allRequiredIn ? .checklist : nil),
            // Demo affordance: tapping the current step moves the case on through the real
            // actions (Anna's side of the loop), so the whole journey can be walked from the phone.
            TimelineStep(id: 2, title: currentIndex > 2 ? "Anna prepared your return" : "Anna prepares your return",
                         detail: currentIndex == 2 ? "Underway. Usually a few days." : (currentIndex > 2 ? "Done." : "Usually a few days."),
                         action: currentIndex == 2 ? { phase == .preparing ? store.send(.sendDraft(demoDraft)) : store.send(.startPreparing) } : nil),
            TimelineStep(id: 3, title: phase == .approved ? "Approved" : (currentIndex > 3 ? "Reviewed and approved" : "You review and approve"),
                         detail: phase == .approved ? "Anna is filing with the Finanzamt now." : "Nothing is filed until you say yes.",
                         action: phase == .approved ? { store.send(.markFiled) } : nil),
            TimelineStep(id: 4, title: currentIndex == 4 ? "Filed" : "Filed by 31 July",
                         detail: currentIndex == 4 ? "Went to Finanzamt Berlin on \(filedDate)." : "Refunds usually land in 4 to 8 weeks."),
        ]
    }

    var body: some View {
        // The body centres itself when it is short (the sharing phase); once it grows
        // past the screen the spacers collapse and the title sits on the shared line.
        ZStack(alignment: .bottom) {
        GeometryReader { geo in
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                Spacer(minLength: 0)
                VStack(alignment: .leading, spacing: 6) {
                    // The eyebrow fills the title row the other screens leave for the
                    // back button, so the headline starts where every other title starts.
                    Text("Tax return 2025 · Due 31 July")
                        .font(brandFont(.secondary, .medium, relativeTo: .subheadline))
                        .ink("--color-ink-soft")
                        .frame(height: ScreenTitle.rootTopInset - 13, alignment: .bottom)
                    headline.id(headlineText).transition(.rise)
                }
                hero.transition(.rise)
                // The hand-off moment gets its own screen: what is ready, one button to
                // send, a way back to check, and what happens after. Not the same tiles.
                if readyToSend { readyIntro.transition(.rise) }
                // While she fills: the chapters. When everything is filled: the hand-off
                // screen. Once it is sent: the chapters step aside and the plan takes over.
                Group {
                    if readyToSend {
                        readyActions
                    } else if store.state.phase == .awaitingApproval {
                        EmptyView() // the numbers and the approve button are the whole screen
                    } else if handedOver {
                        sentPlan
                    } else {
                        switch layout {
                        case .grid: chapterGrid
                        case .carousel: ChapterCarousel()
                        case .timeline: timelineHome
                        }
                    }
                }
                .transition(.rise)
                FlatCard { AdvisorBadge(note: openQuestion?.message) }
                NavigationLink(value: CaseRoute.faq) {
                    CardRow(systemImage: "questionmark.circle", title: "Questions everyone asks", subtitle: "Deadlines, refunds, what's next", height: 80) {
                        Image(systemName: "chevron.right").font(iconFont(TextRole.secondary.rawValue, weight: .medium)).ink("--color-ink-soft")
                    }
                }
                .buttonStyle(.plain)
                Spacer(minLength: 0)
            }
            .frame(minHeight: geo.size.height - 32)
            .padding(.horizontal, 20)
            .padding(.top, 8)
            .padding(.bottom, pinnedActions ? BottomActions<EmptyView>.scrollInset : 24)
            .animation(.brand, value: homeKey)
        }
        }
        // The hand-off actions stay in reach while she scrolls the rest: pinned, like the
        // document screen's actions. The card row stays in the page, above what happens next.
        if pinnedActions {
            BottomActions {
                VStack(spacing: 12) {
                    if readyToSend {
                        sendButton
                        reviewLink
                    } else {
                        PrimaryButton(title: "Approve return") { store.send(.approveReturn) }
                        Button { showChat = true } label: {
                            Text("Ask a question first").font(brandFont(.body, .bold, relativeTo: .body)).ink("--color-accent").frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
            .transition(.move(edge: .bottom).combined(with: .opacity))
        }
        }
        .animation(.brand, value: pinnedActions)
        .toolbar(.hidden, for: .navigationBar)
        .sheet(isPresented: $showChat) { ChatSheet() }
        .navigationDestination(for: CaseRoute.self) { route in
            switch route {
            case .checklist: ChecklistView()
            case .chapter(let group): ChecklistView(group: group)
            case .item(let itemId):
                if let item = store.state.items.first(where: { $0.id == itemId }) { ItemDetailView(item: item) }
            case .itemEscape(let itemId):
                if let item = store.state.items.first(where: { $0.id == itemId }) { ItemDetailView(item: item, startWithEscapeHatch: true) }
            case .itemScan(let itemId):
                if let item = store.state.items.first(where: { $0.id == itemId }) { ItemDetailView(item: item, startWithScanner: true) }
            case .faq: FAQView()
            }
        }
    }

    private var readyToSend: Bool { store.state.phase == .sharing && store.state.allRequiredIn && !store.state.submitted }
    // The two decision screens keep their actions in reach while she reads: send, and approve.
    private var pinnedActions: Bool { readyToSend || store.state.phase == .awaitingApproval }

    // One key for "what the home is showing"; a change animates every block in and out.
    private var homeKey: String {
        "\(store.state.phase)-\(readyToSend)-\(handedOver)-\(nextChapter?.group.rawValue ?? "none")-\(openQuestion != nil)"
    }
    // The plan shows once the documents are sent, steps aside on the review screen (the
    // numbers and the approve button are the whole point there), and returns after approval.
    private var handedOver: Bool { (store.state.submitted || store.state.phase != .sharing) && store.state.phase != .awaitingApproval }

    private var sentPlan: some View {
        StepTimeline(steps: steps, currentIndex: currentIndex, compact: true) { EmptyView() }
            .padding(.top, 4)
    }

    // Anna's latest unanswered question. It takes over the headline and her card, so
    // "respond to your advisor's follow-ups" is never something Betina has to go looking for.
    private var openQuestion: FollowUp? {
        store.state.followUps.filter { $0.from == .advisor && $0.status == .open }.sorted { $0.createdAt < $1.createdAt }.last
    }

    // MARK: ready to send

    private var readyIntro: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Have a last look if you like, then send it over. Anna starts as soon as it lands.")
                .font(brandFont(.body, .book, relativeTo: .body))
                .ink("--color-ink-soft")
                .fixedSize(horizontal: false, vertical: true)
            ResultBlock(label: "Ready to send", amount: "\(total) of \(total)", line: "Every document Anna asked for is in.")
        }
    }

    // The card step of the hand-off. Demo: one tap saves a mock card. Real build: the
    // payment sheet. Saved now, charged only at approval, so Anna never starts unbacked.
    @State private var cardAdded = false

    private var cardRow: some View {
        Button { withAnimation(.brand) { cardAdded.toggle() } } label: {
            CardRow(systemImage: "creditcard",
                    title: cardAdded ? "Visa •••• 4242" : "Payment card",
                    subtitle: cardAdded ? "Saved now, charged only when you approve." : "We save it now and charge only when you approve.") {
                if cardAdded { CheckCircle() } else { AddCircle() }
            }
        }
        .buttonStyle(.plain)
    }

    private var sendButton: some View {
        PrimaryButton(title: cardAdded ? "Send to Anna" : "Add a card to send") {
            if cardAdded { store.send(.submitDocuments(cardLast4: "4242")) } else { cardAdded = true }
        }
    }

    private var reviewLink: some View {
        NavigationLink(value: CaseRoute.checklist) {
            Text("Review what you added").font(brandFont(.body, .bold, relativeTo: .body)).ink("--color-accent").frame(maxWidth: .infinity)
        }
        .buttonStyle(.plain)
    }

    private var readyActions: some View {
        VStack(alignment: .leading, spacing: 14) {
            cardRow
            SectionLabel(text: "What happens next").padding(.top, 10)
            FactRow(title: "Anna checks each document and says if a photo needs a retake.", systemImage: "checkmark.seal", quiet: true)
            FactRow(title: "She prepares your return, usually within a few days.", systemImage: "doc.text", quiet: true)
            FactRow(title: "You review the numbers before anything is filed, and only then is the card charged.", systemImage: "hand.thumbsup", quiet: true)
        }
    }

    // The "just the timeline" layout: the five steps, with the current step as a cream
    // card that carries its own action (Continue to the next chapter, or Send to Anna).
    private var timelineHome: some View {
        StepTimeline(steps: steps, currentIndex: currentIndex) {
            if readyToSend {
                cardRow
            } else if store.state.phase == .sharing, let next = nextChapter {
                Button { Chapter.open(next.group, in: store) } label: { PrimaryButtonLabel(title: "Continue") }
                    .buttonStyle(.plain)
            }
        }
        .padding(.top, 8)
    }

    // MARK: hero, by phase

    // Chapters with something still to add. Drives the sentence at the top.
    private var chaptersLeft: Int {
        Chapter.all.filter { chapter in
            store.state.items.contains { $0.group == chapter.group && !$0.optional && ($0.status == .needed || $0.status == .issue) }
        }.count
    }

    // The first chapter that still needs something required. The headline points at it.
    private var nextChapter: Chapter? {
        Chapter.all.first { chapter in
            store.state.items.contains { $0.group == chapter.group && !$0.optional && ($0.status == .needed || $0.status == .issue) }
        }
    }

    // The title is a sentence that knows where Betina is and asks for the next chapter
    // in its own words. Short, said the way a person would say it. Two to three lines.
    // (lead, ask): the ask is the next chapter in green; nil when there is no ask.
    private var headlineParts: (lead: String, ask: String?) {
        if openQuestion != nil, store.state.phase == .sharing || store.state.phase == .preparing {
            return ("Anna has a question for you, Betina.", nil)
        }
        switch store.state.phase {
        case .sharing where !store.state.allRequiredIn:
            let lead = sent == 0 ? "Hi Betina, let's get started." : (chaptersLeft == 1 ? "Almost there, Betina." : "Nice one, Betina.")
            return (lead, nextChapter?.prompt ?? "One more and Anna can start.")
        default:
            return (headlineText, nil)
        }
    }

    private var headlineText: String {
        switch store.state.phase {
        case .onboarding, .sharing where !store.state.allRequiredIn: return ""
        case .sharing where !store.state.submitted:
            return "All set, Betina. Everything Anna needs is here."
        case .sharing, .preparing:
            return "That's everything, Betina. Anna has it from here, usually a few days."
        case .awaitingApproval:
            return "Anna's finished, Betina. Take a look before anything is filed."
        case .approved:
            return "Thank you, Betina. Anna is sending it to the Finanzamt."
        case .filed:
            return "It's filed, Betina. The Finanzamt takes it from here."
        }
    }

    private var headline: some View {
        let parts = headlineParts
        return (Text(parts.lead) + Text(parts.ask.map { " " + $0 } ?? "").foregroundColor(store.tokens.color("--color-success")))
            .font(brandFont(.display, .bold, relativeTo: .title))
            .ink("--color-ink")
            .fixedSize(horizontal: false, vertical: true)
            .padding(.bottom, 4)
    }

    private var chapterGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible(), spacing: 10), GridItem(.flexible(), spacing: 10)], spacing: 10) {
            ForEach(Array(Chapter.all.enumerated()), id: \.element.id) { i, chapter in
                Button { Chapter.open(chapter.group, in: store) } label: {
                    ChapterTile(symbol: chapter.symbol, title: chapter.title, items: store.state.items.filter { $0.group == chapter.group })
                }
                .buttonStyle(.plain)
            }
        }
    }

    @ViewBuilder private var hero: some View {
        switch store.state.phase {
        case .onboarding, .sharing, .preparing:
            EmptyView()
        case .awaitingApproval:
            VStack(alignment: .leading, spacing: 14) {
                if let draft = store.state.draft {
                    ResultBlock(label: "Estimated refund", amount: draft.refundEstimate, line: "Your return is ready to review.")
                    VStack(spacing: 0) {
                        SummaryRow(label: "Income", value: draft.income)
                        SummaryRow(label: "Tax already paid", value: draft.taxPaid)
                        SummaryRow(label: "Deductions Anna found", value: draft.deductions)
                        SummaryRow(label: "Unemployment benefits (ALG I)", value: "Declared")
                    }
                }
                Text("Prepared by Anna Weber, certified tax advisor; she carries professional liability for this return. When you approve, we charge the card you saved\(store.state.cardLast4.map { " (•••• \($0))" } ?? ""): €119.99, invoice by email. Nothing before.")
                    .font(brandFont(.caption, .book, relativeTo: .caption))
                    .ink("--color-ink-soft")
            }
        case .approved:
            Chip(label: "Filing in progress", tone: .green)
        case .filed:
            VStack(alignment: .leading, spacing: 14) {
                if let refund = store.state.draft?.refundEstimate {
                    ResultBlock(label: "Expected result", amount: refund, line: "You get a tax refund!")
                }
                Text("The Finanzamt now checks the return. You'll get the official statement (Steuerbescheid) by post, usually within 4 to 8 weeks, and the refund lands after that, straight to the IBAN you shared. Anna checks the statement for you.")
                    .font(brandFont(.secondary, .book, relativeTo: .subheadline))
                    .ink("--color-ink")
                VStack(alignment: .leading, spacing: 0) {
                    Text("More info").font(brandFont(.body, .bold, relativeTo: .headline)).padding(.bottom, 6)
                    NavigationLink(value: CaseRoute.faq) { LinkRow(systemImage: "doc.text", label: "What was filed") }.buttonStyle(.plain)
                    NavigationLink(value: CaseRoute.faq) { LinkRow(systemImage: "envelope", label: "What happens next") }.buttonStyle(.plain)
                    Button { showChat = true } label: { LinkRow(systemImage: "bubble.left.and.bubble.right", label: "Need more help?") }.buttonStyle(.plain)
                }
            }
        }
    }

    private var filedDate: String {
        guard let iso = store.state.filedAt else { return "today" }
        let withFractional = ISO8601DateFormatter()
        withFractional.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        let withoutFractional = ISO8601DateFormatter()
        withoutFractional.formatOptions = [.withInternetDateTime]
        guard let date = withFractional.date(from: iso) ?? withoutFractional.date(from: iso) else { return "today" }
        // English copy throughout, so the date never flips to German formatting on a de-locale device.
        return date.formatted(Date.FormatStyle(date: .long, time: .omitted).locale(Locale(identifier: "en_US")))
    }
}

struct SummaryRow: View {
    @Environment(CaseStore.self) private var store
    let label: String
    let value: String
    var body: some View {
        VStack(spacing: 0) {
            HStack { Text(label).ink("--color-ink-soft"); Spacer(); Text(value).fontWeight(.medium) }
                .font(brandFont(.secondary, .book, relativeTo: .subheadline))
                .padding(.vertical, 10)
            Rectangle().fill(store.tokens.color("--color-line")).frame(height: 1)
        }
    }
}
