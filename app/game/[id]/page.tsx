import { GameTable } from "@/components/game-table";

export default async function GamePage({ params }: { params: Promise<{ id: string }> }) {
  return <GameTable gameId={(await params).id} />;
}
