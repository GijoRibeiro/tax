import Foundation

enum CaseAction {
    case uploadItem(itemId: String, fileName: String)
    case askAdvisor(itemId: String, question: String)
    case answerFollowUp(followUpId: String, reply: String)
    case commitCase, approveReturn, reset
    case submitDocuments(cardLast4: String)
    // Advisor-side steps, sent from the phone only by the presenter's demo menu.
    case verifyItem(itemId: String)
    case startPreparing
    case sendDraft(ReturnDraft)
    case markFiled

    var json: [String: Any] {
        switch self {
        case let .uploadItem(itemId, fileName):
            return ["type": "UPLOAD_ITEM", "itemId": itemId, "fileName": fileName]
        case let .askAdvisor(itemId, question):
            return ["type": "ASK_ADVISOR", "itemId": itemId, "question": question]
        case let .answerFollowUp(followUpId, reply):
            return ["type": "ANSWER_FOLLOW_UP", "followUpId": followUpId, "reply": reply]
        case .commitCase: return ["type": "COMMIT_CASE"]
        case let .submitDocuments(cardLast4): return ["type": "SUBMIT_DOCUMENTS", "cardLast4": cardLast4]
        case .approveReturn: return ["type": "APPROVE_RETURN"]
        case .reset: return ["type": "RESET"]
        case let .verifyItem(itemId): return ["type": "VERIFY_ITEM", "itemId": itemId]
        case .startPreparing: return ["type": "START_PREPARING"]
        case let .sendDraft(draft):
            let data = (try? JSONEncoder().encode(draft)) ?? Data()
            let object = (try? JSONSerialization.jsonObject(with: data)) ?? [:]
            return ["type": "SEND_DRAFT", "draft": object]
        case .markFiled: return ["type": "MARK_FILED"]
        }
    }
}
