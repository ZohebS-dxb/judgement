"use client";
import { BarChart3, Wifi } from "lucide-react";
import { PlayingCard } from "./playing-card";
import type { Card } from "@/lib/game/types";

const hand: Card[] = [
  { rank: "A", suit: "spades" }, { rank: "10", suit: "hearts" }, { rank: "K", suit: "clubs" },
  { rank: "7", suit: "diamonds" }, { rank: "J", suit: "spades" }, { rank: "3", suit: "hearts" },
];
const players = [
  { name: "Zoheb", position: "bottom", bid: 2, won: 1, score: 30 },
  { name: "Divya", position: "left", bid: 1, won: 1, score: 20 },
  { name: "Saurabh", position: "top", bid: 0, won: 0, score: 10 },
  { name: "Ashu", position: "right", bid: 3, won: 2, score: -10 },
];

export function TablePreview() {
  return <main className="game-page preview-page">
    <header className="game-hud"><span className="preview-logo">Judgement</span><div className="hud-center"><span className="badge">R <strong>6/10</strong></span><span className="badge trump"><strong>♥ Hearts</strong></span><span className="badge"><strong>↻ CW</strong></span></div><button className="button ghost icon-button"><BarChart3 size={19}/></button></header>
    <div className="table-stage"><div className="table-felt">
      {players.map((player,index)=><div className={`player-seat ${player.position}`} key={player.name}><div className={`player-info ${index===0?"active":""}`}><span className="connection"><Wifi size={11}/></span><span className="player-avatar">{player.name[0]}</span><div className="player-meta">{player.name}{index===0?" · You":""}<div className="player-score">Bid {player.bid} · Won {player.won} · {player.score}</div></div>{index===1&&<span className="dealer-dot">D</span>}</div>{index>0&&<div className="card-backs">{Array.from({length:6},(_,i)=><i className="mini-back" key={i}/>)}</div>}{index===0&&<div className="hand">{hand.map((card,i)=><button className={`hand-card legal ${i===1?"selected":""}`} style={{zIndex:i,transform:`rotate(${(i-2.5)*2.5}deg)`}} key={`${card.rank}-${card.suit}`}><PlayingCard card={card}/></button>)}</div>}</div>)}
      <div className="trick-area"><div className="played-card p1"><PlayingCard card={{rank:"Q",suit:"clubs"}}/></div><div className="played-card p2"><PlayingCard card={{rank:"4",suit:"clubs"}}/></div><div className="played-card p3"><PlayingCard card={{rank:"2",suit:"hearts"}}/></div></div>
      <div className="turn-chip">Your turn</div><div className="play-confirm"><button className="button">Play 10 ♥</button><button className="button ghost">Cancel</button></div>
    </div></div>
  </main>;
}
