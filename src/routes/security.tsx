import { createFileRoute } from "@tanstack/react-router";
import { t } from "@/lib/peppol/i18n";
import { usePrefs } from "@/lib/peppol/prefs";

export const Route = createFileRoute("/security")({ component: Security });

function Security() {
  const lang = usePrefs((s) => s.lang);
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="font-display text-4xl tracking-tight">{t(lang, "security_title")}</h1>
      <div className="mt-8 space-y-4 text-sm leading-relaxed text-muted">
        <p>
          PDF parsing is client-side. The worker script is served from this origin. Password-protected and
          corrupt files are rejected with a readable error.
        </p>
        <p>
          Accounts are isolated: conversion history is scoped to the signed-in user on the server. We never
          accept a client-supplied user id.
        </p>
        <p>
          Generated XML is a file you download. Delivering it on the Peppol network requires your own Access
          Point credentials — we do not hold them and we cannot impersonate a certified AP.
        </p>
        <p>
          Transport is HTTPS in production. Report security issues rather than posting invoice samples that
          contain personal data.
        </p>
      </div>
    </main>
  );
}
