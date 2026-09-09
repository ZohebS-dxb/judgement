"use client";
import { House, UserRoundPlus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LoginForm } from "./login-form";

export function JoinView(){
  const router=useRouter();const[status,setStatus]=useState<"loading"|"none"|"auth">("loading");const[guestName,setGuestName]=useState("");const[error,setError]=useState("");
  const join=useCallback(async(guestName?:string)=>{const response=await fetch("/api/games/current/join",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(guestName?{guestName}:{})});const body=await response.json();if(response.ok){router.replace("/lobby");return;}if(response.status===404)setStatus("none");else if(response.status===401)setStatus("auth");else setError(body.error);},[router]);
  useEffect(()=>{void join();},[join]);
  return <main className="landscape-page centered-page"><a className="icon-link corner-home" href="/" aria-label="Home"><House/></a><section className="join-panel">{status==="loading"&&<div className="loader-ring"/>}{status==="none"&&<><h2>No game is currently running.</h2><a className="primary-button" href="/">Create</a></>}{status==="auth"&&<div className="join-columns"><div><h2>Open Seats</h2><LoginForm submitLabel="Join" onSuccess={()=>void join()}/></div><form className="clean-form guest-form" onSubmit={(e)=>{e.preventDefault();void join(guestName)}}><label>Guest<input maxLength={30} value={guestName} onChange={(e)=>setGuestName(e.target.value)}/></label><button className="secondary-button" disabled={!guestName.trim()}><UserRoundPlus/>Join</button></form></div>}{error&&<p className="form-error">{error}</p>}</section></main>;
}
