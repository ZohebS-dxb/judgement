"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm({ onSuccess, submitLabel = "Continue" }: { onSuccess?: () => void; submitLabel?: string }) {
  const router = useRouter(); const [players,setPlayers]=useState<Array<{id:string;name:string}>>([]); const [name,setName]=useState(""); const [pin,setPin]=useState(""); const [error,setError]=useState(""); const [busy,setBusy]=useState(false);
  useEffect(()=>{fetch("/api/players").then((r)=>r.json()).then((body)=>setPlayers(body.players??[]));},[]);
  async function submit(event:React.FormEvent){event.preventDefault();setBusy(true);setError("");const response=await fetch("/api/auth/login",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({name,pin})});const body=await response.json();setBusy(false);if(!response.ok)return setError(body.error??"Could not log in");if(onSuccess)onSuccess();else{router.replace("/");router.refresh();}}
  return <form className="form-stack" onSubmit={submit}><div className="field"><label htmlFor="name">Player</label><select id="name" value={name} onChange={(e)=>setName(e.target.value)}><option value="">Choose your name</option>{players.map((player)=><option key={player.id}>{player.name}</option>)}</select></div><div className="field"><label htmlFor="pin">4-digit PIN</label><input id="pin" inputMode="numeric" autoComplete="current-password" pattern="[0-9]{4}" maxLength={4} value={pin} onChange={(e)=>setPin(e.target.value.replace(/\D/g,""))}/></div><div className="error">{error}</div><button className="button" disabled={busy||!name||pin.length!==4}>{busy?"Checking…":submitLabel}</button></form>;
}
