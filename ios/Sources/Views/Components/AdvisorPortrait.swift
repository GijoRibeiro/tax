import SwiftUI
import UIKit

// Anna's real photo (ios/Resources/anna.jpg, same file the web uses), round, at any
// size. Falls back to her initials on the brand green if the file is missing, so a
// stripped build never shows a broken image where the person should be.
struct AdvisorPortrait: View {
    @Environment(CaseStore.self) private var store
    var size: CGFloat = 44

    private static let image: UIImage? = {
        guard let url = Bundle.main.url(forResource: "anna", withExtension: "jpg") else { return nil }
        return UIImage(contentsOfFile: url.path)
    }()

    var body: some View {
        Group {
            if let ui = Self.image {
                Image(uiImage: ui)
                    .resizable()
                    .scaledToFill()
            } else {
                Text(Advisor.initials)
                    .font(brandFont(fitting: size, fraction: 0.38, .medium, relativeTo: .headline))
                    .ink("--color-surface")
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(store.tokens.color("--color-success"))
            }
        }
        .frame(width: size, height: size)
        .clipShape(Circle())
        .accessibilityHidden(true)
    }
}

// An advisor we show by name but have no portrait for: initials on the pale green disc.
struct InitialsAvatar: View {
    @Environment(CaseStore.self) private var store
    let initials: String
    var size: CGFloat = 40
    var body: some View {
        Text(initials)
            .font(brandFont(fitting: size, fraction: 0.36, .bold, relativeTo: .caption))
            .frame(width: size, height: size)
            .background(store.tokens.color("--color-info-bg"), in: Circle())
            .ink("--color-accent")
    }
}
