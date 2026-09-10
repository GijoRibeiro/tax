const ASSUMPTIONS = [
  'Advisors work web-side at a desk; consumer is mobile-first. (Marketplace asymmetry.)',
  "The six checklist items for Betina's situation (ID, tax ID, Lohnsteuerbescheinigung, ALG-I Leistungsbescheid, bank details, optional deductions) approximate the real intake; a real build would source this from the advisor workflow.",
  'Response promise ("1 business day") is operationally viable, treated as a design requirement on operations, not a given.',
  'Prototype persistence is local-only; no real backend, auth, or document storage, and payment processing, KYC, real document OCR, and push-notification plumbing are represented in the UI where they would appear, not built.',
  'Taxfix-style visual language is approximated from public brand material, not extracted assets.',
  'Price: €119.99 flat, invented for the prototype; real pricing may differ by refund size. Money model: a card is saved and checked when the client sends the documents, and charged only at approval; a multi-week authorisation hold is not assumed, the card is kept on file. Abandonment after a draft exists is assumed rare and absorbed by the platform, with time-to-approve as the metric to watch.',
  'Refund estimate figures are seeded demo data; no tax math is real.',
  'Matching: an advisor with capacity is proposed on the result screen (language, region, load) so the client sees a real name before committing, and reserved at Start; a place in her queue, not her time. A case with nothing sent after about 14 days is nudged and, as the deadline nears, released back to the pool. The 14 days are a starting value. Full routing and capacity management remain out of scope.',
  'German-language UI is out of scope (target user uses English UI).',
  'The liability check is a design artifact of ~3 questions, not a legally complete Pflichtveranlagung decision tree.',
  'Dark mode is cut for scope; tokens make it a follow-up, not a rework.',
  'Simulator camera: uploads use bundled sample images via a photo picker, not a live camera capture.',
]

export function Assumptions() {
  return (
    <section id="assumptions" className="hub-section">
      <h2 className="hub-section__title">Assumptions</h2>
      <ol className="hub-list">
        {ASSUMPTIONS.map(item => (
          <li key={item}>{item}</li>
        ))}
      </ol>
    </section>
  )
}
