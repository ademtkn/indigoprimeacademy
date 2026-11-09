# Indigo Prime Academy — web sitesi

Indigo Academy'ye bağlı Indigo Prime Academy (7–12. sınıflar, karma eğitim, Cambridge programı + Singapur metodu)
için 3 dilli (İngilizce, Kırgızca, Rusça) statik site. Asylkech Girls' School sitesiyle aynı altyapıyı kullanır.

## Yönetim paneli (admin)
Adres: **https://ademtkn.github.io/indigoprimeacademy/admin/**

Panelden kod bilmeden şunlar değiştirilebilir, her metin üç dilde (EN / KG / RU) yan yana:
- **Sayfa metinleri:** tüm sayfalardaki başlıklar, yazılar, SSS, kulüpler, takvim… Listelere öğe eklenip silinebilir, sırası değiştirilebilir.
- **Menü:** sayfaların sırası, menüdeki adı, menüde gösterilip gizlenmesi.
- **Öğretmenler:** ad, görev, bölüm, fotoğraf; yeni öğretmen ekleme ve silme.
- **Haberler:** fotoğraflı haber; son üç haber ana sayfada da görünür, her haberin kendi sayfası olur.
- **Ek sayfalar:** menüye yeni sayfa (ör. Burslar).
- **Resimler:** sayfalardaki fotoğraf alanları (yüklenen resim otomatik küçültülür).
- **İletişim ve ayarlar:** telefon, WhatsApp, adres, saatler, Instagram, 2GIS bağlantısı.

**Giriş:** Panel bir GitHub erişim anahtarıyla açılır (giriş ekranında adım adım anlatılıyor):
GitHub → Settings → Developer settings → Fine-grained tokens → yalnızca `indigoprimeacademy` deposu,
izinler **Contents: Read and write** ve **Actions: Read-only**. Her editöre ayrı anahtar verin; ayrılan kişinin anahtarını silin.

**Nasıl çalışır:** “Kaydet ve yayınla” tüm değişiklikleri depoya tek bir commit olarak yazar. Ardından
`.github/workflows/deploy.yml` (GitHub Actions) siteyi `node src/build.mjs` ile derleyip `gh-pages` dalına yayınlar.
Bu süreç yaklaşık 1–2 dakika sürer; panelin üst çubuğu “✓ Yayınlandı” yazınca bitmiştir.

## Yapı
```
content/site.json      İletişim bilgileri, menü sırası/görünürlüğü
content/en|ky|ru.json  Her dilin tüm metinleri
content/staff.json     Öğretmenler (ad ve görev 3 dilde, bölüm)
content/news.json      Haberler        content/pages.json   Ek sayfalar
content/images.json    Resimler bölümündeki fotoğraf alanlarının listesi
admin/                 Yönetim paneli
src/build.mjs          Sayfa şablonları (content/ dosyalarından siteyi üretir)
assets/css, js, img    Tasarım, betikler, logo, yüklenen fotoğraflar
server/                Yapay zeka asistanı için Cloudflare Worker (isteğe bağlı)
```
Derleme: `node src/build.mjs` (Node 18+, bağımlılık yok) → `docs/` (depoya konmaz, Actions üretir).

Sayfalar (her dilde ayrı): `index`, `about`, `academics`, `method`, `admissions`, `school-life`, `staff`, `news`, `contact`,
ayrıca her haber için `news-<id>.html` ve her ek sayfa için `page-<ad>.html`. Kök `index.html` dil seçim sayfasıdır.

## Fotoğraf dosyaları
Panel fotoğrafları şu adlarla kaydeder: `assets/img/photos/*.jpg` (sayfa fotoğrafları), `assets/img/staff/<id>.jpg`,
`assets/img/news/<id>.jpg`, `assets/img/pages/<ad>.jpg`. Fotoğrafı olmayan alanlarda tasarımdaki renkli desen görünür.

## Yayından önce doğrulanacaklar
Telefon/WhatsApp ve tam adres boş; çalışma saatleri, günlük program, giriş sınavı, belge listesi, IGCSE/A Level dersleri
ve SSS cevapları taslaktır. Hepsi panelden düzeltilebilir.

## Yapay zeka asistanı
Asylkech sitesindekiyle aynı: sağ alttaki asistan sitedeki metinlerden üretilen bilgi tabanıyla (`docs/assets/data/kb-*.json`)
cevap verir. Gerçek yapay zeka için `server/` klasöründeki Worker'ı kurun (`npx wrangler secret put ANTHROPIC_API_KEY`,
`npx wrangler deploy`), sonra adresini panelde “İletişim ve ayarlar → Gelişmiş → Asistan sunucusu” alanına yazın.

## Yayın: GitHub Pages
Site `gh-pages` dalından yayınlanır (Settings → Pages → Deploy from a branch → `gh-pages` / `(root)`).
`main` dalına yapılan her değişiklik (panelden ya da koddan) Actions ile otomatik yayınlanır; Actions sekmesinden
“Build and publish site” → **Run workflow** ile elle de çalıştırılabilir.

Alan adına geçerken panelde “İletişim ve ayarlar → Gelişmiş” bölümünden sitenin adresini ve özel alan adını girin
(derleme `CNAME` dosyasını yazar), ardından alan adının DNS kayıtlarını GitHub Pages'e yönlendirin.
