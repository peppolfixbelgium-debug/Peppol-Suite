import { Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Confidence, InvoiceData, InvoiceField, InvoiceLine } from "@/lib/peppol/types";
import { t, type Lang } from "@/lib/peppol/i18n";
import { cn } from "@/lib/utils";

function Conf({ c, lang }: { c: Confidence; lang: Lang }) {
  const tone = c === "high" ? "ok" : c === "medium" ? "warn" : "danger";
  const label = c === "high" ? t(lang, "conf_high") : c === "medium" ? t(lang, "conf_medium") : t(lang, "conf_low");
  return <Badge tone={tone}>{label}</Badge>;
}

function Field({
  label,
  field,
  onChange,
  lang,
  type = "text",
}: {
  label: string;
  field: InvoiceField;
  onChange: (next: InvoiceField) => void;
  lang: Lang;
  type?: string;
}) {
  return (
    <label className="grid gap-1">
      <span className="flex items-center justify-between gap-2 text-xs font-medium text-muted">
        {label}
        <Conf c={field.confidence} lang={lang} />
      </span>
      <Input
        type={type}
        value={field.value}
        onChange={(e) => onChange({ value: e.target.value, confidence: "high" })}
      />
    </label>
  );
}

export function InvoiceForm({
  data,
  onChange,
  lang,
}: {
  data: InvoiceData;
  onChange: (next: InvoiceData) => void;
  lang: Lang;
}) {
  const set = <K extends keyof InvoiceData>(key: K, value: InvoiceData[K]) =>
    onChange({ ...data, [key]: value });

  const setLine = (i: number, patch: Partial<InvoiceLine>) => {
    const lines = data.lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l));
    onChange({ ...data, lines });
  };

  return (
    <div className="grid gap-6">
      <section className="grid gap-3">
        <h3 className="text-sm font-medium">{t(lang, "f_invoice")}</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={t(lang, "f_invoice")} field={data.invoiceNumber} lang={lang} onChange={(f) => set("invoiceNumber", f)} />
          <Field label={t(lang, "f_currency")} field={data.currency} lang={lang} onChange={(f) => set("currency", f)} />
          <Field label={t(lang, "f_issue")} field={data.issueDate} lang={lang} type="date" onChange={(f) => set("issueDate", f)} />
          <Field label={t(lang, "f_due")} field={data.dueDate} lang={lang} type="date" onChange={(f) => set("dueDate", f)} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="grid gap-3 rounded-xl border border-border bg-elevated p-4">
          <h3 className="text-sm font-medium">{t(lang, "supplier")}</h3>
          <Field label={t(lang, "f_name")} field={data.supplierName} lang={lang} onChange={(f) => set("supplierName", f)} />
          <Field label={t(lang, "f_vat")} field={data.supplierVat} lang={lang} onChange={(f) => set("supplierVat", f)} />
          <Field label={t(lang, "f_street")} field={data.supplierStreet} lang={lang} onChange={(f) => set("supplierStreet", f)} />
          <div className="grid grid-cols-3 gap-2">
            <Field label={t(lang, "f_postal")} field={data.supplierPostal} lang={lang} onChange={(f) => set("supplierPostal", f)} />
            <Field label={t(lang, "f_city")} field={data.supplierCity} lang={lang} onChange={(f) => set("supplierCity", f)} />
            <Field label={t(lang, "f_country")} field={data.supplierCountry} lang={lang} onChange={(f) => set("supplierCountry", f)} />
          </div>
        </section>
        <section className="grid gap-3 rounded-xl border border-border bg-elevated p-4">
          <h3 className="text-sm font-medium">{t(lang, "customer")}</h3>
          <Field label={t(lang, "f_name")} field={data.customerName} lang={lang} onChange={(f) => set("customerName", f)} />
          <Field label={t(lang, "f_vat")} field={data.customerVat} lang={lang} onChange={(f) => set("customerVat", f)} />
          <Field label={t(lang, "f_street")} field={data.customerStreet} lang={lang} onChange={(f) => set("customerStreet", f)} />
          <div className="grid grid-cols-3 gap-2">
            <Field label={t(lang, "f_postal")} field={data.customerPostal} lang={lang} onChange={(f) => set("customerPostal", f)} />
            <Field label={t(lang, "f_city")} field={data.customerCity} lang={lang} onChange={(f) => set("customerCity", f)} />
            <Field label={t(lang, "f_country")} field={data.customerCountry} lang={lang} onChange={(f) => set("customerCountry", f)} />
          </div>
        </section>
      </div>

      <section className="grid gap-3">
        <h3 className="text-sm font-medium">{t(lang, "amounts")}</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <Field label={t(lang, "f_net")} field={data.netAmount} lang={lang} onChange={(f) => set("netAmount", f)} />
          <Field label={t(lang, "f_vatamt")} field={data.vatAmount} lang={lang} onChange={(f) => set("vatAmount", f)} />
          <Field label={t(lang, "f_payable")} field={data.payableAmount} lang={lang} onChange={(f) => set("payableAmount", f)} />
        </div>
      </section>

      <section className="grid gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">{t(lang, "lines")}</h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              onChange({
                ...data,
                lines: [
                  ...data.lines,
                  { description: "", quantity: "1", unitPrice: "0.00", vatRate: "21", lineTotal: "0.00" },
                ],
              })
            }
          >
            <Plus className="size-4" />
            {t(lang, "add_line")}
          </Button>
        </div>
        <div className="grid gap-2">
          {data.lines.map((line, i) => (
            <div
              key={i}
              className={cn("grid gap-2 rounded-lg border border-border bg-elevated p-3 md:grid-cols-[1fr_70px_90px_70px_90px_40px]")}
            >
              <Input
                value={line.description}
                placeholder={t(lang, "f_desc")}
                onChange={(e) => setLine(i, { description: e.target.value })}
              />
              <Input value={line.quantity} onChange={(e) => setLine(i, { quantity: e.target.value })} />
              <Input value={line.unitPrice} onChange={(e) => setLine(i, { unitPrice: e.target.value })} />
              <Input value={line.vatRate} onChange={(e) => setLine(i, { vatRate: e.target.value })} />
              <Input value={line.lineTotal} onChange={(e) => setLine(i, { lineTotal: e.target.value })} />
              <button
                type="button"
                className="grid size-11 place-items-center text-muted hover:text-danger"
                onClick={() => onChange({ ...data, lines: data.lines.filter((_, idx) => idx !== i) })}
                aria-label="Remove line"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
