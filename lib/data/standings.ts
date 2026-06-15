// Grup tabloları (12 grup).

import { withSnapshot } from "@/lib/snapshot";
import type { GroupStanding, DataResult } from "@/lib/domain/types";
import { fetchStandings } from "@/lib/data/fetchers";

export function getStandings(): Promise<DataResult<GroupStanding[]>> {
  return withSnapshot("standings", fetchStandings, {
    isValid: (d) => d.length > 0,
  });
}
