import SwiftUI

// One motion language for the app: the deck's easing (a quick start, a long soft
// settle) and one way content arrives, a short rise with a fade. Screens slide, blocks
// within a screen rise, nothing bounces.
extension Animation {
    static let brand = Animation.timingCurve(0.22, 1, 0.36, 1, duration: 0.5)
    static let brandQuick = Animation.timingCurve(0.22, 1, 0.36, 1, duration: 0.3)
}

extension AnyTransition {
    static let rise = AnyTransition.opacity.combined(with: .offset(y: 14))
    static let slideForward = AnyTransition.asymmetric(
        insertion: .move(edge: .trailing).combined(with: .opacity),
        removal: .move(edge: .leading).combined(with: .opacity))
}
