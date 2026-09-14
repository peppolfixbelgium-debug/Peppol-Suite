export const PRICING = {
  currency: "EUR",
  tiers: [
    {
      id: "free",
      name: "Free",
      price: 0,
      annualPrice: 0,
      invoices: 5,
      bulk: 0,
      popular: false,
      cta: "Start free",
      features: [
        "5 document units/month",
        "Browser-side PDF conversion",
        "Basic EN16931 validation",
        "XML download",
      ],
    },
    {
      id: "pro",
      name: "Pro",
      price: 14.9,
      annualPrice: 149,
      invoices: 100,
      bulk: 500,
      popular: true,
      cta: "Start Pro",
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
      price: 44.9,
      annualPrice: 449,
      invoices: 1000,
      bulk: 10000,
      popular: false,
      cta: "Start Business",
      features: [
        "1,000 document units/month",
        "10,000 bulk document units/month",
        "Bulk ZIP conversion",
        "Conversion history",
        "API access",
      ],
    },
  ],
} as const;

export type TierId = (typeof PRICING.tiers)[number]["id"];
