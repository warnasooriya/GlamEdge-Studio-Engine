// Single source of truth for the business details that appear publicly — the
// site footer, the privacy policy and the support page all read from here.
// Apple opens the privacy and support pages during App Review, and the details
// there have to match what the App Store listing says, so keep them in one place
// rather than retyping them per page.
export const SITE = {
  legalName: "GlamEdge",
  tagline: "Salon & spas booking and management, made simple.",

  // Displayed with spaces for readability; tel: needs the E.164 form.
  phoneDisplay: "011 264 6979",
  phoneHref: "tel:+94112646979",

  email: "support@glamedge.beauty",

  addressLines: ["No 92, Sanrose Park", "Batakaththara", "Piliyandala"],

  // Shown on the legal pages so visitors can see how current the terms are.
  legalLastUpdated: "3 September 2026",
  // Kept apart from the retention wording in the policy body, which cites it.
  financialRetentionYears: 6,
  hostingRegion: "Singapore",
} as const;

export const SITE_LINKS = [
  { to: "/", label: "Find salons" },
  { to: "/support", label: "Support" },
  { to: "/privacy", label: "Privacy Policy" },
] as const;
