import { Link, createFileRoute } from "@tanstack/react-router";
import JSZip from "jszip";
import { Download } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { extractInvoice } from "@/lib/peppol/extract";
import { t } from "@/lib/peppol/i18n";
import { extractPdfText } from "@/lib/peppol/pdf";
import { usePrefs } from "@/lib/peppol/prefs";
import { FREE_LIMIT, canConsume, consumeQuota, getQuota } from "@/lib/peppol/quota";
import { validateInvoice } from "@/lib/peppol/validate";
import { buildUblXml, suggestedFilename } from "@/lib/peppol/xml";
import { downloadBlob } from "@/lib/utils";

export const Route = createFileRoute("/bulk")({ component: BulkPage });

type Row = { name: string; status: string; xml?: string; invoice?: string };

async function expandInputFiles(files: File[]): Promise<File[]> {
  const result: File[] = [];
  for (const file of files) {
    if (!/\.zip$/i.test(file.name)) {
      result.push(file);
      continue;
    }
    try {
      const archive = await JSZip.loadAsync(file);
      const entries = Object.keys(archive.files).map((name) => archive.files[name]).filter((entry) => !entry.dir && /\.pdf$/i.test(entry.name));
      if (!entries.length) {
        result.push(file);
        continue;
      }
      for (const entry of entries) {
        const blob = await entry.async("blob");
        const name = entry.name.split("/").pop() || "invoice.pdf";
        result.push(new File([blob], name, { type: "application/pdf" }));
      }
    } catch {
      result.push(file);
    }
  }
  return result;
}

function csvCell(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function BulkPage() {
  const lang = usePrefs((s) => s.lang);
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const [quota, setQuota] = useState({ used: 0, limit: FREE_LIMIT, remaining: FREE_LIMIT });

  useEffect(() => {
    setQuota(getQuota());
  }, []);

  async function run(inputFiles: File[]) {
    setBusy(true);
    const files = await expandInputFiles(inputFiles);
    const next: Row[] = [];
    for (const file of files.slice(0, FREE_LIMIT)) {
      if (/\.zip$/i.test(file.name)) {
        next.push({ name: file.name, status: "ZIP could not be opened or contains no PDF files." });
        continue;
      }
      if (!canConsume()) {
        next.push({ name: file.name, status: t(lang, "quota_full") });
        continue;
      }
      const extracted = await extractPdfText(file);
      if (!extracted.success) {
        next.push({ name: file.name, status: extracted.error?.userMessage ?? "error" });
        continue;
      }
      const data = extractInvoice(extracted.fullText);
      const issues = validateInvoice(data);
      const xml = buildUblXml(data);
      consumeQuota();
      next.push({
        name: file.name,
        status: issues.ok ? t(lang, "status_ok") : t(lang, "status_issues"),
        xml,
        invoice: suggestedFilename(data),
      });
    }
    setRows(next);
    setQuota(getQuota());
    setBusy(false);
  }

  async function zipAll() {
    const zip = new JSZip();
    const summary = ["file,status,xml"];
    for (const row of rows) {
      if (row.xml && row.invoice) zip.file(row.invoice, row.xml);
      summary.push([row.name, row.status, row.invoice ?? ""].map(csvCell).join(","));
    }
    zip.file("summary.csv", summary.join("\n"));
    const blob = await zip.generateAsync({ type: "blob" });
    downloadBlob("peppol-bulk.zip", blob);
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-3xl tracking-tight">{t(lang, "bulk_title")}</h1>
      <p className="mt-2 text-muted">{t(lang, "bulk_sub")}</p>
      <p className="mt-2 text-sm text-muted">{t(lang, "quota", { used: quota.used, limit: quota.limit })}</p>
      <label className="mt-6 grid min-h-40 cursor-pointer place-items-center rounded-2xl border border-dashed border-border bg-elevated p-6">
        <input
          type="file"
          accept="application/pdf,.zip,application/zip"
          multiple
          className="hidden"
          disabled={busy}
          onChange={(e) => {
            const files = [...(e.target.files ?? [])];
            if (files.length) void run(files);
          }}
        />
        <p className="text-sm">{busy ? t(lang, "extracting", { page: 0, total: 0 }) : t(lang, "bulk_run")}</p>
      </label>
      {rows.length ? (
        <div className="mt-6 overflow-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead className="bg-surface text-left text-muted">
              <tr>
                <th className="px-3 py-2">PDF</th>
                <th className="px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.name} className="border-t border-border">
                  <td className="px-3 py-2">{r.name}</td>
                  <td className="px-3 py-2">{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" disabled={!rows.some((r) => r.xml)} onClick={() => void zipAll()}>
          <Download className="size-4" />
          {t(lang, "bulk_download")}
        </Button>
        <Button asChild variant="outline">
          <Link to="/pricing">{t(lang, "upgrade")}</Link>
        </Button>
      </div>
    </main>
  );
}
