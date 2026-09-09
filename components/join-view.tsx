"use client";
import { ArrowLeft, UserRoundPlus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Brand } from "./brand";
import { LoginForm } from "./login-form";

export function JoinView(){
  const router=useRouter();const[status,setStatus]=useState<"loading"|"none"|"auth">("loading");const[guestName,setGuestName]=useState("");const[error,setError]=useState("");
  const join=useCallback(async(guestName?:string)=>{const response=await fetch("/api/games/current/join",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(guestName?{guestName}:{})});const body=await response.json();if(response.ok){router.replace("/lobby");return;}if(response.status===404)setStatus("none");else if(response.status===401)setStatus("auth");else setError(body.error);},[router]);
  useEffect(()=>{void join();},[join]);
  return <main className="ambient login-wrap"><section className="panel login-card join-card"><a className="back-link" href="/"><ArrowLeft size={16}/> Home</a><Brand/><div className="join-content">{status==="loading"&&<><div className="loader-ring"/><h2>Finding the table…</h2></>}{status==="none"&&<><div className="eyebrow">No active game</div><h2>No game is currently running.</h2><p className="subtle">Create a game to open the table for everyone.</p><a className="button ready-button" href="/">Create game</a></>}{status==="auth"&&<><div className="eyebrow">Join the current game</div><h2>Take your seat</h2><LoginForm submitLabel="Sign in & join" onSuccess={()=>void join()}/><div className="or-divider"><span>or</span></div><form onSubmit={(e)=>{e.preventDefault();void join(guestName)}} className="form-stack"><div className="field"><label htmlFor="guest">Guest name</label><input id="guest" maxLength={30} value={guestName} onChange={(e)=>setGuestName(e.target.value)} placeholder="Enter a display name"/></div><button className="button secondary" disabled={!guestName.trim()}><UserRoundPlus size={18}/> Join as guest</button></form></>}{error&&<p className="error">{error}</p>}</div></section></main>;
}
