import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import type { ValidationResult } from "@/lib/peppol/types";
import { t, type Lang } from "@/lib/peppol/i18n";

export function IssuesList({ result, lang }: { result: ValidationResult; lang: Lang }) {
  if (result.ok && result.issues.length === 0) {
    return (
      <div className="flex items-start gap-2 rounded-xl border border-border bg-accent-soft p-3 text-sm text-accent">
        <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
        {t(lang, "no_issues")}
      </div>
    );
  }
  return (
    <ul className="grid gap-2">
      {result.issues.map((issue) => (
        <li
          key={issue.code + issue.message}
          className="rounded-xl border border-border bg-elevated p-3"
        >
          <div className="flex items-start gap-2">
            {issue.severity === "error" ? (
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-danger" />
            ) : (
              <Info className="mt-0.5 size-4 shrink-0 text-warn" />
            )}
            <div>
              <p className="text-sm font-medium">
                {issue.code}: {issue.message}
              </p>
              <p className="mt-1 text-xs text-muted">{issue.hint}</p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
