import SwiftUI
import PhotosUI

struct ItemDetailView: View {
    @Environment(CaseStore.self) private var store
    let item: ChecklistItem
    // "Next" moves to the following document in place, so Back still returns to the list
    // and the change reads as a page turn instead of a fresh push.
    @State private var currentId: String
    @State private var showEscapeHatch: Bool
    @State private var showScanner: Bool
    @State private var photoItem: PhotosPickerItem?

    // `startWithEscapeHatch`/`startWithScanner` are demo/screenshot affordances ONLY,
    // driven by CaseRootView's CASE_SCREEN=item-escape:<id> / item-scan:<id> hooks,
    // since neither can be tapped open from outside the app.
    init(item: ChecklistItem, startWithEscapeHatch: Bool = false, startWithScanner: Bool = false) {
        self.item = item
        _currentId = State(initialValue: item.id)
        _showEscapeHatch = State(initialValue: startWithEscapeHatch)
        _showScanner = State(initialValue: startWithScanner)
    }

    private var live: ChecklistItem { store.state.items.first { $0.id == currentId } ?? item }

    private var needsUpload: Bool { live.status == .needed || live.status == .issue }

    // The next document still needed: the rest of this chapter first, then the others,
    // required before optional. So one tap carries her through the whole hand-off.
    private var nextNeeded: ChecklistItem? {
        let open = store.state.items.filter { $0.id != live.id && ($0.status == .needed || $0.status == .issue) }
        let ranked = open.sorted { a, b in
            let aSame = a.group == live.group, bSame = b.group == live.group
            if aSame != bSame { return aSame }
            if a.optional != b.optional { return !a.optional }
            return false
        }
        return ranked.first
    }

    var body: some View {
        ZStack(alignment: .bottom) {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                ScreenTitle(text: live.title)
                // A chip only when there is a state worth naming: sent, checked, or a fix
                // needed. Before the first upload the buttons below already say what to do.
                if live.status != .needed || live.optional {
                HStack(spacing: 8) {
                    if live.status != .needed { StatusPillView(status: live.status) }
                    // The chapter list says "optional" once, up front; that context is lost
                    // inside a single item's own page.
                    if live.optional { Chip(label: "Optional", tone: .neutral) }
                    Spacer()
                }
                }

                if live.status == .issue, let note = live.issueNote {
                    Label(note, systemImage: "exclamationmark.circle.fill")
                        .padding(12)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background(store.tokens.color("--color-issue").opacity(0.12),
                                    in: RoundedRectangle(cornerRadius: store.tokens.size("--radius-control")))
                        .foregroundStyle(store.tokens.color("--color-issue"))
                }

                if let german = live.germanName {
                    Text(german).font(brandFont(.secondary, .book, relativeTo: .subheadline)).ink("--color-ink-soft")
                }
                Text(live.explainer).font(brandFont(.body, .book, relativeTo: .body))

                // One "Tip" block: what the document looks like, then where to find it.
                // Plain rows on the page (catalog rule 6), no disclosure to open.
                VStack(alignment: .leading, spacing: 12) {
                    SectionLabel(text: "Tip")
                    FactRow(title: live.lookLike, systemImage: "doc.text", quiet: true)
                    ForEach(DocumentGuidance.forItem(live).steps) { step in
                        FactRow(title: step.text, systemImage: step.icon, quiet: true)
                    }
                }
                .padding(.top, 4)

                if live.status == .uploaded || live.status == .verified {
                    Label(live.status == .verified ? "Checked by Anna ✓" : "Sent to Anna, she'll check it",
                          systemImage: live.status == .verified ? "checkmark.seal.fill" : "paperplane.fill")
                        .font(brandFont(.secondary, .medium, relativeTo: .subheadline))
                        .foregroundStyle(store.tokens.color("--color-success"))
                }

            }
            .padding(.horizontal, 20)
            .padding(.top, 2)
            .padding(.bottom, BottomActions<EmptyView>.scrollInset)
        }
        .id(currentId)
        .transition(.slideForward)
        if !needsUpload {
            BottomActions {
                VStack(spacing: 14) {
                    if let next = nextNeeded {
                        PrimaryButton(title: "Next: \(next.title)") { withAnimation(.brand) { currentId = next.id; photoItem = nil } }
                    } else {
                        PrimaryButton(title: store.state.allRequiredIn ? "All in. Back to overview" : "Back to overview") { store.popToRoot() }
                    }
                }
            }
        }
        if needsUpload {
            BottomActions {
                VStack(spacing: 14) {
                    // Betina's #5 ask: before the very first upload, say where the photo goes.
                    Label("Encrypted in transit. Only Anna sees your documents.", systemImage: "lock.fill")
                        .font(brandFont(.micro, .book, relativeTo: .caption))
                        .ink("--color-ink-soft")
                    // One row: the library as the wide secondary, the camera as a square
                    // lime primary on the right.
                    HStack(spacing: 10) {
                        PhotosPicker(selection: $photoItem, matching: .images) {
                            SecondaryButtonLabel(title: "Choose from library")
                        }
                        .tint(store.tokens.color("--color-ink")) // stops PhotosPicker's own link-blue tint
                        .onChange(of: photoItem) { _, newValue in
                            if newValue != nil { upload(named: "library-\(live.id).jpg") }
                        }
                        // Prototype: the camera counts the document as sent straight away.
                        // A real build opens the scanner (still reachable via the item-scan hook).
                        PrimaryIconButton(systemImage: "camera", label: "Take a photo") { upload(named: "photo-\(live.id).jpg") }
                    }
                    Button("I don't have this") { showEscapeHatch = true }
                        .font(brandFont(.small, .medium, relativeTo: .caption))
                        .ink("--color-ink-soft")
                        .frame(maxWidth: .infinity)
                }
            }
        }
        }
        .animation(.brand, value: currentId)
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
        .sheet(isPresented: $showEscapeHatch) { EscapeHatchSheet(item: live) }
        .fullScreenCover(isPresented: $showScanner) { ScannerSheet(item: live) }
    }

    private func upload(named fileName: String) {
        store.send(.uploadItem(itemId: live.id, fileName: fileName))
    }
}

