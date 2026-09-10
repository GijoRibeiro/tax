import Foundation

enum ItemStatus: String, Codable { case needed, uploaded, verified, issue }
enum ItemGroup: String, Codable { case identity, employment, benefits, deductions }
enum CasePhase: String, Codable {
    case onboarding, sharing, preparing, approved, filed
    case awaitingApproval = "awaiting_approval"
}
enum Sender: String, Codable { case advisor, consumer }
enum FollowUpStatus: String, Codable { case open, answered }

struct ChecklistItem: Codable, Identifiable, Equatable {
    let id: String
    let group: ItemGroup
    let title: String
    let germanName: String?
    let explainer: String
    let lookLike: String
    let optional: Bool
    var status: ItemStatus
    var issueNote: String?
    var uploadedFileName: String?
    var uploadedAt: String?
}

struct FollowUp: Codable, Identifiable, Equatable {
    let id: String
    let itemId: String?
    let from: Sender
    let message: String
    let createdAt: String
    var status: FollowUpStatus
    var reply: String?
}

struct ReturnDraft: Codable, Equatable {
    let income: String
    let taxPaid: String
    let deductions: String
    let refundEstimate: String
    let note: String?
}

struct CaseState: Codable, Equatable {
    var phase: CasePhase
    var items: [ChecklistItem]
    var followUps: [FollowUp]
    var draft: ReturnDraft?
    var filedAt: String?
    var submittedAt: String?
    var matchedAt: String?
    var cardLast4: String?
    var cardHeldAt: String?
    var chargedAt: String?
}

extension CaseState {
    var requiredItems: [ChecklistItem] { items.filter { !$0.optional } }
    var sharedCount: Int { requiredItems.filter { $0.status == .uploaded || $0.status == .verified }.count }
    /// Every required document is filled in. Not yet sent: see `submitted`.
    var allRequiredIn: Bool { requiredItems.allSatisfy { $0.status == .uploaded || $0.status == .verified } }
    /// The client pressed "Send to Anna". The hand-off has happened.
    var submitted: Bool { submittedAt != nil }

    // Anna's #2 ask: "What Anna checked" must reflect what she actually
    // verified, never a fixed list of claims made in her name. See ReviewView.
    var whatAnnaCheckedLines: [String] {
        let verified = items.filter { $0.status == .verified }
        guard !verified.isEmpty else { return ["Anna is still reviewing what you've shared."] }
        return verified.map { "✓ \($0.title), checked by Anna" }
    }

    static func seed() -> CaseState {
        if let url = Bundle.main.url(forResource: "seed", withExtension: "json"),
           let state = try? JSONDecoder().decode(CaseState.self, from: Data(contentsOf: url)) {
            return state
        }
        return CaseState(phase: .sharing, items: [], followUps: [], draft: nil, filedAt: nil)
    }
}

struct Advisor {
    static let name = "Anna Weber"
    static let title = "Certified tax advisor"
    static let responsePromise = "Replies as soon as she can"
    static let initials = "AW"
}
