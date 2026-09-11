export const PRICING = {
  currency: "EUR",
  tiers: [
    {
      id: "free",
      name: "Free",
      price: null,
      invoices: null,
      bulk: false,
      popular: false,
      cta: "Start free",
      features: [
        "Browser-side PDF conversion",
        "Basic EN16931 validation",
        "XML download",
        "Small anonymous trial; account usage is server-enforced",
      ],
    },
    {
      id: "pro",
      name: "Pro",
      price: null,
      invoices: null,
      bulk: true,
      popular: true,
      cta: "Pro — pricing coming soon",
      features: [
        "Higher monthly conversion allowance",
        "Bulk ZIP conversion",
        "Conversion history",
        "Full validation workflow",
      ],
    },
    {
      id: "business",
      name: "Business",
      price: null,
      invoices: null,
      bulk: true,
      popular: false,
      cta: "Business — pricing coming soon",
      features: [
        "Higher/custom usage limits",
        "Bulk ZIP conversion",
        "API access",
        "Foundation for future team/business features",
      ],
    },
  ],
} as const;

export type TierId = (typeof PRICING.tiers)[number]["id"];
