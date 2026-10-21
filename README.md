# Indigo Prime Academy — web sitesi

Indigo Academy'ye bağlı Indigo Prime Academy (7–12. sınıflar, karma eğitim, Cambridge programı + Singapur metodu)
için 3 dilli (İngilizce, Kırgızca, Rusça) statik site. Asylkech Girls' School sitesiyle aynı altyapıyı kullanır.

## Yapı
```
src/build.mjs          Sayfa şablonları + okul bilgileri (telefon, WhatsApp, Instagram, harita, kadro listesi)
src/content/en|ky|ru   Her dilin tüm metinleri
assets/css, js, img    Tasarım, betikler, logo
docs/                  Derlenmiş site (GitHub Pages bu klasörü yayınlar)
server/                Yapay zeka asistanı için Cloudflare Worker (isteğe bağlı)
```

Derleme: `node src/build.mjs` (Node 18+, bağımlılık yok).

Sayfalar (her dilde ayrı): `index` (Ana sayfa), `about`, `academics` (Programlar: Lower Secondary / IGCSE / A Level),
`method` (Cambridge & Singapur metodu), `admissions`, `school-life`, `staff` (Öğretmenler), `news`, `contact`.
Adresleri: `/en/…`, `/ky/…`, `/ru/…`. Kök `index.html` dil seçim sayfasıdır.

## Doldurulması gerekenler (yayından önce)
`src/build.mjs` → `SITE`:
- `phones`: okul telefonları. Boşken telefon satırları hiç gösterilmez.
- `whatsapp`: WhatsApp numarası (`996…`). Boşken iletişim formu ve "WhatsApp" düğmeleri Instagram Direct'i açar
  (mesaj panoya kopyalanır).
- `map`: 2GIS bağlantısı (şu an verilen koordinat: 42.843915, 74.628493).

Metinlerde (`src/content/*.mjs` → `common`):
- `address` / `addressShort`: tam sokak adresi (şu an sadece "Bishkek, Kyrgyzstan").
- `hoursVal`: çalışma saatleri (taslak: Pzt–Cum 08:00–17:00).

Taslak olup okulla doğrulanması gerekenler: günlük program saatleri, kabul belgeleri, giriş sınavı (İngilizce + matematik),
sunulan IGCSE / A Level dersleri, SSS cevapları, takvim.

## Kadro (öğretmenler)
`src/build.mjs` içindeki `STAFF` listesinde her kişinin `name` alanını doldurun:
`name: 'Айгүл Асанова'` veya dile göre `name: { en: '…', ky: '…', ru: '…' }`.
Görev adları `src/content/*.mjs` içinde `staff.roles` altındadır; kişi eklemek için `STAFF`'a satır, `roles`'a görev ekleyin.
Portre: `assets/img/staff/<id>.jpg`.

## Gerçek fotoğrafları eklemek
Dosyayı aşağıdaki adla koyup tekrar derleyin; yer tutucu otomatik olarak fotoğrafla değişir.

| Dosya | Nerede |
|---|---|
| `assets/img/photos/home-welcome.jpg` | Ana sayfa karşılama |
| `assets/img/photos/stage-1.jpg`, `stage-2.jpg`, `stage-3.jpg` | Programlar (Lower Secondary, IGCSE, A Level) |
| `assets/img/photos/life-1.jpg`, `life-2.jpg`, `life-3.jpg` | Okul hayatı kolajı |
| `assets/img/photos/about-story.jpg`, `director.jpg`, `languages.jpg` | Hakkımızda / Programlar |
| `assets/img/photos/news-instagram.jpg`, `news-network.jpg` | Haberler |

## Yapay zeka asistanı
Asylkech sitesindekiyle aynı: sağ alttaki asistan sitedeki metinlerden üretilen bilgi tabanıyla (`docs/assets/data/kb-*.json`)
cevap verir. Gerçek yapay zeka için `server/` klasöründeki Worker'ı kurun (`npx wrangler secret put ANTHROPIC_API_KEY`,
`npx wrangler deploy`), sonra `SITE.aiEndpoint` alanına adresini yazıp tekrar derleyin.

## Yayın: GitHub Pages
1. GitHub'da `indigoprimeacademy` adında yeni bir depo açın ve bu klasörü gönderin.
2. **Settings → Pages → Deploy from a branch**, **Branch: `main`**, klasör **`/docs`** → **Save**.
3. Adres: `https://ademtkn.github.io/indigoprimeacademy/` (farklı bir depo adı seçerseniz `SITE.url`'i güncelleyin).
Alan adına geçerken `SITE.url` ve `SITE.customDomain` değerlerini değiştirip derleyin (derleme `docs/CNAME` yazar).
