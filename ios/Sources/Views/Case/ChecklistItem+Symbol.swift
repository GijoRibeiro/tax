import Foundation

// One thin line icon per checklist item, as the Taxfix document list does.
extension ChecklistItem {
    var symbol: String {
        switch id {
        case "id-doc": "person.text.rectangle"
        case "tax-id": "number"
        case "lohnsteuer": "doc.text"
        case "alg-bescheid": "building.columns"
        case "bank": "creditcard"
        case "deductions": "receipt"
        default:
            switch group {
            case .identity: "person"
            case .employment: "briefcase"
            case .benefits: "building.columns"
            case .deductions: "receipt"
            }
        }
    }
}
