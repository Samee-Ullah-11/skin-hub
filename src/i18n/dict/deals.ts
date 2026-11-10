import { section } from "../section";

const en = {
  eyebrow: "Limited-time offers",
  title: "Deals at clinics near you",
  intro: "Discounts set by the clinics themselves, on treatments they list. Prices are starting prices; the clinic confirms the final cost.",
  all: "All treatments",
  off: "{percent}% off",
  was: "Was PKR {price}",
  now: "From PKR {price}",
  percentOnly: "{percent}% off the clinic's price",
  endsOn: "Ends {date}",
  book: "Book this deal",
  none: "No deals right now. Check back soon, or browse all clinics.",
  browseClinics: "Browse clinics",
  sample: "SAMPLE",
  // Clinic dashboard
  navDeals: "Deals",
  dashTitle: "Deals",
  dashIntro: "Offer a discount on one of your listed treatments. Deals show on the Deals page and on your clinic page while they run.",
  newDeal: "New deal",
  treatment: "Treatment",
  chooseTreatment: "Choose a treatment",
  percentOff: "Discount (%)",
  percentHint: "Between 5 and 80",
  startsAt: "Starts",
  endsAt: "Ends",
  datesHint: "Up to 90 days. Up to 10 deals running at once.",
  note: "Short note",
  noteHint: "Optional, e.g. first session only",
  create: "Create deal",
  created: "Deal created.",
  end: "End now",
  ended: "Deal ended.",
  yours: "Your deals",
  noneYours: "You have no deals yet.",
  statusRunning: "Running",
  statusScheduled: "Scheduled",
  statusEnded: "Ended",
  needTreatments: "Add treatments to your clinic profile first.",
};

// The Urdu version is switched off; it reuses the English copy until it is translated.
export const deals = section(en, en);
