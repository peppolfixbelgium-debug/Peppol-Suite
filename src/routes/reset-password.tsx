import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/reset-password")({ component: ResetPassword });

async function post(path: string, payload: unknown) {
  const response = await fetch(`/api/auth/${path}`, { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Request failed.");
  return data;
}

function ResetPassword(){
  const navigate=useNavigate();
  const token=new URLSearchParams(window.location.search).get("token") ?? "";
  const [email,setEmail]=useState(""); const [password,setPassword]=useState(""); const [busy,setBusy]=useState(false); const [message,setMessage]=useState<string|null>(null); const [error,setError]=useState<string|null>(null);
  async function submit(e:FormEvent){e.preventDefault();setBusy(true);setError(null);setMessage(null);try{if(token){await post("password-reset/complete",{token,password});setMessage("Your password was reset. You can now sign in.");setTimeout(()=>void navigate({to:"/login"}),700);}else{await post("password-reset/request",{email});setMessage("If an account exists for that email, a reset link has been sent.");}}catch(e){setError(e instanceof Error?e.message:"Request failed");}finally{setBusy(false);}}
  return <main className="mx-auto grid min-h-[70vh] max-w-md place-items-center px-4 py-12"><div className="w-full rounded-2xl border border-border bg-elevated p-6"><h1 className="font-display text-3xl tracking-tight">{token?"Set a new password":"Reset your password"}</h1><p className="mt-2 text-sm text-muted">{token?"Choose a new password for your account.":"Enter your email and we will send a reset link if the account exists."}</p><form className="mt-6 grid gap-3" onSubmit={submit}>{token?<label className="grid gap-1 text-sm">New password<Input type="password" minLength={12} required value={password} onChange={e=>setPassword(e.target.value)}/></label>:<label className="grid gap-1 text-sm">Email<Input type="email" required value={email} onChange={e=>setEmail(e.target.value)}/></label>}{error&&<p className="text-sm text-danger">{error}</p>}{message&&<p className="text-sm text-accent">{message}</p>}<Button disabled={busy}>{token?"Reset password":"Send reset link"}</Button></form></div></main>;
}
