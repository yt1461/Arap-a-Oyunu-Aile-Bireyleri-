document.addEventListener('DOMContentLoaded', () => {
    const gameContainer = document.getElementById('game-container');
    const scoreDisplay = document.getElementById('score-display');
    const timerDisplay = document.getElementById('timer-display'); // HTML'den yakalıyoruz
    const startButton = document.getElementById('startButton');

    let score = 0;
    let gameInterval; // Balon oluşturma aralığı
    let speechInterval; // Ses tekrar aralığı
    let gameTimer; // Oyun süresi için interval
    let timeLeft = 180; // Başlangıç süresi: 180 saniye
    let currentVoice = null; // Şu an konuşan sesi tutarız
    let currentTargetWord = null; // Şu an hedeflenen Türkçe kelime
    let gameStarted = false; // Oyunun başlayıp başlamadığını takip et

    // Arapça kelimeler ve Türkçe karşılıkları
    const words = [
        { arabic: 'أُمّ', turkish: 'anne' },
        { arabic: 'أَب', turkish: 'baba' },
        { arabic: 'جَدّ', turkish: 'dede' },
	{ arabic: 'أُخْت', turkish: 'kız kardeş' },
        { arabic: 'أَخ', turkish: 'erkek kardeş' },
        { arabic: 'عَمّة', turkish: 'hala' },
        { arabic: 'عَمّ', turkish: 'amca' },
        { arabic: 'خَال', turkish: 'dayı' },
        { arabic: 'خَالَة', turkish: 'teyze' },
        { arabic: 'جَدّة', turkish: 'nine' },
        { arabic: 'عَائِلَة', turkish: 'aile' }
    ];

    // Güncellenmiş balon renkleri (kırmızı çıkarıldı)
    const balloonColors = ['color2', 'color3', 'color4', 'color5']; // color1 artık yok

    // Sesli okuma fonksiyonu
    function speakWord(word, lang = 'tr-TR') {
        if (!gameStarted) return; // Oyun başlamadıysa seslendirme yapma

        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(word);
            utterance.lang = lang; // Dil Türkçe (tr-TR)
            utterance.rate = 0.8; // Seslendirme hızını yavaşlat (0.1 en yavaş, 1 normal)

            if (currentVoice) {
                speechSynthesis.cancel();
            }

            speechSynthesis.speak(utterance);
            currentVoice = utterance;

            utterance.onerror = (event) => {
                console.error('SpeechSynthesisUtterance.onerror', event);
                currentVoice = null;
            };
        } else {
            alert('Tarayıcınız metin okuma özelliğini desteklemiyor!');
        }
    }

    // Rastgele bir kelime seçer ve balonu oluşturur
    function createBalloon() {
        if (!gameStarted) return; // Oyun başlamadıysa balon oluşturma

        const randomIndex = Math.floor(Math.random() * words.length);
        const selectedWord = words[randomIndex];

        const balloon = document.createElement('div');
        balloon.classList.add('balloon');
        balloon.textContent = selectedWord.arabic; // Balonun üzerine Arapça kelimeyi yaz
        balloon.dataset.turkish = selectedWord.turkish; // Türkçe karşılığını data özelliği olarak sakla

        // Rastgele bir renk ata
        const randomColorIndex = Math.floor(Math.random() * balloonColors.length);
        balloon.classList.add(balloonColors[randomColorIndex]); // Direkt renk sınıfını ata

        // Rastgele yatay konum
        const startX = Math.random() * (gameContainer.clientWidth - 150);
        balloon.style.left = `${startX}px`;

        // Rastgele animasyon süresi (10 ile 20 saniye arası)
        const duration = 10 + Math.random() * 10;
        balloon.style.setProperty('--duration', `${duration}s`);

        gameContainer.appendChild(balloon);

        balloon.addEventListener('click', () => {
            handleBalloonClick(balloon);
        });

        // Balon ekranın dışına çıktığında kaldırmak için
        balloon.addEventListener('animationend', () => {
            if (balloon.parentNode === gameContainer) {
                gameContainer.removeChild(balloon);
            }
        });

        return balloon;
    }

    // Balona tıklandığında yapılacaklar
    function handleBalloonClick(clickedBalloon) {
        if (!gameStarted) return; // Oyun başlamadıysa tıklamayı işleme

        // Şu an konuşan sesi durdur ve tekrar etme döngüsünü temizle
        if (currentVoice) {
            speechSynthesis.cancel();
            currentVoice = null;
        }
        clearInterval(speechInterval); // Tekrar döngüsünü durdur

        const clickedTurkishWord = clickedBalloon.dataset.turkish;

        if (currentTargetWord && currentTargetWord === clickedTurkishWord) {
            score += 10;
            scoreDisplay.textContent = `Puan: ${score}`;
            clickedBalloon.style.backgroundColor = 'green';
            clickedBalloon.style.transform = 'scale(1.1)';
            setTimeout(() => {
                if (clickedBalloon.parentNode === gameContainer) {
                    clickedBalloon.remove();
                }
            }, 200);
            playCorrectSound();
        } else {
            score = Math.max(0, score - 5);
            scoreDisplay.textContent = `Puan: ${score}`;
            clickedBalloon.style.backgroundColor = 'red';
            clickedBalloon.style.transform = 'scale(0.9)';
            setTimeout(() => {
                if (clickedBalloon.parentNode === gameContainer) {
                    clickedBalloon.remove();
                }
            }, 200);
            playWrongSound();
        }
        setTimeout(askNewWord, 700);
    }

    // Oyun başlatma fonksiyonu
    function startGame() {
        gameStarted = true; // Oyunu başlattık
        startButton.style.display = 'none';
        score = 0;
        timeLeft = 60; // Süreyi sıfırla
        scoreDisplay.textContent = `Puan: ${score}`;
        timerDisplay.textContent = `Süre: ${timeLeft}s`; // Zamanı göster

        // Mevcut tüm balonları temizle
        document.querySelectorAll('.balloon').forEach(b => b.remove());

        // Balon oluşturma aralığını başlat
        gameInterval = setInterval(() => {
            createBalloon();
            if (Math.random() < 0.3) {
                 createBalloon();
            }
        }, 2000);

        askNewWord(); // Oyuna başlarken ilk kelimeyi sor

        // Zamanlayıcıyı başlat
        gameTimer = setInterval(() => {
            timeLeft--;
            timerDisplay.textContent = `Süre: ${timeLeft}s`;
            if (timeLeft <= 0) {
                endGame();
            }
        }, 1000); // Her 1 saniyede bir azalt
    }

    // Yeni bir kelime soran fonksiyon
    function askNewWord() {
        if (!gameStarted) return; // Oyun başlamadıysa kelime sorma

        clearInterval(speechInterval);

        const randomIndex = Math.floor(Math.random() * words.length);
        const selectedWord = words[randomIndex];
        currentTargetWord = selectedWord.turkish;

        speakWord(selectedWord.turkish);

        speechInterval = setInterval(() => {
            speakWord(selectedWord.turkish);
        }, 3000); // Her 3 saniyede bir tekrar et
    }

    // Ses efektleri (kendi correct.mp3 ve wrong.mp3 dosyalarınızı aynı klasöre eklemeyi unutmayın)
    function playCorrectSound() {
        const audio = new Audio('correct.mp3');
        audio.play().catch(e => console.error("Correct sound playback failed:", e));
    }

    function playWrongSound() {
        const audio = new Audio('wrong.mp3');
        audio.play().catch(e => console.error("Wrong sound playback failed:", e));
    }

    // Başlat butonuna tıklama olayı
    startButton.addEventListener('click', startGame);

    // Oyun durdurma fonksiyonu
    function endGame() {
        gameStarted = false; // Oyunu durdur
        clearInterval(gameInterval); // Balon oluşturmayı durdur
        clearInterval(speechInterval); // Ses tekrarını durdur
        clearInterval(gameTimer); // Zamanlayıcıyı durdur
        if (currentVoice) {
            speechSynthesis.cancel(); // Konuşmayı durdur
            currentVoice = null;
        }

        alert(`Süre doldu! Oyun Bitti! Puanınız: ${score}`); // Oyun bitiş mesajı ve puan
        startButton.textContent = 'Tekrar Oyna';
        startButton.style.display = 'block'; // Butonu tekrar göster
        // Tüm balonları temizle
        document.querySelectorAll('.balloon').forEach(b => b.remove());
    }
});