// The #1 stall, "I don't have this", gets a forward path, never a dead-end.
struct EscapeHatchSheet: View {
    @Environment(CaseStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    let item: ChecklistItem
    @State private var sent = false
    @State private var contentHeight: CGFloat = 372

    var body: some View {
        // A short sheet sized to its three rows: no List, no navigation bar, no spare
        // height. Title left-aligned like every other screen, rows as plain FactRows
        // (the two actions are buttons, the tip is not).
        VStack(alignment: .leading, spacing: 0) {
            Text("I don't have this")
                .font(brandFont(.heading, .bold, relativeTo: .title2))
                .padding(.top, 28)
                .padding(.bottom, 18)
            row(icon: "lightbulb", title: "How to get it", detail: sourcingTip)
            divider
            Button {
                store.send(.askAdvisor(itemId: item.id,
                                       question: "I don't have my \(item.title), what should I do?"))
                sent = true
            } label: {
                row(icon: sent ? "checkmark.circle.fill" : "bubble.left",
                    title: sent ? "Asked Anna ✓" : "Ask Anna",
                    detail: sent ? "She replies as soon as she can." : "She's seen every version of this.")
            }
            .buttonStyle(.plain)
            .disabled(sent)
            divider
            Button {
                store.send(.askAdvisor(itemId: item.id,
                                       question: "Not sure the \(item.title) applies to me, does it?"))
                sent = true
            } label: {
                row(icon: "questionmark.circle", title: "Not sure this applies to me", detail: "Anna will confirm either way.")
            }
            .buttonStyle(.plain)
            .disabled(sent)
        }
        .padding(.horizontal, 24)
        .padding(.bottom, 12)
        .frame(maxWidth: .infinity, alignment: .leading)
        // The detent follows the measured content, so the sheet is exactly as tall as
        // its rows for every document, and the page colour fills the whole sheet.
        .onGeometryChange(for: CGFloat.self) { $0.size.height } action: { contentHeight = $0 }
        .presentationDetents([.height(max(contentHeight, 200))])
        .presentationBackground(store.tokens.color("--color-surface"))
        .presentationDragIndicator(.visible)
    }

    private var divider: some View {
        Rectangle().fill(store.tokens.color("--color-line")).frame(height: 1).padding(.leading, 42)
    }

    // Shared with the item detail screen's "Where do I find this?" disclosure.
    // see DocumentGuidance.swift, the one place this per-item copy lives.
    private var sourcingTip: String { DocumentGuidance.forItem(item).sourcingTip }

    private func row(icon: String, title: String, detail: String) -> some View {
        HStack(alignment: .center, spacing: 14) {
            Image(systemName: icon)
                .font(iconFont("--icon-md", weight: .light))
                .foregroundStyle(store.tokens.color("--color-success"))
                .frame(width: 28)
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(brandFont(.body, .medium, relativeTo: .headline))
                    .foregroundStyle(.primary)
                Text(detail)
                    .font(brandFont(.secondary, .book, relativeTo: .subheadline))
                    .ink("--color-ink-soft")
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.vertical, 14)
    }
}
