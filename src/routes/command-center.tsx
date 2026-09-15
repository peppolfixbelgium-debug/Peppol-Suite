import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, ArrowUpRight, CheckCircle2, CircleAlert, Clock3, GitCommitHorizontal, RefreshCw, ShieldAlert, XCircle } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth/local";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/command-center")({ component: CommandCenter });

const REPO = "peppolfixbelgium-debug/Peppol-Suite";
const API = `https://api.github.com/repos/${REPO}`;

type Issue = { number: number; title: string; state: "open" | "closed"; html_url: string; updated_at: string; labels: { name: string }[] };
type Run = { id: number; name: string; status: string; conclusion: string | null; head_sha: string; run_number: number; html_url: string; created_at: string };
type Commit = { sha: string; html_url: string; commit: { message: string; author?: { date?: string } } };
type Team = { name: string; issueNumbers: number[]; kind: "execution" | "external"; description: string };

const TEAMS: Team[] = [
  { name: "Engineering", issueNumbers: [23], kind: "execution", description: "Core product, conversion reliability and launch QA" },
  { name: "QA / DQM", issueNumbers: [28, 34, 36], kind: "execution", description: "Evidence, regression coverage and release gates" },
  { name: "R&D", issueNumbers: [25], kind: "execution", description: "Product intelligence and feature prioritisation" },
  { name: "Growth", issueNumbers: [26], kind: "execution", description: "Customer evidence and discovery" },
  { name: "Stripe", issueNumbers: [24], kind: "execution", description: "Test-mode billing; live activation remains gated" },
  { name: "Legal / GDPR", issueNumbers: [], kind: "external", description: "Professional review, controller terms, retention, rights and processor gates" },
  { name: "Company / Tax", issueNumbers: [], kind: "external", description: "Professional confirmation of company, VAT, tax, ownership and operating setup" },
  { name: "Pricing", issueNumbers: [], kind: "external", description: "Founder-approved pricing is published; production payment activation remains gated" },
];

const KNOWN_BLOCKERS = new Set([34, 36]);

async function github<T>(path: string): Promise<T> {
  const response = await fetch(`${API}${path}`, { headers: { Accept: "application/vnd.github+json" } });
  if (!response.ok) throw new Error(`GitHub request failed (${response.status}).`);
  return response.json() as Promise<T>;
}

