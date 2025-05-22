document.addEventListener('DOMContentLoaded', () => {
    const gameContainer = document.getElementById('game-container');
    const scoreDisplay = document.getElementById('score-display');
    const timerDisplay = document.getElementById('timer-display');
    const startButton = document.getElementById('startButton');

    // Modal değişkenlerini artık burada tanımlamayacağız, endGame içinde oluşturacağız.

    let score = 0;
    let gameInterval;
    let speechInterval;
    let gameTimer;
    let timeLeft = 180; // Başlangıç süresi: 180 saniye (3 dakika)
    let currentVoice = null;
    let currentTargetWord = null;
    let gameStarted = false;

    // Arapça kelimeler ve Türkçe karşılıkları (Sadece senin istediğin kelimeler)
    const words = [
        { arabic: 'أُمّ', turkish: 'anne' },
        { arabic: 'أَب', turkish: 'baba' },
        { arabic: 'جَدّ', turkish: 'dede' },
        { arabic: 'بِنْت', turkish: 'kız çocuk' },
        { arabic: 'وَلَد', turkish: 'erkek çocuk' },
        { arabic: 'أُخْت', turkish: 'kız kardeş' },
        { arabic: 'أَخ', turkish: 'erkek kardeş' },
        { arabic: 'عَمّة', turkish: 'hala' },
        { arabic: 'عَمّ', turkish: 'amca' },
        { arabic: 'خَال', turkish: 'dayı' },
        { arabic: 'خَالَة', turkish: 'teyze' },
        { arabic: 'جَدّة', turkish: 'nine' },
        { arabic: 'عَائِلَة', turkish: 'aile' }
    ];

    // Balon renkleri (kırmızı hariç)
    const balloonColors = ['color2', 'color3', 'color4', 'color5'];

    function speakWord(word, lang = 'tr-TR') {
        if (!gameStarted) return;

        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(word);
            utterance.lang = lang;
            utterance.rate = 0.8;

            if (currentVoice) {
                speechSynthesis.cancel();
            }

            speechSynthesis.speak(utterance);
            currentVoice = utterance;

            utterance.onerror = (event) => {
                console.error('SpeechSynthesisUtterance.onerror', event);
                currentVoice = null;
            };
        }
    }

    function createBalloon() {
        if (!gameStarted) return;

        const randomIndex = Math.floor(Math.random() * words.length);
        const selectedWord = words[randomIndex];

        const balloon = document.createElement('div');
        balloon.classList.add('balloon');
        balloon.textContent = selectedWord.arabic;
        balloon.dataset.turkish = selectedWord.turkish;

        const randomColorIndex = Math.floor(Math.random() * balloonColors.length);
        balloon.classList.add(balloonColors[randomColorIndex]);

        const startX = Math.random() * (gameContainer.clientWidth - 150);
        balloon.style.left = `${startX}px`;

        const duration = 10 + Math.random() * 10;
        balloon.style.setProperty('--duration', `${duration}s`);

        gameContainer.appendChild(balloon);

        balloon.addEventListener('click', () => {
            handleBalloonClick(balloon);
        });

        balloon.addEventListener('animationend', () => {
            if (balloon.parentNode === gameContainer) {
                gameContainer.removeChild(balloon);
            }
        });

        return balloon;
    }

    function handleBalloonClick(clickedBalloon) {
        if (!gameStarted) return;

        if (currentVoice) {
            speechSynthesis.cancel();
            currentVoice = null;
        }
        clearInterval(speechInterval);

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

    function startGame() {
        gameStarted = true;
        startButton.style.display = 'none';
        score = 0;
        timeLeft = 180;
        scoreDisplay.textContent = `Puan: ${score}`;
        timerDisplay.textContent = `Süre: ${timeLeft}s`;

        // Oyun başladığında varsa önceki modalı temizle
        const existingModal = document.getElementById('gameOverModal');
        if (existingModal) {
            existingModal.remove();
        }

        document.querySelectorAll('.balloon').forEach(b => b.remove());

        gameInterval = setInterval(() => {
            createBalloon();
            if (Math.random() < 0.3) {
                 createBalloon();
            }
        }, 2000);

        askNewWord();

        gameTimer = setInterval(() => {
            timeLeft--;
            timerDisplay.textContent = `Süre: ${timeLeft}s`;
            if (timeLeft <= 0) {
                endGame();
            }
        }, 1000);
    }

    function askNewWord() {
        if (!gameStarted) return;

        clearInterval(speechInterval);

        const randomIndex = Math.floor(Math.random() * words.length);
        const selectedWord = words[randomIndex];
        currentTargetWord = selectedWord.turkish;

        speakWord(selectedWord.turkish);

        speechInterval = setInterval(() => {
            speakWord(selectedWord.turkish);
        }, 3000);
    }

    function playCorrectSound() {
        const audio = new Audio('correct.mp3');
        audio.play().catch(e => console.error("Correct sound playback failed:", e));
    }

    function playWrongSound() {
        const audio = new Audio('wrong.mp3');
        audio.play().catch(e => console.error("Wrong sound playback failed:", e));
    }

    startButton.addEventListener('click', startGame);

    // Oyun durdurma fonksiyonu - MODALI DİNAMİK OLARAK OLUŞTURUYORUZ
    function endGame() {
        gameStarted = false;
        clearInterval(gameInterval);
        clearInterval(speechInterval);
        clearInterval(gameTimer);
        if (currentVoice) {
            speechSynthesis.cancel();
            currentVoice = null;
        }

        document.querySelectorAll('.balloon').forEach(b => b.remove());

        // --- MODALI DİNAMİK OLARAK OLUŞTURMA ---
        const gameOverModal = document.createElement('div');
        gameOverModal.id = 'gameOverModal';
        gameOverModal.classList.add('modal');
        gameOverModal.innerHTML = `
            <div class="modal-content">
                <span class="close-button">&times;</span>
                <h2>Oyun Bitti!</h2>
                <p id="finalScore"></p>
                <label for="playerName">Adınız Soyadınız:</label>
                <input type="text" id="playerName" placeholder="Adınızı ve soyadınızı girin">
                <button id="saveScoreButton">Skoru Kaydet</button>
            </div>
        `;
        gameContainer.appendChild(gameOverModal); // Modalı game-container içine ekle

        // Modal elementlerini tekrar yakala (çünkü yeni oluşturdun)
        const finalScoreDisplay = gameOverModal.querySelector('#finalScore');
        const playerNameInput = gameOverModal.querySelector('#playerName');
        const saveScoreButton = gameOverModal.querySelector('#saveScoreButton');
        const closeButton = gameOverModal.querySelector('.close-button');


        finalScoreDisplay.textContent = `Puanınız: ${score}`;
        gameOverModal.style.display = 'flex'; // Modalı görünür yap
        playerNameInput.value = ''; // Giriş kutusunu temizle

        // Modal Kapatma Butonu
        closeButton.addEventListener('click', () => {
            gameOverModal.style.display = 'none'; // Modalı gizle
            gameOverModal.remove(); // Modalı HTML'den tamamen kaldır
            startButton.textContent = 'Tekrar Oyna';
            startButton.style.display = 'block';
        });

        // Skoru Kaydet Butonu
        saveScoreButton.addEventListener('click', () => {
            const playerName = playerNameInput.value.trim();
            if (playerName) {
                console.log(`Oyuncu: ${playerName}, Skor: ${score}`);
                alert(`${playerName}, skorunuz ${score} kaydedildi!`);
                gameOverModal.style.display = 'none';
                gameOverModal.remove(); // Modalı HTML'den tamamen kaldır
                startButton.textContent = 'Tekrar Oyna';
                startButton.style.display = 'block';
            } else {
                alert('Lütfen adınızı ve soyadınızı girin.');
            }
        });

        // Pencereye tıklama (modal dışında bir yere tıklama) ile modalı kapatma (isteğe bağlı)
        window.addEventListener('click', (event) => {
            if (event.target == gameOverModal) {
                gameOverModal.style.display = 'none';
                gameOverModal.remove(); // Modalı HTML'den tamamen kaldır
                startButton.textContent = 'Tekrar Oyna';
                startButton.style.display = 'block';
            }
        });
    }
});
