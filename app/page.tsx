import { Dashboard } from "@/components/dashboard";
import { currentPlayer } from "@/lib/server/auth";

export default async function Home() {
  const player = await currentPlayer();
  return <Dashboard playerName={player?.name ?? null} />;
}
