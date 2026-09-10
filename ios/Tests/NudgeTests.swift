import XCTest
@testable import TaxfixExpert

final class NudgeTests: XCTestCase {
    private func item(_ id: String, status: ItemStatus, issueNote: String? = nil) -> ChecklistItem {
        ChecklistItem(id: id, group: .employment, title: "Annual income statement", germanName: nil,
                      explainer: "e", lookLike: "l", optional: false, status: status,
                      issueNote: issueNote, uploadedFileName: nil, uploadedAt: nil)
    }

    private func state(items: [ChecklistItem] = [], followUps: [FollowUp] = [],
                        phase: CasePhase = .sharing, draft: ReturnDraft? = nil) -> CaseState {
        CaseState(phase: phase, items: items, followUps: followUps, draft: draft, filedAt: nil)
    }

    func testNewAdvisorFollowUpProducesNudge() {
        let old = state()
        let followUp = FollowUp(id: "f1", itemId: "lohnsteuer", from: .advisor,
                                 message: "Need your January payslip", createdAt: "", status: .open, reply: nil)
        let new = state(followUps: [followUp])

        let result = nudges(from: old, to: new)

        XCTAssertEqual(result.count, 1)
        XCTAssertEqual(result.first?.id, "followup-f1")
        XCTAssertEqual(result.first?.title, "Anna asked you something")
        XCTAssertEqual(result.first?.body, "Need your January payslip")
    }

    func testConsumerFollowUpDoesNotProduceNudge() {
        let old = state()
        let followUp = FollowUp(id: "f1", itemId: "lohnsteuer", from: .consumer,
                                 message: "Question for Anna", createdAt: "", status: .open, reply: nil)
        let new = state(followUps: [followUp])

        XCTAssertTrue(nudges(from: old, to: new).isEmpty)
    }

    func testItemFlaggedProducesNudge() {
        let old = state(items: [item("lohnsteuer", status: .uploaded)])
        let new = state(items: [item("lohnsteuer", status: .issue, issueNote: "Please resend a clearer scan")])

        let result = nudges(from: old, to: new)

        XCTAssertEqual(result.count, 1)
        XCTAssertEqual(result.first?.id, "issue-lohnsteuer")
        XCTAssertEqual(result.first?.title, "One document needs another look")
        XCTAssertEqual(result.first?.body, "Annual income statement: Please resend a clearer scan")
    }

    func testItemFlaggedWithoutNoteFallsBackToDefaultBody() {
        let old = state(items: [item("lohnsteuer", status: .uploaded)])
        let new = state(items: [item("lohnsteuer", status: .issue, issueNote: nil)])

        let result = nudges(from: old, to: new)

        XCTAssertEqual(result.first?.body, "Annual income statement: Anna left a note.")
    }

    func testDraftReadyProducesNudge() {
        let draft = ReturnDraft(income: "€42,000", taxPaid: "€6,100", deductions: "€1,900",
                                 refundEstimate: "€1,286", note: nil)
        let old = state(phase: .preparing)
        let new = state(phase: .awaitingApproval, draft: draft)

        let result = nudges(from: old, to: new)

        XCTAssertEqual(result.count, 1)
        XCTAssertEqual(result.first?.id, "review-ready")
        XCTAssertEqual(result.first?.title, "Your return is ready to review")
        XCTAssertEqual(result.first?.body, "Estimated refund €1,286. Nothing files until you approve.")
    }

    func testDraftReadyWithoutDraftProducesNoNudge() {
        let old = state(phase: .preparing)
        let new = state(phase: .awaitingApproval, draft: nil)

        XCTAssertTrue(nudges(from: old, to: new).isEmpty)
    }

    func testFiledProducesNudge() {
        let old = state(phase: .approved)
        let new = state(phase: .filed)

        let result = nudges(from: old, to: new)

        XCTAssertEqual(result.count, 1)
        XCTAssertEqual(result.first?.id, "filed")
        XCTAssertEqual(result.first?.title, "Filed with the Finanzamt")
        XCTAssertEqual(result.first?.body, "Anna filed your 2025 return. The Bescheid comes by post.")
    }

    func testQuietUploadTransitionProducesNoNudges() {
        let old = state(items: [item("lohnsteuer", status: .needed)])
        let new = state(items: [item("lohnsteuer", status: .uploaded)])

        XCTAssertTrue(nudges(from: old, to: new).isEmpty)
    }

    func testAlreadyOpenFollowUpDoesNotRenotify() {
        let followUp = FollowUp(id: "f1", itemId: nil, from: .advisor, message: "m", createdAt: "", status: .open, reply: nil)
        let old = state(followUps: [followUp])
        let new = state(followUps: [followUp])

        XCTAssertTrue(nudges(from: old, to: new).isEmpty)
    }

    func testAlreadyIssueItemDoesNotRenotify() {
        let flagged = item("lohnsteuer", status: .issue, issueNote: "note")
        let old = state(items: [flagged])
        let new = state(items: [flagged])

        XCTAssertTrue(nudges(from: old, to: new).isEmpty)
    }

    func testAlreadyFiledPhaseDoesNotRenotify() {
        let old = state(phase: .filed)
        let new = state(phase: .filed)

        XCTAssertTrue(nudges(from: old, to: new).isEmpty)
    }

    func testMultipleSimultaneousChangesProduceMultipleNudges() {
        let old = state(items: [item("lohnsteuer", status: .needed)], phase: .sharing)
        let followUp = FollowUp(id: "f1", itemId: nil, from: .advisor, message: "m", createdAt: "", status: .open, reply: nil)
        let new = state(items: [item("lohnsteuer", status: .issue, issueNote: "note")], followUps: [followUp], phase: .sharing)

        let result = nudges(from: old, to: new)

        XCTAssertEqual(result.count, 2)
        XCTAssertTrue(result.contains { $0.id == "followup-f1" })
        XCTAssertTrue(result.contains { $0.id == "issue-lohnsteuer" })
    }
}
