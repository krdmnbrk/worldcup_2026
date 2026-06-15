# 2026 FIFA Dünya Kupası — Takip Merkezi

Türkçe, mobil öncelikli, **tamamen statik** bir 2026 Dünya Kupası takip sitesi.
Canlı skorlar, fikstür, grup tabloları, eleme ağacı, turnuva istatistikleri ve
oyuncu/takım profilleri. Veri kaynağı **yalnızca ESPN'in anahtarsız açık API'si**
(ücretli/ikinci sağlayıcı yok).

🔗 Canlı: <https://krdmnbrk.github.io/worldcup_2026/>

## Yığın

- **Next.js 16** (App Router) + **React 19** + **TypeScript** (strict)
- **Tailwind CSS v4** · **Recharts** (istatistik grafikleri)
- `output: "export"` ile **statik dışa aktarım** → GitHub Pages (`/worldcup_2026` alt yolu)
- **PWA**: manifest + service worker (HTML network-first, hashed varlık cache-first)

## Veri mimarisi

İki ayrı yol; ikisi de aynı normalize katmanını (`lib/espn/normalize.ts`) paylaşır:

| Yol | Nerede | Ne için |
|-----|--------|---------|
| **Build-time** | `lib/data.ts` (+ `lib/espn/client.ts`) | Statik sayfaları üretir; başarılı çekim `data/snapshots/*.json`'a yazılır |
| **Canlı (tarayıcı)** | `lib/espn/browser.ts` + `components/useEspnPoll.ts` | Sayfa açıkken ESPN'den doğrudan (CORS açık) skor/dakika tazeler |
| **Dayanıklılık** | `lib/snapshot.ts` (`withSnapshot`) | ESPN erişilemezse son bilinen anlık görüntüye düşer (`stale` rozeti) |

Turnuva tarih pencereleri tek kaynakta: `TOURNAMENT_CHUNKS` (`lib/espn/endpoints.ts`).

## Geliştirme

```bash
npm ci
npm run dev        # http://localhost:3000
```

### Komutlar

| Komut | Açıklama |
|-------|----------|
| `npm run dev` | Geliştirme sunucusu |
| `npm run build` | Statik dışa aktarım (`out/`) |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run check:espn` | ESPN uçlarının gerçek WC2026 verisi döndürdüğünü doğrular |
| `npm run fetch:photos` | Wikimedia'dan oyuncu fotoğrafları indirir |
| `npm run optimize:photos` | Fotoğrafları webp'ye çevirir/küçültür |
| `npm run gen:icons` | PWA ikonlarını üretir |

## Dağıtım

GitHub Actions (`.github/workflows/deploy.yml`): `push` (master) + cron (`*/30`) +
elle tetik. **Kalite kapısı**: `lint → typecheck → build` geçmeden deploy olmaz.
Canlı veri zaten tarayıcıda tazelendiğinden, periyodik yeniden derlemenin asıl
işlevi yeni maç/oyuncu sayfalarını ve build-time snapshot'ları güncellemektir.

## Kaynak künyesi

Maç/oyuncu/istatistik verisi ve görsellerin çoğu **ESPN açık API**'sinden gelir;
eksik bayraklar için `flagcdn.com`, bazı oyuncu fotoğrafları için **Wikimedia
Commons** (CC) görsel yedeği kullanılır. Takım armaları ilgili federasyonların
markasıdır, yalnızca tanıtım amaçlı kullanılır. Bu gayriresmî bir hayran projesidir.
