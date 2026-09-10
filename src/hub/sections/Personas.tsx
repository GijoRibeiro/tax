export function Personas() {
  return (
    <section id="personas" className="hub-section">
      <h2 className="hub-section__title">The people and the agents</h2>
      <p>
        I could not talk to real Taxfix filers or partner advisors in the time I had. So I built two people from what
        real ones say in public, Trustpilot reviews of the Expert Service, Taxfix's own guidance pages, the
        profession's staffing data and fee schedule, and turned each into an agent I could interview. Betina and Anna
        stood in for the users I did not have: I asked them before decisions, they pushed back on the first list of
        problems, and at the end they used the build screen by screen and said what they would fix.
      </p>
      <p>
        They are still available, in character, at{' '}
        <a href="/stakeholders" target="_blank" rel="noreferrer">/stakeholders</a>. Everything they cite is real; the
        person around it is a composite and says so. What they said and what it changed is in{' '}
        <code>docs/personas/interview-findings.md</code>. Tom is a third, secondary persona for the late cohort, on
        paper only.
      </p>

      <div className="hub-personas">
        <article className="hub-persona-card">
          <img className="hub-persona-card__portrait" src="/personas/betina.jpg" alt="" width={72} height={72} />
          <p className="hub-persona-card__eyebrow">Primary consumer persona</p>
          <h3 className="hub-persona-card__name">Betina Bugnotto</h3>
          <p className="hub-persona-card__context">
            33, Nigerian-British product manager in Berlin, 4 years in Germany, English UI user.
          </p>
          <p className="hub-persona-card__context">
            Re-employed in March after 5 months on Arbeitslosengeld I → first mandatory filing.
          </p>
          <p>
            <strong>Goal:</strong> be done with this safely; expert handles it; no German-bureaucracy spelunking.
          </p>
          <p>
            <strong>Anxieties:</strong> "Did I already miss something?", fear of official-looking German mail, fear
            of uploading the wrong document.
          </p>
          <p>
            <strong>Behavior:</strong> mobile-first, does admin in the evening on the sofa, abandons anything that
            feels like it needs a desk and a scanner.
          </p>
          <p className="hub-persona-card__quote">
            "I signed up three days ago and I still don't know what they actually need from me."
          </p>
        </article>

        <article className="hub-persona-card">
          <p className="hub-persona-card__eyebrow">Secondary consumer persona</p>
          <h3 className="hub-persona-card__name">Tom Keller</h3>
          <p className="hub-persona-card__context">
            38, US-German dual national, freelanced briefly, back in employment; filed once before via a
            Steuerberater by email, hated the black box.
          </p>
          <p className="hub-persona-card__context">
            Arrives 12 days before the 31 July deadline, panicked, checks status obsessively.
          </p>
          <p>
            <strong>Goal:</strong> speed and certainty, "tell me the minimum I must do and confirm you have it."
          </p>
          <p>
            <strong>Stress test the persona provides:</strong> the flow must work when someone uploads everything
            in one frantic session and then needs reassurance that the ball is no longer in their court.
          </p>
        </article>

        <article className="hub-persona-card">
          <img className="hub-persona-card__portrait" src="/personas/anna.jpg" alt="" width={72} height={72} />
          <p className="hub-persona-card__eyebrow">Advisor persona</p>
          <h3 className="hub-persona-card__name">Anna Weber, 41</h3>
          <p className="hub-persona-card__context">
            Independent Steuerberaterin in Leipzig partnered with Taxfix Expert Service; ~60 open cases in season.
          </p>
          <p className="hub-persona-card__context">
            Works at a desk, on the web, alongside DATEV/ELSTER tooling. (Assumption, flagged: advisors will not
            review payslips on a phone, the marketplace is asymmetric: consumer=mobile, advisor=web.)
          </p>
          <p>
            <strong>Goal:</strong> minimize rounds of follow-up per case; a case is profitable when it moves in
            ≤2 touches.
          </p>
          <p>
            <strong>Pain:</strong> vague client messages, wrong/blurry documents, cases stalled for weeks on one
            missing item.
          </p>
          <p>
            <strong>What she needs from our side of the design:</strong> structured intake,
            clear "what's blocking me" state per case, one-click templated follow-ups.
          </p>
        </article>
      </div>

      <p className="hub-callout">
        <strong>Marketplace insight the personas encode:</strong> every consumer-side friction we remove is advisor
        margin, fewer follow-up rounds, faster filing. The design serves the relationship, and the hub's flow map
        shows both seats at every step.{' '}
        <a href="/stakeholders" target="_blank" rel="noreferrer">Talk to them →</a>
      </p>
    </section>
  )
}
