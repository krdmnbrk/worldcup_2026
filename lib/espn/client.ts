// ESPN açık API'sine düşük seviyeli erişim: zaman aşımı, tek tekrar, Next önbellek.

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

export interface EspnFetchOpts {
  // Next.js ISR önbellek süresi (saniye). 0 = önbelleksiz.
  revalidate?: number;
  tags?: string[];
  timeoutMs?: number;
}

export async function espnFetch<T>(
  url: string,
  opts: EspnFetchOpts = {},
): Promise<T> {
  const { revalidate = 300, tags, timeoutMs = 12000 } = opts;
  let lastErr: unknown;

  for (let attempt = 0; attempt < 2; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "application/json, text/plain, */*",
        },
        signal: controller.signal,
        next: { revalidate, tags },
      });
      clearTimeout(timer);
      if (!res.ok) {
        throw new Error(`ESPN ${res.status} ${res.statusText} — ${url}`);
      }
      return (await res.json()) as T;
    } catch (err) {
      clearTimeout(timer);
      lastErr = err;
      // kısa ağ hatalarında bir kez daha dene
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error(`ESPN fetch failed: ${url}`);
}
