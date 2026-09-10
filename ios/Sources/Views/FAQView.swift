import SwiftUI

struct FAQItem: Identifiable {
    let id: String
    let question: String
    let answer: String
}

/// "Questions everyone asks", the expat FAQ, reachable from the case home
/// footer (pushed) and the liability result screen (as a sheet, pre-case).
let expatFAQs: [FAQItem] = [
    FAQItem(id: "annual", question: "Do I have to file every year?",
            answer: "Not always, employees with just one salary and nothing else often don't have to. But once you've had unemployment benefits, freelance income, or more than one employer in a year, filing usually becomes mandatory, like it is this year. Anna checks your specific situation and tells you exactly where you stand, so you never have to work out the rule yourself."),
    FAQItem(id: "steuer-id", question: "What's the difference between my Steuer-ID and Steuernummer?",
            answer: "Your Steuer-ID is permanent, assigned once, for life, the moment you first register an address in Germany. Your Steuernummer comes from your local Finanzamt and can actually change if you move. For a personal tax return, the Steuer-ID is the one that matters most. Anna keeps track of both, so you only ever need to hand over whichever one you have on hand."),
    FAQItem(id: "progressionsvorbehalt", question: "What is Progressionsvorbehalt, and why does it raise my rate?",
            answer: "It's a German quirk: certain tax-free income, like unemployment benefits, isn't taxed itself but still counts when working out the tax rate applied to the rest of your income. That can nudge your rate up a little, even though the benefit stays untaxed. It sounds unfair at first, but it's a rate calculation, not a hidden tax on the benefit. Anna applies it correctly so nothing gets missed, or overcharged."),
    FAQItem(id: "english", question: "Can I do all of this in English?",
            answer: "Yes. Every screen, every question, and every message from Anna is in plain English, no German tax vocabulary required unless you want it. The forms actually filed with the Finanzamt are in German, but that part is entirely Anna's job, not yours."),
    FAQItem(id: "deadline", question: "What if I miss the 31 July deadline?",
            answer: "It happens, and it's rarely a crisis. With a certified tax advisor like Anna representing you, the deadline extends automatically, often well into the following year. If you're worried about timing, just say so early and Anna will map out exactly where you stand and what, if anything, needs to happen sooner."),
    FAQItem(id: "visa", question: "Will filing my tax return affect my visa or residence permit?",
            answer: "No, if anything, the opposite is true. Filing correctly and on time is part of a clean financial record, which is generally a good sign to authorities, not a risk. It has no direct bearing on visa or residence status either way. Anna handles the filing itself; you just share the documents."),
    FAQItem(id: "refund", question: "What refund is typical?",
            answer: "It varies by situation, but people in circumstances like yours, a job change or a spell of unemployment during the year, often see a refund, commonly around €1,095. Every case is different, though, and Anna won't guess: she'll give you a real number once she's seen your documents, not before."),
]

struct FAQView: View {
    @State private var expandedID: FAQItem.ID?

    init(initiallyExpanded: FAQItem.ID? = expatFAQs.first?.id) {
        _expandedID = State(initialValue: initiallyExpanded)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
        ScreenTitle(text: "Questions everyone asks").padding(.horizontal, 20).padding(.bottom, 8)
        List {
            Section {
                ForEach(expatFAQs) { item in
                    DisclosureGroup(isExpanded: Binding(
                        get: { expandedID == item.id },
                        set: { expandedID = $0 ? item.id : nil }
                    )) {
                        Text(item.answer)
                            .font(brandFont(.secondary, .book, relativeTo: .subheadline))
                            .ink("--color-ink-soft")
                            .padding(.top, 6)
                    } label: {
                        Text(item.question)
                            .font(brandFont(.body, .medium, relativeTo: .headline))
                    }
                    .padding(.vertical, 4)
                }
            } footer: {
                Text("Still stuck on something else? Ask Anna directly from any document.")
            }
        }
        .listStyle(.plain)
        }
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
    }
}

/// Wraps FAQView in its own NavigationStack for presentation as a sheet
/// from screens that aren't already inside one (e.g. the pre-case
/// liability result screen).
struct FAQSheet: View {
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            FAQView()
                .toolbar { ToolbarItem(placement: .confirmationAction) { Button("Done") { dismiss() } } }
        }
        .presentationDetents([.large])
    }
}
