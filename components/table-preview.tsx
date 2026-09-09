"use client";
import { DoorOpen, Minus, Plus } from "lucide-react";
import type { CSSProperties } from "react";
import { PlayingCard } from "./playing-card";
import type { Card } from "@/lib/game/types";

const allCards:Card[]=[{rank:"A",suit:"spades"},{rank:"K",suit:"spades"},{rank:"J",suit:"spades"},{rank:"9",suit:"spades"},{rank:"A",suit:"hearts"},{rank:"Q",suit:"hearts"},{rank:"10",suit:"hearts"},{rank:"7",suit:"hearts"},{rank:"K",suit:"diamonds"},{rank:"Q",suit:"diamonds"},{rank:"8",suit:"diamonds"},{rank:"5",suit:"diamonds"},{rank:"A",suit:"clubs"},{rank:"K",suit:"clubs"},{rank:"10",suit:"clubs"},{rank:"6",suit:"clubs"},{rank:"3",suit:"clubs"}];
const plays:Record<string,Card>={Divya:{rank:"Q",suit:"clubs"},Saurabh:{rank:"4",suit:"clubs"},Zoheb:{rank:"A",suit:"clubs"},Ashu:{rank:"2",suit:"hearts"}};

export function TablePreview({playerCount=4,cardCount=8,bidding=false}:{playerCount?:3|4;cardCount?:number;bidding?:boolean}){
  const names=playerCount===3?["Divya","Saurabh","Zoheb"]:["Divya","Saurabh","Zoheb","Ashu"];
  const hand=allCards.slice(0,Math.max(1,Math.min(17,cardCount)));
  const columns=hand.length>9?9:hand.length;
  return <main className={`game-page portrait-game ${bidding?"bidding-phase":"my-turn"} ${hand.length>9?"large-hand":""}`}>
    <header className="top-game-bar"><strong className="red-suit">♥ HEARTS</strong><span>Deal {cardCount}</span><button className="end-game-icon" aria-label="End Game"><DoorOpen/></button></header>
    <div className="turn-announcement local-turn">{bidding?"Place Your Bid":"Zoheb's Turn"}</div>
    <section className={`portrait-play-grid players-${playerCount}`}>{names.map((name,index)=><article className="portrait-player-slot" key={name}><div className="central-card-slot">{!bidding&&index<playerCount-1?<div className="central-played-card"><PlayingCard card={plays[name]}/></div>:<div className="empty-card-slot"/>}</div><div className="portrait-player-info"><span className="connection-dot online"/><strong>{name}{name==="Zoheb"?" · You":""} <span>({Math.max(0,index-1)}/{index+1})</span></strong>{index===0&&<b className="dealer-badge">D</b>}</div></article>)}</section>
    {bidding&&<div className="portrait-bid-panel"><div className="bid-timer">20</div><div className="bid-stepper"><button><Minus/></button><strong>4</strong><button><Plus/></button></div><button className="primary-button bid-submit">Submit</button></div>}
    <section className={`portrait-hand ${hand.length>9?"two-row":""}`} style={{"--hand-columns":columns} as CSSProperties}>{hand.map(card=><button className={`hand-card ${bidding?"view-only":"legal"}`} key={`${card.rank}-${card.suit}`}><PlayingCard card={card}/></button>)}</section>
  </main>;
}
