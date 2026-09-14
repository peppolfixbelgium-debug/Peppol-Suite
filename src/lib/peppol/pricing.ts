export const PRICING = {
  currency: "EUR",
  tiers: [
    {
      id: "free",
      name: "Free",
      priceMonthly: 0,
      priceAnnual: 0,
      invoices: 5,
      bulk: false,
      popular: false,
      cta: "Start free",
      features: [
        "5 document units/month",
        "Browser-side PDF conversion",
        "Basic EN16931 validation",
        "XML download",
        "Account usage is server-enforced",
      ],
    },
    {
      id: "pro",
      name: "Pro",
      priceMonthly: 14.9,
      priceAnnual: 149,
      invoices: 100,
      bulk: true,
      popular: true,
      cta: "Choose Pro",
      features: [
        "100 document units/month",
        "500 bulk document units/month",
        "Bulk ZIP conversion",
        "Conversion history",
        "Full validation workflow",
      ],
    },
    {
      id: "business",
      name: "Business",
      priceMonthly: 44.9,
      priceAnnual: 449,
      invoices: 1000,
      bulk: true,
      popular: false,
      cta: "Choose Business",
      features: [
        "1,000 document units/month",
        "10,000 bulk document units/month",
        "Bulk ZIP conversion",
        "API access",
        "Foundation for future team/business features",
      ],
    },
  ],
} as const;

export type TierId = (typeof PRICING.tiers)[number]["id"];
