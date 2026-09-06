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

Depoda yayın iş akışı hazır (`.github/workflows/pages.yml`), ama **Pages'i ilk kez açmak
depo ayarlarından yapılması gereken tek seferlik bir adım** — iş akışının kendi jetonu
bunu yapmaya yetkili değil (`Resource not accessible by integration`).

**1. adım (bir kez, senin yapman gerekiyor):**
`Settings → Pages → Build and deployment → Source` altında **GitHub Actions**'ı seç.

**2. adım:** `Actions → GitHub Pages` çalışmasını `Re-run jobs` ile tekrar başlat
(veya yeni bir commit gönder). Bundan sonrası otomatik: her push'ta site yeniden yayınlanır.

Site adresi şöyle olur:
`https://haydarsahin0.github.io/Su/`

> Alternatif: Actions ile uğraşmak istemezsen `Settings → Pages → Source: Deploy from a branch`
> seçip dalı ve `/ (root)` klasörünü de gösterebilirsin. Bu durumda `.github/workflows/pages.yml`
> dosyasını silmen iyi olur, yoksa her push'ta kırmızı bir çalışma bırakır.

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
