// Shared by Today's deadline strip and CaseDetailView, both attach a "Send a
// nudge" action next to a stalled case's badge, and both must dispatch the
// exact same follow-up message (edge §6.2).
export const NUDGE_MESSAGE =
  "Just a gentle nudge, your return can move as soon as the remaining documents are in. If we need more time, an extension is easy to sort now."
