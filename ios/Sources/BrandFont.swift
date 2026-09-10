import SwiftUI
import UIKit
import CoreText

/// ABC ROM Trial weights used across the app. The OTFs are TRIAL-licensed
/// and gitignored, see fonts/ and `npm run sync:fonts`. Every call site
/// falls back to a comparable system font when the family isn't registered
/// (fresh clone with no fonts synced), so the app always builds and renders.
enum BrandWeight {
    case book
    case medium
    case bold
    case black

    /// Exact PostScript name embedded in the OTF (verified via fontTools).
    var postscriptName: String {
        switch self {
        case .book: return "ABCROMUnlicensedTrial-Book"
        case .medium: return "ABCROMUnlicensedTrial-Medium"
        case .bold: return "ABCROMUnlicensedTrial-Bold"
        case .black: return "ABCROMUnlicensedTrial-Black"
        }
    }

    var systemFallback: Font.Weight {
        switch self {
        case .book: return .regular
        case .medium: return .medium
        case .bold: return .bold
        case .black: return .black
        }
    }
}

enum BrandFont {
    /// True once the brand family has been confirmed registered with UIKit.
    /// Checked lazily (and cheaply cached) via `UIFont(name:size:)`.
    private static var resolvedAvailability: [String: Bool] = [:]

    private static func isAvailable(_ weight: BrandWeight) -> Bool {
        if let cached = resolvedAvailability[weight.postscriptName] { return cached }
        let available = UIFont(name: weight.postscriptName, size: 12) != nil
        resolvedAvailability[weight.postscriptName] = available
        return available
    }

    /// A fixed-size brand font, falling back to the closest system weight
    /// when ABC ROM isn't registered.
    static func font(size: CGFloat, weight: BrandWeight) -> Font {
        if isAvailable(weight) {
            return Font.custom(weight.postscriptName, size: size)
        }
        return .system(size: size, weight: weight.systemFallback)
    }

    /// A Dynamic-Type-relative brand font, falling back to the closest
    /// system weight (still relative to the same text style) when ABC ROM
    /// isn't registered.
    static func font(size: CGFloat, weight: BrandWeight, relativeTo style: Font.TextStyle) -> Font {
        if isAvailable(weight) {
            return Font.custom(weight.postscriptName, size: size, relativeTo: style)
        }
        return .system(style, design: .default, weight: weight.systemFallback)
    }
}

/// The phone's type scale. Every role is a token in tokens.css (`--text-phone-*`), so a
/// size is never typed in a view; the hub can move them live and the lint fails on numbers.
enum TextRole: String {
    case hero = "--text-phone-hero"
    case title = "--text-phone-title"
    case display = "--text-phone-display"
    case heading = "--text-phone-heading"
    case subheading = "--text-phone-subheading"
    case body = "--text-phone-body"
    case secondary = "--text-phone-secondary"
    case small = "--text-phone-small"
    case caption = "--text-phone-caption"
    case micro = "--text-phone-micro"
}

/// A Dynamic-Type-relative brand font for a role, scaled by `--text-scale`.
func brandFont(_ role: TextRole, _ weight: BrandWeight, relativeTo style: Font.TextStyle = .body) -> Font {
    let tokens = TokenStore.shared
    return BrandFont.font(size: tokens.size(role.rawValue) * tokens.textScale, weight: weight, relativeTo: style)
}

/// For labels whose size follows a geometry (initials inside a disc): a fraction of a
/// dimension, still scaled by `--text-scale`. Not for ordinary text; use a role.
func brandFont(fitting dimension: CGFloat, fraction: CGFloat, _ weight: BrandWeight, relativeTo style: Font.TextStyle = .body) -> Font {
    BrandFont.font(size: dimension * fraction * TokenStore.shared.textScale, weight: weight, relativeTo: style)
}

/// An SF Symbol size from a token (`--icon-*` or a `--text-phone-*` role), scaled the same way.
func iconFont(_ token: String, weight: Font.Weight = .regular) -> Font {
    let tokens = TokenStore.shared
    return .system(size: tokens.size(token) * tokens.textScale, weight: weight)
}

/// Registers any ABC ROM OTFs found in the app bundle with Core Text.
/// Belt-and-braces alongside `UIAppFonts` in Info.plist: safe (silent
/// no-op) when the fonts were never synced into the bundle.
enum BrandFontRegistrar {
    static func registerBundledFonts() {
        let filenames = [
            "ABCROM-Book-Trial",
            "ABCROM-Medium-Trial",
            "ABCROM-Bold-Trial",
            "ABCROM-Black-Trial",
        ]
        for name in filenames {
            guard let url = Bundle.main.url(forResource: name, withExtension: "otf") else { continue }
            var error: Unmanaged<CFError>?
            CTFontManagerRegisterFontsForURL(url as CFURL, .process, &error)
        }
    }
}
