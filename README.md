# 💧 Su Takibi

Günlük içtiğin su miktarını kaydettiğin, sade ve şık bir takip sayfası.
Tamamen statik: kurulum yok, sunucu yok, veriler yalnızca senin tarayıcında (`localStorage`) durur.

## Neler var?

- **Hızlı ekleme** — 200 / 250 / 330 / 500 ml butonları (ayarlardan değiştirilebilir) ya da elle miktar girme
- **Bugünün durumu** — dalga animasyonlu halka: içilen miktar, hedefe kalan, yüzde
- **Geçmiş tarihe kayıt** — tarih seçerek dünün ya da önceki günlerin kaydını da girebilirsin
- **İstatistikler** — son 7 günün ortalaması, **son 7 haftanın günlük ortalaması**, son 30 günde hedefi tutturduğun gün sayısı, en iyi gün
- **Grafik** — 7 gün / 30 gün / 7 hafta olarak geçmiş, üzerinde hedef çizgisiyle
- **Günlük geçmiş listesi** — bir güne tıkla, o günün tüm kayıtlarını gör ve tek tek sil
- **Seri (streak)** — hedefi üst üste kaç gün tutturduğun
- **Koyu / açık tema** — sistem temasını izler, tek tıkla değiştirilebilir
- **Yedekleme** — ayarlardan verileri JSON olarak dışa/içe aktar

## Kullanım

Sadece `index.html` dosyasını tarayıcıda aç. Kurulum gerekmez.

Yerelde denemek için:

```bash
python3 -m http.server 8000
# ardından http://localhost:8000 adresini aç
```

## GitHub Pages ile yayına alma

İki yoldan biri yeterli:

**A) Actions ile (depoda hazır)** — Depoda `Settings → Pages → Build and deployment → Source` altında
**GitHub Actions**'ı seç. `.github/workflows/pages.yml` her push'ta siteyi yayına alır.

**B) Doğrudan branch'ten** — `Settings → Pages → Source: Deploy from a branch`, branch olarak yayınlamak
istediğin dalı ve `/ (root)` klasörünü seç.

Yayına alındıktan sonra adres şöyle olur:
`https://<kullanıcı-adın>.github.io/<depo-adı>/`

## Veriler nerede?

Her şey tarayıcının `localStorage`'ında, `su-takip-v1` anahtarında tutulur. Yani:

- Veriler internete gitmez, hesap gerekmez.
- Tarayıcı verilerini temizlersen kayıtlar silinir → ara ara **Ayarlar → Dışa aktar** ile yedek al.
- Başka bir cihazda görmek için yedeği **İçe aktar** ile yükle.

## Dosyalar

```
index.html         sayfa iskeleti
assets/style.css   tema, yerleşim, animasyonlar
assets/app.js      kayıt/istatistik mantığı ve arayüz
.github/workflows/pages.yml   GitHub Pages yayını
```
