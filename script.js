document.addEventListener('DOMContentLoaded', () => {
    const baslatButton = document.getElementById('baslatButton');
    const oyunAlani = document.getElementById('oyunAlani');
    const sureDiv = document.getElementById('sure');
    const oyunSonuDiv = document.getElementById('oyunSonu');
    const toplamSureSpan = document.getElementById('toplamSure');
    const oyuncuAdiInput = document.getElementById('oyuncuAdi');
    const kaydetButton = document.getElementById('kaydetButton');
    const kayitMesajiParagraf = document.getElementById('kayitMesaj');
    const tekrarOynaButton = document.getElementById('tekrarOynaButton');
    const gosterilenTurkceKelimeDiv = document.getElementById('gosterilenTurkceKelime');
    const geriBildirimMesajlariDiv = document.getElementById('geriBildirimMesajlari');

    const kelimeler = [
        { tr: 'anne', ar: 'أُمّ', ses: 'anne' },
        { tr: 'baba', ar: 'أَب', ses: 'baba' },
        { tr: 'dede', ar: 'جَدّ', ses: 'dede' },
        { tr: 'nine', ar: 'جَدّة', ses: 'nine' },
        { tr: 'amca', ar: 'عَمّ', ses: 'amca' },
        { tr: 'hala', ar: 'عَمّة', ses: 'hala' },
        { tr: 'teyze', ar: 'خَالَة', ses: 'teyze' },
        { tr: 'dayı', ar: 'خَال', ses: 'dayı' },
        { tr: 'kız kardeş', ar: 'أُخْت', ses: 'kız kardeş' },
        { tr: 'erkek kardeş', ar: 'أَخ', ses: 'erkek kardeş' },
        { tr: 'aile', ar: 'عَائِلَة', ses: 'aile' },
        // Evle ilgili kelimeler
        { tr: 'mutfak', ar: 'مَطْبَخ', ses: 'mutfak' },
        { tr: 'banyo', ar: 'حَمّام', ses: 'banyo' },
        { tr: 'tuvalet', ar: 'مِرْحَاض', ses: 'tuvalet' },
        { tr: 'oturma odası', ar: 'غُرْفَة الجُلُوس', ses: 'oturma odası' },
        { tr: 'yatak odası', ar: 'غُرْفَة النَّوْم', ses: 'yatak odası' },
        { tr: 'çocuk odası', ar: 'غُرْفَة الأَطْفَال', ses: 'çocuk odası' },
        // Yön ve coğrafya kelimeleri
        { tr: 'kuzey', ar: 'شَمَال', ses: 'kuzey' },
        { tr: 'güney', ar: 'جَنُوب', ses: 'güney' },
        { tr: 'doğu', ar: 'شَرْق', ses: 'doğu' },
        { tr: 'batı', ar: 'غَرْب', ses: 'غَرْب' },
        { tr: 'Türkiye', ar: 'تُرْكِيَا', ses: 'türkiye' },
        { tr: 'başkent', ar: 'عَاصِمَة', ses: 'başkent' },
        { tr: 'şehir', ar: 'مَدِينَة', ses: 'şehir' },
        { tr: 'Trabzon', ar: 'طَرَابْزُون', ses: 'Trabzon' } // Yeni eklenen kelime
    ];

    const motivasyonKelimeleri = [
        'Harika!',
        'Mükemmel!',
        'Bravo!',
        'Süper!',
        'Doğru!',
        'Aferin!',
        'Tebrikler!',
        'Devam Et!',
        'Başarılı!',
        'Muhteşem!'
    ];

    let aktifKelime;
    let sureSayac = 0; 
    let kronometre;
    let sesTekrarleyici;
    let aktifBalonlar = [];

    function kelimeninIlkHarfiniBuyut(str) {
        if (!str) return '';
        return str.charAt(0).toLocaleUpperCase('tr-TR') + str.slice(1).toLocaleLowerCase('tr-TR');
    }

    function seslendir(metin) {
        if ('speechSynthesis' in window) {
            speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(metin);
            utterance.lang = 'tr-TR';
            speechSynthesis.speak(utterance);
        } else {
            console.warn("Tarayıcınız metin okuma özelliğini desteklemiyor.");
        }
    }

    function rastgeleRenkSinifi() {
        const renkler = ['renk1', 'renk2', 'renk3', 'renk4', 'renk5', 'renk6', 'renk7', 'renk8', 'renk9', 'renk10', 'renk11', 'renk12'];
        return renkler[Math.floor(Math.random() * renkler.length)];
    }

    function balonOlustur(kelimeObjesi) {
        const balon = document.createElement('div');
        balon.classList.add('balon');
        balon.classList.add(rastgeleRenkSinifi()); 
        balon.textContent = kelimeObjesi.ar;
        balon.dataset.arapca = kelimeObjesi.ar;
        balon.dataset.turkce = kelimeObjesi.tr;
        balon.dataset.patladi = 'false';

        balon.addEventListener('click', balonTiklandi);
        oyunAlani.appendChild(balon);
        aktifBalonlar.push(balon);
        return balon;
    }

    function oyunuBaslat() {
        sureSayac = 0; 
        guncelSureyiGoster(); 
        oyunAlani.innerHTML = '';
        gosterilenTurkceKelimeDiv.textContent = '';
        oyunSonuDiv.style.display = 'none';
        baslatButton.style.display = 'none';
        tekrarOynaButton.style.display = 'none';
        kayitMesajiParagraf.textContent = '';
        oyuncuAdiInput.value = '';
        aktifBalonlar = [];
        geriBildirimMesajlariDiv.classList.remove('goster'); 

        tumBalonlariOlustur();
        aktifKelimeyiSec();
        kronometreyiBaslat();
        sesTekrariniBaslat();
    }

    function tumBalonlariOlustur() {
        const karisikKelimeler = [...kelimeler].sort(() => Math.random() - 0.5);
        karisikKelimeler.forEach(kelime => {
            balonOlustur(kelime);
        });
    }

    function aktifKelimeyiSec() {
        const patlamamisBalonlar = aktifBalonlar.filter(b => b.dataset.patladi === 'false');
        if (patlamamisBalonlar.length > 0) {
            const randomIndex = Math.floor(Math.random() * patlamamisBalonlar.length);
            aktifKelime = kelimeler.find(k => k.ar === patlamamisBalonlar[randomIndex].dataset.arapca);
            gosterilenTurkceKelimeDiv.textContent = kelimeninIlkHarfiniBuyut(aktifKelime.tr);
            seslendir(aktifKelime.ses);
        } else {
            oyunBitti(); 
        }
    }

    function sesTekrariniBaslat() {
        if (sesTekrarleyici) {
            clearInterval(sesTekrarleyici);
        }
        sesTekrarleyici = setInterval(() => {
            if (aktifKelime && aktifBalonlar.filter(b => b.dataset.patladi === 'false').length > 0) {
                seslendir(aktifKelime.ses);
            } else {
                clearInterval(sesTekrarleyici);
            }
        }, 3000);
    }

    function guncelSureyiGoster() {
        const gosterilecekSure = Math.max(0, sureSayac); 
        const dakika = Math.floor(gosterilecekSure / 60).toString().padStart(2, '0');
        const saniye = (gosterilecekSure % 60).toString().padStart(2, '0');
        sureDiv.textContent = `Süre: ${dakika}:${saniye}`;
    }

    function geriBildirimGoster() {
        const randomIndex = Math.floor(Math.random() * motivasyonKelimeleri.length);
        geriBildirimMesajlariDiv.textContent = motivasyonKelimeleri[randomIndex];
        geriBildirimMesajlariDiv.classList.add('goster');

        geriBildirimMesajlariDiv.addEventListener('animationend', () => {
            geriBildirimMesajlariDiv.classList.remove('goster');
            geriBildirimMesajlariDiv.textContent = ''; 
        }, { once: true }); 
    }


    function balonTiklandi(event) {
        const tiklananBalon = event.target;

        if (tiklananBalon.dataset.patladi === 'true' || tiklananBalon.classList.contains('yanlis')) {
            return;
        }

        const arapcaKelime = tiklananBalon.dataset.arapca;

        if (arapcaKelime === aktifKelime.ar) {
            guncelSureyiGoster(); 
            geriBildirimGoster(); 

            tiklananBalon.classList.add('patladi');
            tiklananBalon.dataset.patladi = 'true';
            tiklananBalon.removeEventListener('click', balonTiklandi);

            clearInterval(sesTekrarleyici);
            speechSynthesis.cancel();
            gosterilenTurkceKelimeDiv.textContent = ''; 

            if (aktifBalonlar.filter(b => b.dataset.patladi === 'false').length === 0) {
                oyunBitti(); 
            } else {
                aktifKelimeyiSec();
                sesTekrariniBaslat();
            }
        } else {
            sureSayac += 5; 
            guncelSureyiGoster();

            tiklananBalon.classList.add('yanlis');
            setTimeout(() => {
                tiklananBalon.classList.remove('yanlis');
            }, 500);
        }
    }

    function kronometreyiBaslat() {
        kronometre = setInterval(() => {
            sureSayac++; 
            guncelSureyiGoster();
        }, 1000);
    }

    function kronometreyiDurdur() {
        clearInterval(kronometre);
    }

    function oyunBitti() {
        kronometreyiDurdur();
        clearInterval(sesTekrarleyici);
        speechSynthesis.cancel();
        oyunAlani.innerHTML = '';
        gosterilenTurkceKelimeDiv.textContent = '';
        oyunSonuDiv.style.display = 'block';
        
        const dakika = Math.floor(sureSayac / 60).toString().padStart(2, '0');
        const saniye = (sureSayac % 60).toString().padStart(2, '0');
        toplamSureSpan.textContent = `${dakika}:${saniye}`;

        baslatButton.style.display = 'none';
        tekrarOynaButton.style.display = 'inline-block';
    }

    kaydetButton.addEventListener('click', () => {
        const oyuncuAdi = oyuncuAdiInput.value.trim();
        if (oyuncuAdi) {
            const dakika = Math.floor(sureSayac / 60).toString().padStart(2, '0');
            const saniye = (sureSayac % 60).toString().padStart(2, '0');
            const oyunBilgisi = {
                ad: oyuncuAdi,
                gecenSure: `${dakika}:${saniye}`, 
                tarih: new Date().toLocaleString()
            };
            console.log("Kaydedilen Oyun Bilgisi:", oyunBilgisi);
            // Burada oyun bilgisini bir sunucuya veya tarayıcının LocalStorage'ına kaydedebilirsiniz.
            // let kayitlar = JSON.parse(localStorage.getItem('oyunSkorlari') || '[]');
            // kayitlar.push(oyunBilgisi);
            // localStorage.setItem('oyunSkorlari', JSON.stringify(kayitlar));

            kayitMesajiParagraf.textContent = "Bilgiler kaydedildi!";
            kayitMesajiParagraf.style.color = '#28a745';
        } else {
            kayitMesajiParagraf.textContent = "Lütfen adınızı girin.";
            kayitMesajiParagraf.style.color = '#dc3545';
        }
    });

    baslatButton.addEventListener('click', oyunuBaslat);
    tekrarOynaButton.addEventListener('click', oyunuBaslat);
});
