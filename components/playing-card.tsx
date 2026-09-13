import type { Card } from "@/lib/game/types";
import Image from "next/image";
import { cardAsset } from "@/lib/client/card-assets";

export function PlayingCard({ card, title }: { card: Card; title?: string }) {
  return <Image className="playing-card-svg" src={cardAsset(card)} width={100} height={140} unoptimized draggable={false} alt={title ?? `${card.rank} of ${card.suit}`}/>;
}
