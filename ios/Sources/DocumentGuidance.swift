import Foundation

/// One step in the "Where do I find this?" disclosure.
struct GuidanceStep: Identifiable {
    let id = UUID()
    let icon: String
    let text: String
}

/// Where-to-find-it copy for a single checklist item. `sourcingTip` is the
/// one-line summary used by EscapeHatchSheet's "I don't have this" flow;
/// `steps` back the fuller "Where do I find this?" disclosure on the item
/// detail screen. Kept in one place so the two stay consistent.
struct DocumentGuidance {
    let sourcingTip: String
    let steps: [GuidanceStep]

    static func forItem(_ item: ChecklistItem) -> DocumentGuidance {
        byId[item.id] ?? fallback(for: item.group)
    }

    private static let byId: [String: DocumentGuidance] = [
        "lohnsteuer": DocumentGuidance(
            sourcingTip: "Your employer's HR portal has it, or email payroll, they must provide it.",
            steps: [
                GuidanceStep(icon: "network", text: "Check your employer's HR or payroll portal, most issue it digitally each February."),
                GuidanceStep(icon: "envelope", text: "No portal? Email HR or payroll directly, they're required to send you one."),
                GuidanceStep(icon: "tray.full", text: "Or look through the February post, it often arrives as a paper slip alongside a payslip."),
            ]),
        "alg-bescheid": DocumentGuidance(
            sourcingTip: "Log in to arbeitsagentur.de → Postfach. The Bescheid is under your messages.",
            steps: [
                GuidanceStep(icon: "globe", text: "Log in at arbeitsagentur.de with your account."),
                GuidanceStep(icon: "tray", text: "Open Postfach (mailbox), the Bewilligungsbescheid sits there as a PDF."),
                GuidanceStep(icon: "envelope", text: "It's also mailed by post when it's first issued, worth checking that pile too."),
            ]),
        "tax-id": DocumentGuidance(
            sourcingTip: "Check the letter pile, it arrived by post. Anna can also request a copy.",
            steps: [
                GuidanceStep(icon: "envelope", text: "Look for the original letter from the Bundeszentralamt für Steuern, mailed once, when you first register an address."),
                GuidanceStep(icon: "doc.text", text: "It's also printed on every payslip, top right corner, labelled 'Steuer-ID'."),
                GuidanceStep(icon: "arrow.triangle.2.circlepath", text: "Lost both? Anna can request a reissue from the Finanzamt on your behalf."),
            ]),
        "id-doc": DocumentGuidance(
            sourcingTip: "Your passport or Personalausweis, a clear photo of the photo page is enough.",
            steps: [
                GuidanceStep(icon: "person.text.rectangle", text: "Your passport's photo page or the front of your Personalausweis both work."),
                GuidanceStep(icon: "photo", text: "A clear, flat photo is enough, no need to scan it properly."),
                GuidanceStep(icon: "building.columns", text: "Misplaced it? Your Bürgeramt can issue a replacement, usually within a couple of weeks."),
            ]),
        "bank": DocumentGuidance(
            sourcingTip: "Your IBAN, from your banking app.",
            steps: [
                GuidanceStep(icon: "iphone", text: "Open your banking app, the IBAN is usually under 'Account details'."),
                GuidanceStep(icon: "doc.plaintext", text: "Any recent bank statement has it printed at the top too."),
                GuidanceStep(icon: "questionmark.bubble", text: "Not sure which account to use? Anna just needs one that's yours, any account works."),
            ]),
        "deductions": DocumentGuidance(
            sourcingTip: "Any receipts or invoices you kept, digital or paper both work.",
            steps: [
                GuidanceStep(icon: "envelope.open", text: "Search your email for order confirmations, equipment, courses, relocation costs."),
                GuidanceStep(icon: "archivebox", text: "Check the paper pile, receipts for anything work-related count."),
                GuidanceStep(icon: "questionmark.circle", text: "Not sure something qualifies? Share it anyway. Anna decides what counts."),
            ]),
    ]

    private static func fallback(for group: ItemGroup) -> DocumentGuidance {
        switch group {
        case .employment:
            DocumentGuidance(sourcingTip: "Your employer's HR portal has it, or email payroll, they must provide it.",
                              steps: [GuidanceStep(icon: "network", text: "Check your employer's HR or payroll portal, or ask payroll directly.")])
        case .benefits:
            DocumentGuidance(sourcingTip: "Log in to arbeitsagentur.de → Postfach. The Bescheid is under your messages.",
                              steps: [GuidanceStep(icon: "globe", text: "Log in at arbeitsagentur.de and check Postfach (mailbox).")])
        case .identity, .deductions:
            DocumentGuidance(sourcingTip: "Check the letter pile, it arrived by post. Anna can also request a copy.",
                              steps: [GuidanceStep(icon: "tray.full", text: "Check your post pile, email, or ask Anna, she's seen every version of this.")])
        }
    }
}
