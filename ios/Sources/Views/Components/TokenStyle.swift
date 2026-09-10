import SwiftUI

// Token-driven colours for text and symbols, so views never reach for SwiftUI's
// generic greys. `.ink("--color-ink-soft")` is the secondary-text style everywhere.
private struct TokenForeground: ViewModifier {
    @Environment(CaseStore.self) private var store
    let name: String
    func body(content: Content) -> some View { content.foregroundStyle(store.tokens.color(name)) }
}

extension View {
    func ink(_ tokenName: String) -> some View { modifier(TokenForeground(name: tokenName)) }
}
