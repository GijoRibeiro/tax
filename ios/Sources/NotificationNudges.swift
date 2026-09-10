import Foundation

/// A single local-notification-worthy event, derived from a case-state diff.
/// Deliberately NOT `UNNotificationContent`, keeping this plain data means
/// the diff rules below stay pure and unit-testable without importing
/// UserNotifications/UIKit at all.
struct Nudge: Equatable, Identifiable {
    let id: String
    let title: String
    let body: String
}

/// Pure snapshot diff: compares the case state the app was just showing
/// (`old`) against a freshly-received relay snapshot (`new`) and returns the
/// nudges that should fire for whatever changed between them. Called from
/// `CaseStore.handle(_:)` BEFORE `state` is replaced with `new`, so `old` is
/// always the state the person was actually looking at a moment ago.
func nudges(from old: CaseState, to new: CaseState) -> [Nudge] {
    var result: [Nudge] = []

    // New advisor follow-up that's still open and wasn't there before.
    let oldFollowUpIds = Set(old.followUps.map(\.id))
    for followUp in new.followUps
    where followUp.from == .advisor && followUp.status == .open && !oldFollowUpIds.contains(followUp.id) {
        result.append(Nudge(id: "followup-\(followUp.id)",
                             title: "Anna asked you something",
                             body: followUp.message))
    }

    // An item just flipped to .issue (wasn't .issue a moment ago).
    let oldItemsById = Dictionary(uniqueKeysWithValues: old.items.map { ($0.id, $0) })
    for newItem in new.items where newItem.status == .issue && oldItemsById[newItem.id]?.status != .issue {
        result.append(Nudge(id: "issue-\(newItem.id)",
                             title: "One document needs another look",
                             body: "\(newItem.title): \(newItem.issueNote ?? "Anna left a note.")"))
    }

    // The draft just became ready to review.
    if old.phase != .awaitingApproval, new.phase == .awaitingApproval, let draft = new.draft {
        result.append(Nudge(id: "review-ready",
                             title: "Your return is ready to review",
                             body: "Estimated refund \(draft.refundEstimate). Nothing files until you approve."))
    }

    // The return just got filed.
    if old.phase != .filed, new.phase == .filed {
        result.append(Nudge(id: "filed",
                             title: "Filed with the Finanzamt",
                             body: "Anna filed your 2025 return. The Bescheid comes by post."))
    }

    return result
}
