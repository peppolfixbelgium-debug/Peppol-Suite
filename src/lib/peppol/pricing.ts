export const PRICING = {
  currency: "EUR",
  tiers: [
    {
      id: "free",
      name: "Free",
      price: 0,
      invoices: 5,
      bulk: 5,
      popular: false,
      cta: "Start free",
      features: [
        "5 conversions per month",
        "Runs in your browser",
        "EN16931 field checks",
        "XML download",
      ],
    },
    {
      id: "starter",
      name: "Starter",
      price: 19,
      invoices: 50,
      bulk: 50,
      popular: false,
      cta: "Choose Starter",
      features: [
        "50 conversions per month",
        "Bulk ZIP of up to 50 files",
        "Excel summary",
        "Email support",
      ],
    },
    {
      id: "pro",
      name: "Pro",
      price: 49,
      invoices: 200,
      bulk: 200,
      popular: true,
      cta: "Choose Pro",
      features: [
        "200 conversions per month",
        "Bulk ZIP of up to 200 files",
        "Conversion history",
        "Priority support",
      ],
    },
    {
      id: "scale",
      name: "Scale",
      price: 99,
      invoices: 1000,
      bulk: 200,
      popular: false,
      cta: "Talk to us",
      features: [
        "1000 conversions per month",
        "Bulk ZIP of up to 200 files",
        "DPA on request",
        "Dedicated onboarding",
      ],
    },
  ],
} as const;

export type TierId = (typeof PRICING.tiers)[number]["id"];
