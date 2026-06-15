// Eleme ağacı (2026 formatı: 32 takım → Final) + grup tur-atlama hesabı
// (en iyi 8 üçüncü dahil). Saf computeQualification ayrıca birim testlidir.

import { withSnapshot } from "@/lib/snapshot";
import type {
  GroupStanding,
  Team,
  StandingRow,
  Bracket,
  BracketSlot,
  BracketRound,
  DataResult,
} from "@/lib/domain/types";
import { fetchAllMatches, fetchStandings } from "@/lib/data/fetchers";

export interface GroupQualifier {
  groupId: string;
  winner?: Team;
  runnerUp?: Team;
  third?: { team: Team; row: StandingRow };
  complete: boolean;
}
export interface ThirdPlaceRow {
  groupId: string;
  row: StandingRow;
  qualifies: boolean;
}
export interface Qualification {
  groups: GroupQualifier[];
  thirds: ThirdPlaceRow[];
  complete: boolean;
}

export function computeQualification(standings: GroupStanding[]): Qualification {
  const groups: GroupQualifier[] = standings.map((g) => {
    const rows = g.rows;
    const complete = rows.every((r) => r.played >= 3) && rows.length >= 4;
    return {
      groupId: g.groupId,
      winner: rows[0]?.team,
      runnerUp: rows[1]?.team,
      third: rows[2] ? { team: rows[2].team, row: rows[2] } : undefined,
      complete,
    };
  });

  const thirdsRaw = standings
    .map((g) => (g.rows[2] ? { groupId: g.groupId, row: g.rows[2] } : null))
    .filter(Boolean) as { groupId: string; row: StandingRow }[];

  thirdsRaw.sort((a, b) => {
    if (b.row.points !== a.row.points) return b.row.points - a.row.points;
    if (b.row.gd !== a.row.gd) return b.row.gd - a.row.gd;
    if (b.row.gf !== a.row.gf) return b.row.gf - a.row.gf;
    return a.row.team.name.localeCompare(b.row.team.name);
  });

  const thirds: ThirdPlaceRow[] = thirdsRaw.map((t, i) => ({
    ...t,
    qualifies: i < 8,
  }));

  const complete = standings.length === 12 && groups.every((g) => g.complete);
  return { groups, thirds, complete };
}

export interface BracketData {
  bracket: Bracket;
  qualification: Qualification;
}

const ROUND_DEFS: { round: BracketRound; label: string; count: number }[] = [
  { round: "R32", label: "Son 32 Turu", count: 16 },
  { round: "R16", label: "Son 16 Turu", count: 8 },
  { round: "QF", label: "Çeyrek Final", count: 4 },
  { round: "SF", label: "Yarı Final", count: 2 },
  { round: "3RD", label: "Üçüncülük", count: 1 },
  { round: "F", label: "Final", count: 1 },
];

function stageToRound(stage: string): BracketRound | null {
  switch (stage) {
    case "r32":
      return "R32";
    case "r16":
      return "R16";
    case "qf":
      return "QF";
    case "sf":
      return "SF";
    case "third":
      return "3RD";
    case "final":
      return "F";
    default:
      return null;
  }
}

export function getBracket(): Promise<DataResult<BracketData>> {
  return withSnapshot("bracket", async () => {
    const [standings, allMatches] = await Promise.all([
      fetchStandings(),
      fetchAllMatches(),
    ]);
    const qualification = computeQualification(standings);

    const slots: BracketSlot[] = [];
    for (const def of ROUND_DEFS) {
      const real = allMatches.filter((m) => stageToRound(m.stage) === def.round);
      for (let i = 0; i < def.count; i++) {
        const m = real[i];
        if (m) {
          slots.push({
            id: `${def.round}-${i}`,
            round: def.round,
            matchId: m.id,
            status: m.status,
            date: m.date,
            home: {
              team: m.home,
              score: m.home.score,
              shootout: m.home.shootoutScore,
            },
            away: {
              team: m.away,
              score: m.away.score,
              shootout: m.away.shootoutScore,
            },
          });
        } else {
          slots.push({
            id: `${def.round}-${i}`,
            round: def.round,
            home: { placeholder: "?" },
            away: { placeholder: "?" },
          });
        }
      }
    }

    const provisional = !qualification.complete;
    const qualifiersKnown = allMatches.some(
      (m) => stageToRound(m.stage) !== null,
    );

    return {
      bracket: { slots, provisional, qualifiersKnown },
      qualification,
    };
  });
}