function formatAge(iso: string): string {
  const minutes = Math.max(0, Math.floor((Date.now() - Date.parse(iso)) / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function teamState(team: Team, issues: Issue[], latestRun: Run | null): { label: string; tone: "green" | "amber" | "red"; detail: string } {
  if (team.kind === "external") return { label: "EXTERNAL GATE", tone: "red", detail: team.description };
  const linked = team.issueNumbers.map((n) => issues.find((i) => i.number === n)).filter(Boolean) as Issue[];
  const openLinked = linked.filter((i) => i.state === "open");
  const hasBlocking = openLinked.some((i) => KNOWN_BLOCKERS.has(i.number) || i.labels.some((l) => /block|blocked|P0/i.test(l.name)));
  if (latestRun?.conclusion === "failure") return { label: "CI BLOCKED", tone: "red", detail: "Latest repository CI failed; fix before advancing." };
  if (latestRun?.status !== "completed" && latestRun) return { label: "TESTING", tone: "amber", detail: "Repository CI is running; release state is not yet green." };
  if (hasBlocking) return { label: "BLOCKED", tone: "red", detail: openLinked.find((i) => KNOWN_BLOCKERS.has(i.number) || i.labels.some((l) => /block|blocked|P0/i.test(l.name)))?.title ?? "Blocking issue" };
  if (openLinked.length) return { label: "MOVING", tone: "green", detail: openLinked[0].title };
  return { label: "DONE / GATED", tone: "green", detail: linked[0]?.title ?? team.description };
}

function StatusIcon({ tone }: { tone: "green" | "amber" | "red" }) {
  if (tone === "green") return <CheckCircle2 className="size-4" />;
  if (tone === "red") return <XCircle className="size-4" />;
  return <CircleAlert className="size-4" />;
}

function CommandCenter() {
  const { user, hydrated } = useAuth();
  const [issues, setIssues] = useState<Issue[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshedAt, setRefreshedAt] = useState(Date.now());

  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const [nextIssues, nextRuns, nextCommits] = await Promise.all([
        github<Issue[]>("/issues?state=all&per_page=100&sort=updated&direction=desc"),
        github<{ workflow_runs: Run[] }>("/actions/runs?per_page=12"),
        github<Commit[]>("/commits?per_page=12"),
      ]);
      setIssues(nextIssues.filter((issue) => !("pull_request" in issue)));
      setRuns(nextRuns.workflow_runs); setCommits(nextCommits); setRefreshedAt(Date.now());
    } catch (err) { setError(err instanceof Error ? err.message : "Unable to refresh GitHub state."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!hydrated || user?.role !== "admin") return;
    void refresh(); const timer = window.setInterval(() => void refresh(), 60_000);
    return () => window.clearInterval(timer);
  }, [hydrated, user, refresh]);

  const latestRun = runs[0] ?? null;
  const openIssues = useMemo(() => issues.filter((i) => i.state === "open"), [issues]);
  const failedRun = runs.find((r) => r.conclusion === "failure");
  const moving = TEAMS.filter((team) => teamState(team, issues, latestRun).label === "MOVING").length;
  const blocked = TEAMS.filter((team) => teamState(team, issues, latestRun).tone === "red").length;
  const completed = TEAMS.filter((team) => teamState(team, issues, latestRun).label === "DONE / GATED").length;
  const bottleneck = !latestRun || latestRun.status !== "completed" ? "CI verification in progress" : failedRun ? "Repository CI failure" : "Production authenticated E2E";
  const bottleneckLabel = !latestRun || latestRun.status !== "completed" ? "TESTING" : failedRun ? "FIX NOW" : "EVIDENCE GAP";

  if (!hydrated) return <main className="mx-auto max-w-6xl px-4 py-12"><div className="h-72 animate-pulse rounded-2xl bg-surface" /></main>;
  if (!user) return <main className="mx-auto max-w-xl px-4 py-20 text-center"><ShieldAlert className="mx-auto size-8" /><h1 className="mt-4 font-display text-3xl">CEO Command Center</h1><p className="mt-2 text-muted">Sign in with an administrator account to view execution state.</p><Button asChild className="mt-6"><Link to="/login">Sign in</Link></Button></main>;
  if (user.role !== "admin") return <main className="mx-auto max-w-xl px-4 py-20 text-center"><ShieldAlert className="mx-auto size-8" /><h1 className="mt-4 font-display text-3xl">Access restricted</h1><p className="mt-2 text-muted">This execution board is available to administrators only.</p></main>;

  return <main className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><div className="flex items-center gap-2 text-sm font-medium text-accent"><Activity className="size-4" />LIVE EXECUTION BOARD</div><h1 className="mt-2 font-display text-4xl tracking-tight">CEO Command Center</h1><p className="mt-2 max-w-2xl text-muted">GitHub is the execution engine. This board turns issues, CI and commits into a live view of what is moving, blocked or complete.</p></div><Button type="button" variant="outline" onClick={() => void refresh()} disabled={loading}><RefreshCw className={cn("size-4", loading && "animate-spin")} />Refresh</Button></div>

    <section className="mt-8 grid gap-3 sm:grid-cols-4"><Metric label="MOVING" value={moving} icon={<Activity className="size-4" />} /><Metric label="BLOCKED / GATED" value={blocked} icon={<CircleAlert className="size-4" />} /><Metric label="DONE / GATED" value={completed} icon={<CheckCircle2 className="size-4" />} /><Metric label="OPEN ISSUES" value={openIssues.length} icon={<Clock3 className="size-4" />} /></section>
    {error ? <div className="mt-4 rounded-xl border border-border bg-elevated p-4 text-sm"><strong>Refresh failed.</strong> {error}</div> : null}

    <section className="mt-8 rounded-2xl border border-border bg-elevated p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">CURRENT BOTTLENECK</p><h2 className="mt-1 font-display text-2xl">{bottleneck}</h2></div><span className={cn("rounded-full px-3 py-1 text-xs font-semibold", bottleneckLabel === "FIX NOW" || bottleneckLabel === "EVIDENCE GAP" ? "bg-red-500/10 text-red-700 dark:text-red-300" : "bg-amber-500/10 text-amber-700 dark:text-amber-300")}>{bottleneckLabel}</span></div><p className="mt-3 text-sm text-muted">{latestRun?.status !== "completed" ? `CI #${latestRun?.run_number ?? "pending"} is still running. Do not treat main as green until it completes.` : failedRun ? `CI #${failedRun.run_number} failed. Fix the failing job before treating main as green.` : "The board deliberately shows the production authenticated E2E evidence gap rather than inventing a browser-upload PASS."}</p></section>

    <section className="mt-8"><div className="mb-3 flex items-center justify-between"><h2 className="font-display text-2xl">Team activity</h2><span className="text-xs text-muted">Auto-refresh: 60s · refreshed {formatAge(new Date(refreshedAt).toISOString())}</span></div><div className="grid gap-3 md:grid-cols-2">{TEAMS.map((team) => { const state = teamState(team, issues, latestRun); const linked = team.issueNumbers.map((n) => issues.find((i) => i.number === n)).filter(Boolean) as Issue[]; return <article key={team.name} className="rounded-2xl border border-border bg-elevated p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-medium">{team.name}</h3><p className="mt-1 text-sm text-muted">{state.detail}</p></div><span className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", state.tone === "green" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : state.tone === "red" ? "bg-red-500/10 text-red-700 dark:text-red-300" : "bg-amber-500/10 text-amber-700 dark:text-amber-300")}><StatusIcon tone={state.tone} />{state.label}</span></div><div className="mt-4 flex flex-wrap gap-2">{linked.map((issue) => <a key={issue.number} href={issue.html_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted hover:text-fg">#{issue.number} {issue.state === "open" ? "open" : "closed"}<ArrowUpRight className="size-3" /></a>)}</div></article>; })}</div></section>

    <section className="mt-8 grid gap-4 lg:grid-cols-2"><div className="rounded-2xl border border-border bg-elevated p-5"><div className="flex items-center justify-between"><h2 className="font-display text-xl">CI / release pulse</h2>{latestRun ? <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold", latestRun.conclusion === "success" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : latestRun.conclusion === "failure" ? "bg-red-500/10 text-red-700 dark:text-red-300" : "bg-amber-500/10 text-amber-700 dark:text-amber-300")}>{latestRun.conclusion ?? latestRun.status}</span> : null}</div>{latestRun ? <a href={latestRun.html_url} target="_blank" rel="noreferrer" className="mt-4 block rounded-xl border border-border p-3 hover:bg-surface"><div className="flex items-center justify-between gap-3"><span className="font-medium">{latestRun.name} #{latestRun.run_number}</span><ArrowUpRight className="size-4 text-muted" /></div><p className="mt-1 font-mono text-xs text-muted">{latestRun.head_sha.slice(0, 12)} · {formatAge(latestRun.created_at)}</p></a> : <p className="mt-4 text-sm text-muted">No workflow data loaded.</p>}</div><div className="rounded-2xl border border-border bg-elevated p-5"><h2 className="font-display text-xl">Recent commits</h2><div className="mt-4 space-y-2">{commits.slice(0, 6).map((commit) => <a key={commit.sha} href={commit.html_url} target="_blank" rel="noreferrer" className="flex gap-3 rounded-lg p-2 hover:bg-surface"><GitCommitHorizontal className="mt-0.5 size-4 shrink-0 text-muted" /><div className="min-w-0"><p className="truncate text-sm">{commit.commit.message.split("\n")[0]}</p><p className="mt-0.5 font-mono text-xs text-muted">{commit.sha.slice(0, 8)} · {commit.commit.author?.date ? formatAge(commit.commit.author.date) : "recent"}</p></div></a>)}</div></div></section>
    <p className="mt-6 text-xs text-muted">Data source: public GitHub repository state for {REPO}. Internal access is restricted to administrator accounts; this page never writes to GitHub.</p>
  </main>;
}

function Metric({ label, value, icon }: { label: string; value: number; icon: ReactNode }) { return <div className="rounded-2xl border border-border bg-elevated p-4"><div className="flex items-center gap-2 text-muted">{icon}<span className="text-xs font-semibold tracking-wide">{label}</span></div><p className="mt-2 font-display text-3xl">{value}</p></div>; }
