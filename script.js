document.addEventListener('DOMContentLoaded', function() {
    // Header kaydırma efekti
    const header = document.querySelector('header');
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('nav');
    
    // Sadece ana sayfada veya kimlik doğrulama sayfasında varsa çalıştır
    if (header && menuToggle && nav) {
        window.addEventListener('scroll', function() {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
        
        // Mobil menü açma/kapama
        menuToggle.addEventListener('click', function() {
            nav.classList.toggle('active');
            menuToggle.classList.toggle('active');
        });
        
        // Menü dışına tıklandığında mobil menüyü kapat
        document.addEventListener('click', function(event) {
            const isClickInsideNav = nav.contains(event.target);
            const isClickInsideToggle = menuToggle.contains(event.target);
            
            if (!isClickInsideNav && !isClickInsideToggle && nav.classList.contains('active')) {
                nav.classList.remove('active');
                menuToggle.classList.remove('active');
            }
        });
        
        // Çapa bağlantıları için yumuşak kaydırma (sadece index.html'de çalışsın)
        if (window.location.pathname === '/' || window.location.pathname === '/index.html') { // index.html için de kontrol eklendi
            document.querySelectorAll('a[href^="#"]').forEach(anchor => {
                anchor.addEventListener('click', function(e) {
                    e.preventDefault();
                    
                    // Mobil menüyü kapat (açıksa)
                    if (nav.classList.contains('active')) {
                        nav.classList.remove('active');
                        menuToggle.classList.remove('active');
                    }
                    
                    const targetId = this.getAttribute('href');
                    const targetElement = document.querySelector(targetId);
                    
                    if (targetElement) {
                        // Header yüksekliğini hesaba kat
                        const headerHeight = header.offsetHeight; 
                        window.scrollTo({
                            top: targetElement.offsetTop - headerHeight - 10, // Biraz boşluk bırak
                            behavior: 'smooth'
                        });
                    }
                });
            });
        }
    }

    // Ses efektlerini merkezi olarak yönetmek için yeni bir obje
    const soundManager = {
        sounds: {},
        init: function() {
            // Ses dosyalarını yükle
            this.sounds.hover = new Audio('sounds/button-hover-short.mp3'); 
            this.sounds.click = new Audio('sounds/button-click-ominous.mp3'); 
            this.sounds.glitch = new Audio('sounds/static-glitch.mp3'); 
            this.sounds.ambience = new Audio('sounds/dark-ambience-loop.mp3'); 
            this.sounds.jumpScare = new Audio('sounds/jumpscare.mp3'); 
            
            // Ses seviyelerini ayarla
            this.sounds.hover.volume = 0.1;
            this.sounds.click.volume = 0.3;
            this.sounds.glitch.volume = 0.4;
            this.sounds.ambience.volume = 0.05; 
            this.sounds.jumpScare.volume = 0.8;
            
            this.sounds.ambience.loop = true; // Ortam sesini döngüye al

            // Tarayıcı otomatik ses çalmayı engellediği için ilk kullanıcı etkileşimi beklenir
            document.body.addEventListener('click', () => {
                if (this.sounds.ambience.paused) {
                    this.sounds.ambience.play().catch(e => console.log("Ambience play failed:", e));
                }
            }, { once: true }); // Sadece bir kere tetiklensin
        },
        play: function(soundName) {
            if (this.sounds[soundName]) {
                this.sounds[soundName].currentTime = 0; // Her çaldığında baştan başla
                this.sounds[soundName].play().catch(e => console.log(`Sound ${soundName} play failed:`, e));
            }
        }
    };

    soundManager.init(); // Ses yöneticisini başlat

    // Buton hover ve click seslerini entegre et
    document.querySelectorAll('.btn, .platform-btn, nav ul li a').forEach(el => { 
        el.addEventListener('mouseenter', function() {
            soundManager.play('hover');
        });
        el.addEventListener('click', function() {
            soundManager.play('click');
        });
    });

    // Rastgele titreşim efekti (sadece index.html'de çalışsın)
    function randomFlicker() {
        const elements = document.querySelectorAll('.feature-icon, .section-title, .logo h1, .hero h2'); 
        if (elements.length === 0) return;

        const randomElement = elements[Math.floor(Math.random() * elements.length)];
        
        randomElement.classList.add('flicker-glitch');
        soundManager.play('glitch'); 

        setTimeout(() => {
            randomElement.classList.remove('flicker-glitch');
        }, 150);
        
        // Belirli aralıklarla nadir bir jumpscare sesi
        if (Math.random() < 0.05) { 
            soundManager.play('jumpScare');
            // Jumpscare ile birlikte kısa bir ekran flash'ı
            const flash = document.createElement('div');
            flash.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(255, 255, 255, 0.5);
                z-index: 10000;
                opacity: 1;
                transition: opacity 0.1s ease-out;
            `;
            document.body.appendChild(flash);
            setTimeout(() => {
                flash.style.opacity = 0;
                setTimeout(() => flash.remove(), 200);
            }, 100);
        }

        setTimeout(randomFlicker, Math.random() * 8000 + 4000); // Daha dinamik aralık (4-12 saniye)
    }
    
    if (window.location.pathname === '/' || window.location.pathname === '/index.html') { 
        setTimeout(randomFlicker, 3000); 
    }


    // Video için oynat butonu efekti (sadece index.html'de çalışsın)
    const videoPlaceholder = document.querySelector('.video-placeholder');
    const playButton = document.querySelector('.play-button');

    if (playButton && videoPlaceholder && (window.location.pathname === '/' || window.location.pathname === '/index.html')) { 
        playButton.addEventListener('click', function() {
            const youtubeVideoId = 'dQw4w9WgXcQ'; 

            videoPlaceholder.innerHTML = `
                <iframe src="https://www.youtube.com/embed/${youtubeVideoId}?autoplay=1&rel=0" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen>
                </iframe>
            `;
            videoPlaceholder.style.position = 'relative'; 
            videoPlaceholder.style.paddingBottom = '56.25%'; 
            videoPlaceholder.style.height = '0';
            videoPlaceholder.style.overflow = 'hidden';

            const iframe = videoPlaceholder.querySelector('iframe');
            iframe.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
            `;
        });
    }
    
    // Bülten formu gönderme (sadece index.html'de çalışsın)
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm && (window.location.pathname === '/' || window.location.pathname === '/index.html')) { 
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const emailInput = this.querySelector('input[type="email"]');
            const email = emailInput.value.trim();
            
            if (email) {
                emailInput.value = '';
                alert('Bültenimize abone olduğunuz için teşekkürler!');
            }
        });
    }
    
    // Korku atmosferi için imleç efekti
    const cursorEffect = document.querySelector('.cursor-effect'); 
    if (!cursorEffect) { // Eğer HTML'de yoksa, oluştur
        const newCursorEffect = document.createElement('div');
        newCursorEffect.className = 'cursor-effect';
        document.body.appendChild(newCursorEffect);
        document.addEventListener('mousemove', function(e) {
            newCursorEffect.style.left = e.clientX + 'px';
            newCursorEffect.style.top = e.clientY + 'px';
        });
    } else { // Varsa, sadece hareketini takip et
        document.addEventListener('mousemove', function(e) {
            cursorEffect.style.left = e.clientX + 'px';
            cursorEffect.style.top = e.clientY + 'px';
        });
    }

    
    // Kahraman bölümü için parallax efekti (sadece index.html'de çalışsın)
    const hero = document.querySelector('.hero');
    if (hero && (window.location.pathname === '/' || window.location.pathname === '/index.html')) {
        window.addEventListener('scroll', function() {
            const scrollPosition = window.scrollY;
            hero.style.backgroundPositionY = scrollPosition * 0.5 + 'px';
        });
    }
    
    // Kaydırma ile ortaya çıkma animasyonları
    function revealOnScroll() {
        // auth-card ve admin-container'ı da dahil et
        const elements = document.querySelectorAll('.feature-card, .about-image, .gallery-item, .video-container, .system-requirements, .platform-btn, .auth-card, .admin-container'); 
        
        elements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const elementVisible = 150; 
            
            if (elementTop < window.innerHeight - elementVisible) {
                element.classList.add('revealed');
            } else {
                element.classList.remove('revealed'); 
            }
        });
    }
    
    window.addEventListener('scroll', revealOnScroll);
    revealOnScroll(); // Sayfa yüklendiğinde ilk kontrol
    
    // Kahraman metnine yazma efekti ekle (sadece index.html'de çalışsın)
    const heroText = document.querySelector('.hero p');
    if (heroText && (window.location.pathname === '/' || window.location.pathname === '/index.html')) { 
        const originalText = heroText.textContent;
        heroText.textContent = ''; 
        heroText.style.borderRight = '2px solid var(--primary-color)'; 
        heroText.style.paddingRight = '5px';
        heroText.style.whiteSpace = 'nowrap';
        heroText.style.overflow = 'hidden';
        heroText.style.width = '0'; 
        heroText.style.display = 'inline-block'; 

        let charIndex = 0;
        const typeSpeed = 70; 
        const eraseSpeed = 30; 
        const pauseBeforeErase = 1000; 
        const pauseBeforeType = 500; 

        function typeWithErrors() {
            let currentText = '';
            let i = 0;

            function addChar() {
                if (i < originalText.length) {
                    currentText += originalText.charAt(i);
                    heroText.textContent = currentText;
                    heroText.style.width = 'auto'; 
                    i++;
                    const delay = Math.random() * (typeSpeed + 30) + (typeSpeed - 30); 
                    setTimeout(addChar, delay);
                } else {
                    setTimeout(() => {
                        if (Math.random() < 0.2) { 
                            eraseRandomChars();
                        } else {
                            heroText.style.borderRight = 'none'; 
                        }
                    }, pauseBeforeErase);
                }
            }

            function eraseRandomChars() {
                const charsToErase = Math.floor(Math.random() * 5) + 2;
                let erasedCount = 0;

                function eraseChar() {
                    if (erasedCount < charsToErase && currentText.length > 0) {
                        currentText = currentText.slice(0, -1);
                        heroText.textContent = currentText;
                        erasedCount++;
                        setTimeout(eraseChar, eraseSpeed);
                    } else {
                        i = currentText.length; 
                        setTimeout(addChar, pauseBeforeType); 
                    }
                }
                eraseChar();
            }
            addChar(); 
        }
        
        setTimeout(typeWithErrors, 1000); 
    }
    
    // Dinamik başlık glitch efekti (sadece index.html'de çalışsın)
    const headerTitle = document.querySelector('.logo h1');
    if (headerTitle && (window.location.pathname === '/' || window.location.pathname === '/index.html')) { 
        headerTitle.setAttribute('data-text', headerTitle.textContent);

        setInterval(() => {
            if (Math.random() < 0.3) { 
                headerTitle.classList.add('glitch');
                setTimeout(() => {
                    headerTitle.classList.remove('glitch');
                }, 500);
            }
        }, 5000);
    }

    // --- Kayıt ve Giriş Formları İşlevselliği (auth.html için) ---
    const registerCard = document.getElementById('registerCard');
    const loginCard = document.getElementById('loginCard');
    const showLoginLink = document.getElementById('showLogin');
    const showRegisterLink = document.getElementById('showRegister');

    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');
    const registerMessage = document.getElementById('registerMessage');
    const loginMessage = document.getElementById('loginMessage');

    const API_BASE_URL = 'http://localhost:3000/api'; 

    if (showLoginLink && showRegisterLink) {
        showLoginLink.addEventListener('click', function(e) {
            e.preventDefault();
            registerCard.classList.add('hidden');
            loginCard.classList.remove('hidden');
            loginMessage.textContent = '';
            loginForm.reset();
        });

        showRegisterLink.addEventListener('click', function(e) {
            e.preventDefault();
            loginCard.classList.add('hidden');
            registerCard.classList.remove('hidden');
            registerMessage.textContent = '';
            registerForm.reset();
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const username = document.getElementById('regUsername').value;
            const phone = document.getElementById('regPhone').value;
            const password = document.getElementById('regPassword').value;

            try {
                const response = await fetch(`${API_BASE_URL}/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, phone, password })
                });

                const data = await response.json();

                if (response.ok) {
                    registerMessage.textContent = data.message;
                    registerMessage.className = 'auth-message success';
                    registerForm.reset();
                    soundManager.play('click');
                    setTimeout(() => {
                        registerCard.classList.add('hidden');
                        loginCard.classList.remove('hidden');
                        loginMessage.textContent = 'Kaydınız başarılı! Şimdi giriş yapabilirsiniz.';
                        loginMessage.className = 'auth-message success';
                    }, 1500);
                } else {
                    registerMessage.textContent = data.message || 'Kayıt başarısız oldu.';
                    registerMessage.className = 'auth-message error';
                    soundManager.play('glitch');
                }
            } catch (error) {
                console.error('Kayıt hatası:', error);
                registerMessage.textContent = 'Sunucuya bağlanılamadı. Lütfen tekrar deneyin.';
                registerMessage.className = 'auth-message error';
                soundManager.play('glitch');
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;
            const adminKey = document.getElementById('loginAdminKey') ? document.getElementById('loginAdminKey').value : ''; 

            let endpoint = `${API_BASE_URL}/login`; 
            let body = { username, password };
            let redirectTo = '/'; // Varsayılan yönlendirme ana sayfa

            if (adminKey) {
                endpoint = `${API_BASE_URL}/admin-login`; 
                body.secretKey = adminKey; 
                redirectTo = '/admin.html'; // Admin ise admin.html'e yönlendir
            }

            try {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(body)
                });

                const data = await response.json();

                if (response.ok) {
                    loginMessage.textContent = data.message + ` Hoş geldin, ${data.username}!`;
                    loginMessage.className = 'auth-message success';
                    loginForm.reset();
                    soundManager.play('click');
                    
                    // Kullanıcının admin olup olmadığını veya başarılı giriş yaptığını localStorage'a kaydet
                    if (data.isAdmin) {
                        localStorage.setItem('isAdminLoggedIn', 'true');
                    } else {
                        localStorage.removeItem('isAdminLoggedIn');
                    }
                    localStorage.setItem('loggedInUsername', data.username); // Kullanıcı adını kaydet

                    setTimeout(() => {
                         window.location.href = redirectTo; // Dinamik olarak yönlendir
                    }, 1500);
                } else {
                    loginMessage.textContent = data.message || 'Giriş başarısız oldu.';
                    loginMessage.className = 'auth-message error';
                    soundManager.play('glitch');
                }
            } catch (error) {
                console.error('Giriş hatası:', error);
                loginMessage.textContent = 'Sunucuya bağlanılamadı. Lütfen tekrar deneyin.';
                loginMessage.className = 'auth-message error';
                soundManager.play('glitch');
            }
        });
    }

    // --- Admin Paneli Kısayolu (Konsol Komutu) ---
    window.enterAdminPanel = function() {
        console.warn("Yönetici paneline yönlendiriliyorsunuz. Bu özellik sadece geliştirme amaçlıdır.");
        window.location.href = '/admin_panel.html';
    };
});
