import XCTest
@testable import TaxfixExpert

final class ModelsTests: XCTestCase {
    func testSeedFixtureDecodes() throws {
        let url = try XCTUnwrap(Bundle(for: Self.self).url(forResource: "seed", withExtension: "json"))
        let state = try JSONDecoder().decode(CaseState.self, from: Data(contentsOf: url))
        XCTAssertEqual(state.phase, .onboarding)
        XCTAssertGreaterThanOrEqual(state.items.count, 6)
        // A true first access: nothing filled, nothing sent.
        XCTAssertEqual(state.items.first?.status, .needed)
        XCTAssertEqual(state.sharedCount, 0)
        XCTAssertFalse(state.allRequiredIn)
        XCTAssertNil(state.submittedAt)
        XCTAssertFalse(state.submitted)
    }

    func testPhaseRawValues() {
        XCTAssertEqual(CasePhase.awaitingApproval.rawValue, "awaiting_approval")
    }

    // Anna's #2 ask: "What Anna checked" on the review screen must be derived
    // from what she actually verified — never a fixed list of claims she
    // didn't make.
    func testWhatAnnaCheckedLinesDerivedFromVerifiedItems() {
        var state = CaseState(phase: .awaitingApproval, items: [
            ChecklistItem(id: "id-doc", group: .identity, title: "Photo ID", germanName: nil,
                          explainer: "e", lookLike: "l", optional: false, status: .verified),
            ChecklistItem(id: "tax-id", group: .identity, title: "Your tax ID", germanName: nil,
                          explainer: "e", lookLike: "l", optional: false, status: .uploaded),
            ChecklistItem(id: "lohnsteuer", group: .employment, title: "Annual income statement", germanName: nil,
                          explainer: "e", lookLike: "l", optional: false, status: .verified),
        ], followUps: [], draft: nil, filedAt: nil)

        XCTAssertEqual(state.whatAnnaCheckedLines, [
            "✓ Photo ID, checked by Anna",
            "✓ Annual income statement, checked by Anna",
        ])

        state.items = state.items.map { item in
            var copy = item
            copy.status = .uploaded
            return copy
        }
        XCTAssertEqual(state.whatAnnaCheckedLines.count, 1)
        XCTAssertTrue(state.whatAnnaCheckedLines.first?.contains("review") ?? false)
    }
}
