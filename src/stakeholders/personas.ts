import type { PersonaId } from '../store/stakeholders'

// Display metadata for the two interviewable personas. The knowledge itself
// (who they are, what they know, how they talk) lives in docs/personas/*.md and
// is read by the presenter's Claude Code session when it answers. Keep the
// `sources` list in step with the "Facts they know" section of those files.
export interface PersonaMeta {
  id: PersonaId
  name: string
  role: string
  /** One short line for the chat header. */
  short: string
  /** Fuller line for the deck. */
  situation: string
  portrait: string
  quote: string
  sources: { label: string; url: string }[]
}

export const DISCLAIMER =
  'Composite persona. Built from public sources (reviews, forums, official guidance) and interviewed in character by Claude Code. Some details are synthesised for coherence; nothing here is a real, named person.'

export const PERSONAS: Record<PersonaId, PersonaMeta> = {
  amara: {
    id: 'amara',
    name: 'Betina Bugnotto',
    role: 'Filer',
    short: 'Filer · 33 · Berlin',
    situation: '33 · Berlin · first mandatory filing after five months on Arbeitslosengeld I',
    portrait: '/personas/betina.jpg',
    quote: "I googled 'Lohnsteuerbescheinigung' at eleven at night, got four different answers, and gave up.",
    sources: [
      { label: 'Taxfix. Expert Service, how it works', url: 'https://taxfix.de/en/expert-service/' },
      { label: 'Taxfix Support, what the Expert Service costs (20% of refund, €99.99 minimum)', url: 'https://support.taxfix.de/hc/en-us/articles/26322594867357-How-much-does-the-Expert-Service-cost' },
      { label: 'Trustpilot. Taxfix reviews (Expert Service wait-time and fee complaints)', url: 'https://de.trustpilot.com/review/taxfix.de?page=8' },
      { label: 'Taxfix Ratgeber, unemployment and the filing obligation (€410 rule, Progressionsvorbehalt example)', url: 'https://taxfix.de/ratgeber/pflichten/arbeitslosigkeit-steuererklaerung/' },
      { label: 'Bundesagentur für Arbeit, benefit data is transmitted to the Finanzamt (ELStAM)', url: 'https://www.arbeitsagentur.de/vor-ort/bielefeld/presse/2025-8-leistungsnachweise-zum-arbeitslosengeldbezug-werden-dem-finanzamt-ubermittelt' },
      { label: 'Deadlines for tax year 2025: 31 July 2026 alone, 1 March 2027 with an advisor', url: 'https://onlinebilanz.de/abgabefrist-steuererklaerung-2025-mit-steuerberater/' },
    ],
  },
  anna: {
    id: 'anna',
    name: 'Anna Weber',
    role: 'Advisor',
    short: 'Tax advisor · 41 · Leipzig',
    situation: '41 · Steuerberaterin in Leipzig · Taxfix partner network · ~60 open cases in season',
    portrait: '/personas/anna.jpg',
    quote: "Most of my week isn't tax work. It's chasing page two of something.",
    sources: [
      { label: 'Taxfix, partner advisors are independent and referred through the platform', url: 'https://taxfix.de/experten-service/' },
      { label: 'StBVV worked example, €50k employee return ≈ €456 at the middle fee', url: 'https://steuerberater-tabak.com/steuerberater-kosten/' },
      { label: 'ifo / tax-talents, 72.7% of firms cannot find staff; >10,000 open positions', url: 'https://www.tax-talents.de/karriere-guide/aktuelles/detail/auch-2026-fachkraeftemangel-in-der-steuerberatung' },
      { label: 'Advisor deadline split, own return 31 July 2026, client returns 1 March 2027', url: 'https://intelligent-accounting.de/wissenswertes/steuererklarungen-faire-abgabefristen-fur-berater-2026' },
      { label: 'Client document habits. WhatsApp photos and analogue submissions', url: 'https://www.finmatics.com/blog/mandanten-digital-abholen-so-sprechen-moderne-steuerberater-ueber-digitale-prozesse' },
      { label: 'Trustpilot, "the partner firm" seen from the client side', url: 'https://de.trustpilot.com/review/taxfix.de?page=8' },
    ],
  },
}

export const PERSONA_ORDER: PersonaId[] = ['amara', 'anna']
