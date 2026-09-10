import SwiftUI
import UIKit

struct WelcomeView: View {
    @Environment(CaseStore.self) private var store
    let next: () -> Void

    // Taxfix's 3D percent mark (ios/Resources/welcome-mark.png), the same one on the
    // splash of their app, left-aligned above the headline.
    // Advisors in the network, by name. Composites with placeholder portraits
    // (ios/Resources/advisor-*.jpg); not Anna on purpose. One is featured per launch.
    struct FeaturedAdvisor { let name: String; let initials: String; let file: String
        var photo: UIImage? {
            guard let url = Bundle.main.url(forResource: file, withExtension: "jpg") else { return nil }
            return UIImage(contentsOfFile: url.path)
        }
    }
    private static let advisors: [FeaturedAdvisor] = [
        FeaturedAdvisor(name: "Jonas Keller", initials: "JK", file: "advisor-jonas"),
        FeaturedAdvisor(name: "Mira Haddad", initials: "MH", file: "advisor-mira"),
        FeaturedAdvisor(name: "Tom Fischer", initials: "TF", file: "advisor-tom"),
    ]
    @State private var featured: FeaturedAdvisor = advisors.randomElement()!

    private static let mark: UIImage? = {
        guard let url = Bundle.main.url(forResource: "welcome-mark", withExtension: "png") else { return nil }
        return UIImage(contentsOfFile: url.path)
    }()

    var body: some View {
        VStack(spacing: 0) {
            Spacer(minLength: 24)

            VStack(spacing: 20) {
                if let mark = Self.mark {
                    Image(uiImage: mark)
                        .resizable()
                        .scaledToFit()
                        .frame(width: 180, height: 180)
                        .accessibilityHidden(true)
                }
                VStack(spacing: 0) {
                    Text("An expert files your German taxes.")
                    Text("In English.").ink("--color-accent")
                }
                .font(brandFont(.title, .black, relativeTo: .largeTitle))
                .multilineTextAlignment(.center)
                .fixedSize(horizontal: false, vertical: true)
                .layoutPriority(2)

                // Real people, before anything else. Nobody is assigned yet, so this says
                // "there are real advisors here", not "here is yours": one advisor by name,
                // a different one each time you open the app, never Anna (she is the match
                // that comes later), speaking for all of them.
                VStack(alignment: .leading, spacing: 12) {
                    HStack(spacing: 12) {
                        if let photo = featured.photo {
                            Image(uiImage: photo).resizable().scaledToFill()
                                .frame(width: 56, height: 56).clipShape(Circle())
                        } else {
                            InitialsAvatar(initials: featured.initials, size: 56)
                        }
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Real advisors, real names.").font(brandFont(.body, .medium, relativeTo: .headline))
                            Text("\(featured.name), one of our certified tax advisors")
                                .font(brandFont(.small, .book, relativeTo: .caption))
                                .ink("--color-ink-soft")
                        }
                    }
                    Text("\"One of us prepares your return from start to finish. You see who would take your case before you start, and you pay only when you approve.\"")
                        .font(brandFont(.body, .book, relativeTo: .body))
                        .fixedSize(horizontal: false, vertical: true)
                }
                .padding(20)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(store.tokens.color("--color-surface-sunken"),
                            in: RoundedRectangle(cornerRadius: store.tokens.size("--radius-card")))
                .layoutPriority(1)
            }
            .frame(maxWidth: .infinity)

            Spacer(minLength: 24)
            PrimaryButton(title: "Do I need to file?", action: next)
        }
        .padding([.horizontal, .top], 24)
        .padding(.bottom, 8)
    }
}
