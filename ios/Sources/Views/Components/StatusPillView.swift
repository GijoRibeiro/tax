import SwiftUI

// A checklist item's state as a catalog chip.
struct StatusPillView: View {
    let status: ItemStatus

    var body: some View {
        switch status {
        case .needed: Chip(label: "To share", tone: .neutral)
        case .uploaded: Chip(label: "Sent", tone: .green)
        case .verified: Chip(label: "Checked ✓", tone: .green)
        case .issue: Chip(label: "Needs attention", tone: .issue)
        }
    }
}
