// Dayanıklılık katmanı: başarılı veri çekimini data/snapshots/*.json'a yazar,
// ESPN erişilemez/şekil bozuksa son bilinen anlık görüntüyü (stale) döndürür.

import { promises as fs } from "fs";
import path from "path";
import type { DataResult } from "@/lib/domain/types";

const DIR = path.join(process.cwd(), "data", "snapshots");

function safeKey(key: string): string {
  return key.replace(/[^a-z0-9_-]/gi, "_");
}

export async function writeSnapshot(key: string, data: unknown): Promise<void> {
  try {
    await fs.mkdir(DIR, { recursive: true });
    await fs.writeFile(
      path.join(DIR, `${safeKey(key)}.json`),
      JSON.stringify(data),
      "utf8",
    );
  } catch {
    // yazılamazsa sessizce geç (ör. salt-okunur FS)
  }
}

export async function readSnapshot<T>(key: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(
      path.join(DIR, `${safeKey(key)}.json`),
      "utf8",
    );
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

interface SnapshotOpts<T> {
  // Veri "geçerli/dolu" mu? false ise snapshot'ı ezme, mümkünse snapshot'a düş.
  isValid?: (data: T) => boolean;
}

export async function withSnapshot<T>(
  key: string,
  fetcher: () => Promise<T>,
  opts: SnapshotOpts<T> = {},
): Promise<DataResult<T>> {
  try {
    const data = await fetcher();
    const valid = opts.isValid ? opts.isValid(data) : true;
    if (valid) {
      await writeSnapshot(key, data);
      return { data, stale: false };
    }
    // Boş/geçersiz veri: elde snapshot varsa onu tercih et
    const snap = await readSnapshot<T>(key);
    if (snap !== null) return { data: snap, stale: true };
    return { data, stale: false };
  } catch (err) {
    const snap = await readSnapshot<T>(key);
    if (snap !== null) return { data: snap, stale: true };
    throw err;
  }
}
