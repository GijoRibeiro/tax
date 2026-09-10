import SwiftUI

@Observable final class TokenStore {
    /// One store for the app: views read it through CaseStore, brandFont reads it directly
    /// so the hub's text-scale lever reaches every label without touching call sites.
    static let shared = TokenStore()
    var overrides: [String: String] = [:]

    private func raw(_ name: String) -> String? { overrides[name] ?? Tokens.defaults[name] }

    func color(_ name: String) -> Color {
        guard let hex = raw(name), hex.hasPrefix("#"), hex.count == 7,
              let v = UInt64(hex.dropFirst(), radix: 16) else { return .primary }
        return Color(
            red: Double((v >> 16) & 0xFF) / 255,
            green: Double((v >> 8) & 0xFF) / 255,
            blue: Double(v & 0xFF) / 255)
    }

    func size(_ name: String) -> CGFloat {
        guard let px = raw(name)?.replacingOccurrences(of: "px", with: ""),
              let value = Double(px) else { return 0 }
        return CGFloat(value)
    }

    /// Unitless multiplier for type (`--text-scale`); 1 when unset or invalid.
    var textScale: CGFloat {
        let s = size("--text-scale")
        return s > 0 ? s : 1
    }
}
