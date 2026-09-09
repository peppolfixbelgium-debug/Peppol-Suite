import { Link, useRouterState } from "@tanstack/react-router";
import { Menu, Moon, Sun, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth/local";
import { LANGS, t, type MsgKey } from "@/lib/peppol/i18n";
import { usePrefs } from "@/lib/peppol/prefs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV: { to: string; key: MsgKey }[] = [
  { to: "/", key: "nav_home" }, { to: "/converter", key: "nav_convert" },
  { to: "/validate", key: "nav_validate" }, { to: "/bulk", key: "nav_bulk" },
  { to: "/pricing", key: "nav_pricing" },
];

function AuthSlot() {
  const { user, hydrated } = useAuth();
  const lang = usePrefs((s) => s.lang);
  if (!hydrated) return <div className="h-9 w-24 animate-pulse rounded-md bg-accent-soft" />;
  if (user) return <div className="flex items-center gap-3"><Link to="/dashboard" className="hidden text-sm text-muted hover:text-fg sm:inline">{t(lang, "nav_dashboard")}</Link><span className="hidden max-w-32 truncate text-sm text-muted sm:inline">{user.name || user.email}</span><button className="text-sm text-muted hover:text-fg" onClick={() => useAuth.getState().signOut()}>{t(lang, "nav_logout")}</button></div>;
  return <Button asChild variant="outline" size="sm"><Link to="/login">{t(lang, "nav_login")}</Link></Button>;
}

export function Shell({ children }: { children: ReactNode }) {
  const lang = usePrefs((s) => s.lang); const theme = usePrefs((s) => s.theme);
  const setLang = usePrefs((s) => s.setLang); const setTheme = usePrefs((s) => s.setTheme); const hydrate = usePrefs((s) => s.hydrate);
  const pathname = useRouterState({ select: (s) => s.location.pathname }); const [open, setOpen] = useState(false);
  useEffect(() => hydrate(), [hydrate]);
  return <div className="flex min-h-dvh flex-col bg-bg text-fg">
    <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-accent focus:px-3 focus:py-2 focus:text-accent-fg">Skip to content</a>
    <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur"><div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4">
      <Link to="/" className="flex items-center gap-2.5"><img src="/logo.png" alt="" className="size-8 rounded-full border border-border bg-elevated object-contain"/><span className="font-display text-lg tracking-tight">{t(lang,"brand")}</span></Link>
      <nav className="hidden items-center gap-1 md:flex">{NAV.map((item)=><Link key={item.to} to={item.to} className={cn("rounded-md px-3 py-2 text-sm", pathname===item.to?"bg-accent-soft text-accent":"text-muted hover:text-fg")}>{t(lang,item.key)}</Link>)}</nav>
      <div className="flex items-center gap-2"><div className="hidden items-center rounded-full border border-border bg-elevated p-0.5 sm:flex">{LANGS.map((l)=><button key={l} onClick={()=>setLang(l)} className={cn("min-w-9 rounded-full px-2 py-1 text-xs uppercase",lang===l?"bg-accent text-accent-fg":"text-muted")}>{l}</button>)}</div>
      <button aria-label="Toggle theme" onClick={()=>setTheme(theme==="dark"?"light":"dark")} className="grid size-11 place-items-center rounded-md border border-border bg-elevated">{theme==="dark"?<Sun className="size-4"/>:<Moon className="size-4"/>}</button>
      <div className="hidden md:block"><AuthSlot/></div><button className="grid size-11 place-items-center rounded-md border border-border md:hidden" onClick={()=>setOpen(v=>!v)} aria-label="Menu">{open?<X className="size-4"/>:<Menu className="size-4"/>}</button></div>
    </div>{open&&<div className="border-t border-border px-4 py-3 md:hidden"><div className="flex flex-col gap-1">{NAV.map(item=><Link key={item.to} to={item.to} onClick={()=>setOpen(false)} className="rounded-md px-2 py-3 text-sm">{t(lang,item.key)}</Link>)}<Link to="/dashboard" onClick={()=>setOpen(false)} className="rounded-md px-2 py-3 text-sm">{t(lang,"nav_dashboard")}</Link><Link to="/login" onClick={()=>setOpen(false)} className="rounded-md px-2 py-3 text-sm">{t(lang,"nav_login")}</Link></div></div>}</header>
    <div id="main" className="flex-1">{children}</div><footer className="border-t border-border"><div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-display text-lg">{t(lang,"brand")}</p><p className="mt-1 max-w-md text-sm text-muted">{t(lang,"footer_copy")}</p></div><div className="flex flex-wrap gap-4 text-sm"><Link to="/terms" className="text-muted hover:text-fg">{t(lang,"footer_terms")}</Link><Link to="/privacy" className="text-muted hover:text-fg">{t(lang,"footer_privacy")}</Link><Link to="/security" className="text-muted hover:text-fg">{t(lang,"footer_security")}</Link></div></div></footer>
  </div>;
}
