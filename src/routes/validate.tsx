import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { IssuesList } from "@/components/issues-list";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { t } from "@/lib/peppol/i18n";
import { usePrefs } from "@/lib/peppol/prefs";
import { validateUblXml } from "@/lib/peppol/validate";

export const Route = createFileRoute("/validate")({ component: ValidatePage });

function ValidatePage() {
  const lang = usePrefs((s) => s.lang);
  const [xml, setXml] = useState("");
  const [submitted, setSubmitted] = useState("");
  const result = useMemo(() => (submitted ? validateUblXml(submitted) : null), [submitted]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="font-display text-3xl tracking-tight">{t(lang, "validate_title")}</h1>
      <p className="mt-2 text-muted">{t(lang, "validate_sub")}</p>
      <Textarea
        className="mt-6"
        value={xml}
        onChange={(e) => setXml(e.target.value)}
        placeholder={t(lang, "validate_paste")}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" onClick={() => setSubmitted(xml)}>
          {t(lang, "validate_run")}
        </Button>
        <label className="inline-flex h-11 cursor-pointer items-center rounded-md border border-border px-4 text-sm">
          Upload XML
          <input
            type="file"
            accept=".xml,application/xml,text/xml"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              const text = await f.text();
              setXml(text);
              setSubmitted(text);
            }}
          />
        </label>
      </div>
      {result ? (
        <div className="mt-8">
          <IssuesList result={result} lang={lang} />
        </div>
      ) : null}
    </main>
  );
}
