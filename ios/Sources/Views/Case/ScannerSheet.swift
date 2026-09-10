import SwiftUI

/// Mock document scanner, a clearly-prototype affordance, since the
/// simulator has no camera. Pure SwiftUI drawing: a dark viewfinder with
/// corner brackets and an animated document outline that "locks on" after
/// a beat, a shutter with a flash transition, then a drawn preview card the
/// person can accept or retake. Uploads via the normal reducer action.
struct ScannerSheet: View {
    @Environment(CaseStore.self) private var store
    @Environment(\.dismiss) private var dismiss
    let item: ChecklistItem

    private enum Phase { case locking, locked, flash, preview }
    @State private var phase: Phase = .locking

    var body: some View {
        ZStack {
            Color.black.ignoresSafeArea()
            switch phase {
            case .locking, .locked: scanningView
            case .flash: Color.white.ignoresSafeArea()
            case .preview: previewView
            }
        }
        .task { await lockOn() }
    }

    private var locked: Bool { phase == .locked }

    private var scanningView: some View {
        VStack(spacing: 28) {
            Spacer()
            ZStack {
                RoundedRectangle(cornerRadius: 6)
                    .fill(.white)
                    .frame(width: locked ? 220 : 188, height: locked ? 300 : 256)
                    .opacity(0.94)
                CornerBrackets()
                    .stroke(locked ? store.tokens.color("--color-success") : .white,
                            style: StrokeStyle(lineWidth: 4, lineCap: .round))
                    .frame(width: 264, height: 340)
            }
            .animation(.spring(response: 0.5, dampingFraction: 0.65), value: locked)

            Text("Position the document in the frame")
                .font(brandFont(.secondary, .medium, relativeTo: .subheadline))
                .foregroundStyle(.white.opacity(0.85))
            Spacer()
            HStack {
                Button("Cancel") { dismiss() }
                    .font(brandFont(.secondary, .book, relativeTo: .subheadline))
                    .foregroundStyle(.white)
                Spacer()
                Button(action: capture) {
                    Circle()
                        .fill(.white)
                        .frame(width: 70, height: 70)
                        .overlay(Circle().stroke(.white.opacity(0.5), lineWidth: 4).frame(width: 82, height: 82))
                }
                .accessibilityLabel("Shutter")
                Spacer()
                Color.clear.frame(width: 44, height: 44)
            }
            .padding(.horizontal, 36)
            .padding(.bottom, 44)
        }
    }

    private var previewView: some View {
        VStack(spacing: 24) {
            Spacer()
            MockDocumentCard()
                .frame(width: 240, height: 320)
            Spacer()
            VStack(spacing: 14) {
                PrimaryButton(title: "Use this photo") { useCapture() }
                Button("Retake") { retake() }
                    .font(brandFont(.secondary, .book, relativeTo: .subheadline))
                    .foregroundStyle(.white)
            }
            .padding(.horizontal, 32)
            .padding(.bottom, 44)
        }
    }

    private func lockOn() async {
        try? await Task.sleep(for: .seconds(0.8))
        guard phase == .locking else { return }
        phase = .locked
    }

    private func capture() {
        guard phase == .locked else { return }
        phase = .flash
        Task {
            try? await Task.sleep(for: .seconds(0.15))
            phase = .preview
        }
    }

    private func retake() {
        phase = .locking
        Task { await lockOn() }
    }

    private func useCapture() {
        store.send(.uploadItem(itemId: item.id, fileName: "scan-\(item.id).jpg"))
        dismiss()
    }
}

/// Four L-shaped viewfinder corner brackets within the given frame.
private struct CornerBrackets: Shape {
    var length: CGFloat = 26
    var corner: CGFloat = 14

    func path(in rect: CGRect) -> Path {
        var p = Path()
        // top-left
        p.move(to: CGPoint(x: rect.minX, y: rect.minY + length))
        p.addLine(to: CGPoint(x: rect.minX, y: rect.minY + corner))
        p.addQuadCurve(to: CGPoint(x: rect.minX + corner, y: rect.minY), control: CGPoint(x: rect.minX, y: rect.minY))
        p.addLine(to: CGPoint(x: rect.minX + length, y: rect.minY))
        // top-right
        p.move(to: CGPoint(x: rect.maxX - length, y: rect.minY))
        p.addLine(to: CGPoint(x: rect.maxX - corner, y: rect.minY))
        p.addQuadCurve(to: CGPoint(x: rect.maxX, y: rect.minY + corner), control: CGPoint(x: rect.maxX, y: rect.minY))
        p.addLine(to: CGPoint(x: rect.maxX, y: rect.minY + length))
        // bottom-right
        p.move(to: CGPoint(x: rect.maxX, y: rect.maxY - length))
        p.addLine(to: CGPoint(x: rect.maxX, y: rect.maxY - corner))
        p.addQuadCurve(to: CGPoint(x: rect.maxX - corner, y: rect.maxY), control: CGPoint(x: rect.maxX, y: rect.maxY))
        p.addLine(to: CGPoint(x: rect.maxX - length, y: rect.maxY))
        // bottom-left
        p.move(to: CGPoint(x: rect.minX + length, y: rect.maxY))
        p.addLine(to: CGPoint(x: rect.minX + corner, y: rect.maxY))
        p.addQuadCurve(to: CGPoint(x: rect.minX, y: rect.maxY - corner), control: CGPoint(x: rect.minX, y: rect.maxY))
        p.addLine(to: CGPoint(x: rect.minX, y: rect.maxY - length))
        return p
    }
}

/// The drawn "scanned document" preview, a white card with grey text-line
/// placeholders and a green check, standing in for a real capture.
private struct MockDocumentCard: View {
    @Environment(CaseStore.self) private var store
    private let lineWidths: [CGFloat] = [140, 180, 120, 160, 100]

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 12).fill(.white)
                .shadow(color: .black.opacity(0.3), radius: 16, y: 8)
            VStack(alignment: .leading, spacing: 12) {
                ForEach(Array(lineWidths.enumerated()), id: \.offset) { _, width in
                    RoundedRectangle(cornerRadius: 2)
                        .fill(Color(.systemGray4))
                        .frame(width: width, height: 8)
                }
                Spacer()
                HStack {
                    Spacer()
                    Image(systemName: "checkmark.seal.fill")
                        .font(.system(size: 30))
                        .foregroundStyle(store.tokens.color("--color-success"))
                }
            }
            .padding(20)
        }
    }
}
