"use client";

import { useEspnPoll } from "@/components/useEspnPoll";
import { browserStandings } from "@/lib/espn/browser";
import { GroupTable } from "@/components/GroupTable";
import { EmptyState } from "@/components/ui";
import type { GroupStanding } from "@/lib/domain/types";

// Grup tabloları — tarayıcıda dakikada bir tazelenir.
export function LiveGroups({ initial }: { initial: GroupStanding[] }) {
  const { data } = useEspnPoll(browserStandings, 60000, initial);
  if (!data.length) return <EmptyState title="Grup tablosu verisi alınamadı." />;
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {data.map((g) => (
        <GroupTable key={g.groupId} group={g} />
      ))}
    </div>
  );
}
