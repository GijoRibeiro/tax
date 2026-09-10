import SwiftUI

// The app's one primary action per screen: lime fill, dark green text, 18pt radius,
// full width, as in the Taxfix app ("Sign up", "Continue", "Add document").
struct PrimaryButton: View {
    @Environment(CaseStore.self) private var store
    let title: String
    var systemImage: String? = nil
    let action: () -> Void

    var body: some View {
        Button(action: action) { PrimaryButtonLabel(title: title, systemImage: systemImage) }
            .buttonStyle(.plain)
    }
}

// The same look without the Button, for NavigationLink labels. Never restyle a
// primary action by hand; use this.
struct PrimaryButtonLabel: View {
    @Environment(CaseStore.self) private var store
    let title: String
    var systemImage: String? = nil

    var body: some View {
        HStack(spacing: 8) {
            if let systemImage { Image(systemName: systemImage).font(iconFont(TextRole.body.rawValue, weight: .semibold)) }
            Text(title).font(brandFont(.body, .bold, relativeTo: .body))
        }
        .frame(maxWidth: .infinity)
        .frame(height: store.tokens.size("--size-control"))
        .background(store.tokens.color("--color-primary"),
                    in: RoundedRectangle(cornerRadius: store.tokens.size("--radius-control")))
        .foregroundStyle(store.tokens.color("--color-primary-ink"))
    }
}

// A square primary action, icon only: the camera next to "Choose from library".
// Same lime, same radius, 56 by 56, so it reads as the primary of the row.
struct PrimaryIconButton: View {
    @Environment(CaseStore.self) private var store
    let systemImage: String
    let label: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Image(systemName: systemImage)
                .font(iconFont("--icon-md", weight: .medium))
                .frame(width: store.tokens.size("--size-control"), height: store.tokens.size("--size-control"))
                .background(store.tokens.color("--color-primary"),
                            in: RoundedRectangle(cornerRadius: store.tokens.size("--radius-control")))
                .foregroundStyle(store.tokens.color("--color-primary-ink"))
        }
        .buttonStyle(.plain)
        .accessibilityLabel(label)
    }
}

// The secondary action's look: cream, ink text, 56pt, radius 18. A label so it can
// wrap a Button, a NavigationLink or a PhotosPicker.
struct SecondaryButtonLabel: View {
    @Environment(CaseStore.self) private var store
    let title: String

    var body: some View {
        Text(title)
            .font(brandFont(.body, .bold, relativeTo: .body))
            .frame(maxWidth: .infinity)
            .frame(height: store.tokens.size("--size-control"))
            .background(store.tokens.color("--color-surface-sunken"),
                        in: RoundedRectangle(cornerRadius: store.tokens.size("--radius-control")))
            .foregroundStyle(store.tokens.color("--color-ink"))
    }
}
