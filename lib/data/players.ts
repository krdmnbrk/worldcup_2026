// Birleşik oyuncu dizini + tek oyuncu sayfası (WC içi katkılar: gol/asist/kart).

import { withSnapshot } from "@/lib/snapshot";
import type {
  Match,
  Player,
  MatchEvent,
  DataResult,
} from "@/lib/domain/types";
import { byDate, fetchAllMatches, fetchPlayerIndex } from "@/lib/data/fetchers";

export interface PlayerContribution {
  match: Match;
  events: MatchEvent[];
}
export interface PlayerPage {
  player: Player;
  goals: number;
  penalties: number;
  ownGoals: number;
  yellow: number;
  red: number;
  appearances: PlayerContribution[];
}

export function getPlayerIndex(): Promise<DataResult<Player[]>> {
  return withSnapshot("player-index", fetchPlayerIndex, {
    isValid: (d) => d.length > 0,
  });
}

export function getPlayer(athleteId: string): Promise<DataResult<PlayerPage>> {
  return withSnapshot(`player-${athleteId}`, async () => {
    const [index, allMatches] = await Promise.all([
      fetchPlayerIndex(),
      fetchAllMatches(),
    ]);
    const base = index.find((p) => p.id === athleteId);
    // Kadroda olmayan ama maç olaylarında geçen oyuncu için ismi olaydan al
    const evName = base
      ? undefined
      : allMatches
          .flatMap((m) => m.events)
          .find((e) => e.playerId === athleteId && e.player)?.player;
    const player: Player = base ?? { id: athleteId, name: evName ?? "Oyuncu" };

    let goals = 0,
      penalties = 0,
      ownGoals = 0,
      yellow = 0,
      red = 0;
    const appearances: PlayerContribution[] = [];
    for (const m of allMatches) {
      const evs = m.events.filter((e) => e.playerId === athleteId);
      if (!evs.length) continue;
      appearances.push({ match: m, events: evs });
      for (const e of evs) {
        if (e.type === "goal") goals++;
        else if (e.type === "penalty") {
          goals++;
          penalties++;
        } else if (e.type === "own-goal") ownGoals++;
        else if (e.type === "yellow") yellow++;
        else if (e.type === "red") red++;
      }
    }
    appearances.sort((a, b) => byDate(a.match, b.match));
    return { player, goals, penalties, ownGoals, yellow, red, appearances };
  });
}
