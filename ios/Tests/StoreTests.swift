import XCTest
import SwiftUI
@testable import TaxfixExpert

final class StoreTests: XCTestCase {
    func testActionEncodesToReducerShape() throws {
        let json = CaseAction.uploadItem(itemId: "lohnsteuer", fileName: "scan.jpg").json
        XCTAssertEqual(json["type"] as? String, "UPLOAD_ITEM")
        XCTAssertEqual(json["itemId"] as? String, "lohnsteuer")
        XCTAssertEqual(json["fileName"] as? String, "scan.jpg")
    }

    func testTokenStoreParsesColorAndSize() {
        let tokens = TokenStore()
        XCTAssertEqual(tokens.size("--radius-card"), 24)
        tokens.overrides["--radius-card"] = "32px"
        XCTAssertEqual(tokens.size("--radius-card"), 32)
        XCTAssertNotNil(tokens.color("--color-primary"))
    }

    func testResetBumpsResetCountSoTheViewTreeRemounts() {
        let store = CaseStore(connect: false)
        store.send(.commitCase)
        XCTAssertEqual(store.resetCount, 0)
        store.send(.reset)
        XCTAssertEqual(store.resetCount, 1)
        XCTAssertEqual(store.state.phase, .onboarding)
        XCTAssertFalse(store.metAnna)
        store.send(.reset) // resetting while already at the start still bumps
        XCTAssertEqual(store.resetCount, 2)
    }

    func testOfflineStoreAppliesUploadLocally() {
        let store = CaseStore(connect: false)
        store.send(.commitCase)
        XCTAssertEqual(store.state.phase, .sharing)
        store.send(.uploadItem(itemId: "lohnsteuer", fileName: "scan.jpg"))
        XCTAssertEqual(store.state.items.first { $0.id == "lohnsteuer" }?.status, .uploaded)
    }

    // Regression test for the cold-launch guard: the very first relay snapshot
    // after launch is a catch-up (whatever the relay already holds), not
    // something the person just watched happen, so it must never fire nudges
    // even though it differs from the placeholder seed state.
    func testFirstIngestedSnapshotFiresNoNudgesEvenWhenDifferentFromSeed() {
        let store = CaseStore(connect: false)
        var captured: [Nudge] = []
        store.onNudges = { captured.append(contentsOf: $0) }

        let followUp = FollowUp(id: "f1", itemId: nil, from: .advisor, message: "Need your January payslip",
                                 createdAt: "", status: .open, reply: nil)
        var firstSnapshot = store.state
        firstSnapshot.followUps = [followUp]

        store.ingest(snapshot: firstSnapshot)

        XCTAssertTrue(captured.isEmpty)
        XCTAssertEqual(store.state.followUps.count, 1)
    }

    // Once the cold-launch snapshot has been absorbed, a genuine later change
    // (a new advisor follow-up) must still fire exactly one nudge.
    func testSecondSnapshotAddingAdvisorFollowUpFiresOneNudge() {
        let store = CaseStore(connect: false)
        var captured: [Nudge] = []
        store.onNudges = { captured.append(contentsOf: $0) }

        store.ingest(snapshot: store.state) // cold-launch catch-up, suppressed

        let followUp = FollowUp(id: "f1", itemId: nil, from: .advisor, message: "Need your January payslip",
                                 createdAt: "", status: .open, reply: nil)
        var nextSnapshot = store.state
        nextSnapshot.followUps.append(followUp)

        store.ingest(snapshot: nextSnapshot)

        XCTAssertEqual(captured.count, 1)
        XCTAssertEqual(captured.first?.title, "Anna asked you something")
    }
}
