import { NextRequest, NextResponse } from "next/server";
import { participantForGame } from "@/lib/server/auth";
import { finalizeCompletedGame } from "@/lib/server/finalize-game";
import { apiError } from "@/lib/server/http";
import { showSaurabhMehtaLastPlace } from "@/lib/game/lifecycle";

export async function POST(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await context.params;
    const participant = await participantForGame(id);
    const result = await finalizeCompletedGame(id);
    const localPlayer = result.state.players.find((player) => player.id === participant.id);
    return NextResponse.json({
      ok: true,
      finalizedNow: result.finalizedNow,
      showSaurabhLastPlace: localPlayer ? showSaurabhMehtaLastPlace({ profileId: participant.profileId, name: participant.name, totalScore: localPlayer.totalScore, lowestScore: result.lowScore, completed: true }) : false,
    });
  } catch (error) {
    return apiError(error);
  }
}
