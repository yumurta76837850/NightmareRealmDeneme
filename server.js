// Gerekli modülleri dahil ediyoruz.
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// SQLite veritabanı modülünü dahil ediyoruz.
// verbose() metodu, hata ayıklama (debugging) için konsola daha fazla detay yazdırır.
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = 3000;

// Log dosyası yolunu belirliyoruz. Bu kısım değişmedi.
const LOG_FILE = path.join(__dirname, 'logs', 'access_log.json');

const failedLoginAttempts = {};
const MAX_FAILED_ATTEMPTS = 5;

// SQLite veritabanı dosyasının yolu.
// Veritabanı dosyası otomatik olarak `data/` klasöründe oluşturulur.
const DB_PATH = path.join(__dirname, 'data', 'database.sqlite');
const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
        console.error('Veritabanı bağlantı hatası:', err.message);
    } else {
        console.log('Veritabanına başarılı şekilde bağlandı.');
        // Veritabanı bağlantısı kurulduktan sonra, kullanıcılar tablosunu oluşturuyoruz.
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            phone TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            isAdmin INTEGER DEFAULT 0
        )`, (err) => {
            if (err) {
                console.error('Kullanıcılar tablosu oluşturulurken hata:', err.message);
            } else {
                console.log('Kullanıcılar tablosu hazır.');
                // Admin kullanıcısını kontrol edip, yoksa oluşturuyoruz.
                checkAndCreateAdmin();
            }
        });
    }
});

// Admin kullanıcısını kontrol edip, yoksa veritabanına ekleme fonksiyonu
async function checkAndCreateAdmin() {
    const ADMIN_USERNAME = 'admin';
    const ADMIN_PASSWORD_HASH = '$2b$10$w8F3y4W2W0L1P5V4U6K8W2Q3N6P7R8T9Z0X1Y2C3B4E5D6F7G8H9J0K1L2M3N4O5P6'; // 'adminpass' hash'i
    const ADMIN_PHONE = '000-000-00-00';

    db.get('SELECT * FROM users WHERE username = ?', [ADMIN_USERNAME], async (err, row) => {
        if (err) {
            console.error('Admin kontrolü sırasında hata:', err.message);
            return;
        }
        if (!row) {
            // Admin kullanıcısı veritabanında yoksa, ekliyoruz.
            db.run(`INSERT INTO users (username, phone, password, isAdmin) VALUES (?, ?, ?, ?)`,
                [ADMIN_USERNAME, ADMIN_PHONE, ADMIN_PASSWORD_HASH, 1], (insertErr) => {
                    if (insertErr) {
                        console.error('Admin kullanıcısı eklenirken hata:', insertErr.message);
                    } else {
                        console.log('Admin kullanıcısı başarıyla eklendi.');
                    }
                });
        }
    });
}

// Güvenlik başlıklarını ve middleware'leri ayarlıyoruz. Bu kısım aynı kaldı.
app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://www.youtube.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
        imgSrc: ["'self'", "data:", "https://placehold.co"],
        connectSrc: ["'self'", "http://localhost:3000"],
        frameSrc: ["https://www.youtube.com"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'self'"],
        workerSrc: ["'self'"],
        upgradeInsecureRequests: [],
    },
}));
app.use(helmet.dnsPrefetchControl());
app.use(helmet.frameguard({ action: 'sameorigin' }));
app.use(helmet.hsts({
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
}));
app.use(helmet.ieNoOpen());
app.use(helmet.noSniff());
app.use(helmet.referrerPolicy({ policy: 'no-referrer' }));
app.use(helmet.xssFilter());

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

const JWT_SECRET = 'cok-gizli-ve-guvenli-bir-jwt-anahtari';

// JWT'yi doğrulamak için bir middleware fonksiyonu
function verifyToken(req, res, next) {
    const tokenHeader = req.headers['authorization'];
    if (!tokenHeader) {
        return res.status(403).json({ message: 'Erişim için token gerekli.' });
    }

    const token = tokenHeader.split(' ')[1];
    if (!token) {
        return res.status(403).json({ message: 'Geçersiz token formatı.' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            console.error('Token doğrulama hatası:', err);
            return res.status(401).json({ message: 'Geçersiz veya süresi dolmuş token.' });
        }
        req.user = decoded;
        next();
    });
}

// Log dosyasına JSON formatında yazma fonksiyonu
async function appendLog(logEntryObject) {
    const logDir = path.dirname(LOG_FILE);
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }

    let logs = [];
    try {
        if (fs.existsSync(LOG_FILE)) {
            const data = await fs.promises.readFile(LOG_FILE, 'utf8');
            if (data.trim()) {
                logs = JSON.parse(data);
                if (!Array.isArray(logs)) {
                    console.warn('Log dosyası geçerli bir JSON dizisi değil, sıfırlanıyor.');
                    logs = [];
                }
            }
        }
    } catch (error) {
        console.error('Log dosyası okunurken veya ayrıştırılırken hata oluştu, sıfırlanıyor:', error);
        logs = [];
    }

    const timestamp = new Date().toISOString();
    const newLogEntry = { timestamp, ...logEntryObject };
    logs.push(newLogEntry);

    try {
        await fs.promises.writeFile(LOG_FILE, JSON.stringify(logs, null, 2), 'utf8');
    } catch (error) {
        console.error('Log dosyasına yazılırken hata oluştu:', error);
    }
}

// Function to read logs from the log file (for API endpoint)
async function readLogs() {
    try {
        if (!fs.existsSync(LOG_FILE)) {
            const logDir = path.dirname(LOG_FILE);
            if (!fs.existsSync(logDir)) {
                fs.mkdirSync(logDir, { recursive: true });
            }
            await fs.promises.writeFile(LOG_FILE, '[]', 'utf8');
            console.log('log.json dosyası bulunamadı, boş olarak oluşturuldu.');
            return [];
        }
        const data = await fs.promises.readFile(LOG_FILE, 'utf8');
        if (!data.trim()) {
            console.warn('log.json dosyası boş, boş dizi olarak işleniyor.');
            return [];
        }
        const logs = JSON.parse(data);
        if (!Array.isArray(logs)) {
            console.error('log.json içeriği geçerli bir JSON dizisi değil. Dosya sıfırlanıyor.');
            await fs.promises.writeFile(LOG_FILE, '[]', 'utf8');
            return [];
        }
        return logs;
    } catch (error) {
        console.error('Loglar okunurken hata oluştu:', error);
        await fs.promises.writeFile(LOG_FILE, '[]', 'utf8');
        return [];
    }
}


// Kayıt API endpoint'i (SQLite versiyonu)
app.post('/api/register', async (req, res) => {
    const { username, phone, password } = req.body;
    const clientIp = req.ip;

    if (!username || !phone || !password) {
        appendLog({ type: 'KayıtBasarisiz', reason: 'EksikBilgi', ip: clientIp });
        return res.status(400).json({ message: 'Kullanıcı adı, telefon ve parola gerekli.' });
    }

    // `db.get` ile veritabanında kullanıcı olup olmadığını kontrol ediyoruz.
    // JSON dosyası okuma yerine tek bir sorgu yapıyoruz.
    db.get('SELECT * FROM users WHERE username = ? OR phone = ?', [username, phone], async (err, row) => {
        if (err) {
            console.error('Veritabanı sorgu hatası:', err.message);
            appendLog({ type: 'KayıtBasarisiz', reason: 'SunucuHatasi', ip: clientIp });
            return res.status(500).json({ message: 'Sunucu hatası.' });
        }

        if (row) {
            // Eğer bir kullanıcı bulunduysa, zaten kayıtlıdır.
            appendLog({ type: 'KayıtBasarisiz', reason: 'ZatenKayitli', username: username, ip: clientIp });
            return res.status(409).json({ message: 'Bu kullanıcı adı veya telefon numarası zaten kayıtlı.' });
        }

        try {
            const hashedPassword = await bcrypt.hash(password, 10);
            // `db.run` ile veritabanına yeni bir kullanıcı ekliyoruz.
            db.run(`INSERT INTO users (username, phone, password, isAdmin) VALUES (?, ?, ?, ?)`,
                [username, phone, hashedPassword, 0], (insertErr) => {
                    if (insertErr) {
                        console.error('Kayıt işlemi hatası (Veritabanı ekleme):', insertErr.message);
                        appendLog({ type: 'KayıtBasarisiz', reason: 'SunucuHatasi', ip: clientIp });
                        return res.status(500).json({ message: 'Sunucu hatası.' });
                    }

                    appendLog({ type: 'KayıtBasarili', username: username, ip: clientIp });
                    res.status(201).json({ message: 'Kayıt başarılı!' });
                });
        } catch (error) {
            console.error('Kayıt işlemi hatası (Hashing):', error);
            appendLog({ type: 'KayıtBasarisiz', reason: 'SunucuHatasi', ip: clientIp });
            res.status(500).json({ message: 'Sunucu hatası.' });
        }
    });
});

// Giriş API endpoint'i (SQLite versiyonu)
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const clientIp = req.ip;

    if (!username || !password) {
        appendLog({ type: 'GirisBasarisiz', reason: 'EksikBilgi', ip: clientIp });
        return res.status(400).json({ message: 'Kullanıcı adı ve parola gerekli.' });
    }

    // `db.get` ile kullanıcı adıyla eşleşen kaydı çekiyoruz.
    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
        if (err) {
            console.error('Veritabanı sorgu hatası:', err.message);
            appendLog({ type: 'GirisBasarisiz', reason: 'SunucuHatasi', ip: clientIp });
            return res.status(500).json({ message: 'Sunucu hatası.' });
        }

        if (!user) {
            if (!failedLoginAttempts[clientIp]) {
                failedLoginAttempts[clientIp] = { count: 0, lastAttempt: new Date() };
            }
            failedLoginAttempts[clientIp].count++;
            failedLoginAttempts[clientIp].lastAttempt = new Date();
            appendLog({ type: 'GirisBasarisiz', reason: 'GecersizBilgi', ip: clientIp, attempts: failedLoginAttempts[clientIp].count });
            return res.status(401).json({ message: 'Geçersiz kullanıcı adı veya parola.' });
        }

        try {
            const isMatch = await bcrypt.compare(password, user.password);

            if (isMatch) {
                appendLog({ type: 'GirisBasarili', username: username, ip: clientIp });
                if (failedLoginAttempts[clientIp]) {
                    failedLoginAttempts[clientIp].count = 0;
                }

                const token = jwt.sign(
                    { username: user.username, isAdmin: user.isAdmin },
                    JWT_SECRET,
                    { expiresIn: '1h' }
                );

                res.status(200).json({
                    message: 'Giriş başarılı!',
                    username: user.username,
                    isAdmin: user.isAdmin,
                    token: token
                });
            } else {
                if (!failedLoginAttempts[clientIp]) {
                    failedLoginAttempts[clientIp] = { count: 0, lastAttempt: new Date() };
                }
                failedLoginAttempts[clientIp].count++;
                failedLoginAttempts[clientIp].lastAttempt = new Date();

                if (failedLoginAttempts[clientIp].count > MAX_FAILED_ATTEMPTS) {
                    appendLog({ type: 'GirisBasarisiz', reason: 'LimitAsildi', ip: clientIp, attempts: failedLoginAttempts[clientIp].count });
                } else {
                    appendLog({ type: 'GirisBasarisiz', reason: 'GecersizBilgi', ip: clientIp, attempts: failedLoginAttempts[clientIp].count });
                }
                res.status(401).json({ message: 'Geçersiz kullanıcı adı veya parola.' });
            }
        } catch (error) {
            console.error('Giriş işlemi hatası (Hashing karşılaştırma):', error);
            appendLog({ type: 'GirisBasarisiz', reason: 'SunucuHatasi', ip: clientIp });
            res.status(500).json({ message: 'Sunucu hatası.' });
        }
    });
});

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD_HASH = '$2b$10$w8F3y4W2W0L1P5V4U6K8W2Q3N6P7R8T9Z0X1Y2C3B4E5D6F7G8H9J0K1L2M3N4O5P6';
const ADMIN_SECRET_KEY = 'supersecretadminkey';

// Admin Giriş API endpoint'i (SQLite versiyonu)
app.post('/api/admin-login', async (req, res) => {
    const { username, password, secretKey } = req.body;

    if (!username || !password || !secretKey) {
        return res.status(400).json({ message: 'Kullanıcı adı, parola ve gizli anahtar gerekli.' });
    }

    const isUsernameMatch = username === ADMIN_USERNAME;
    const isPasswordMatch = await bcrypt.compare(password, ADMIN_PASSWORD_HASH);
    const isSecretKeyMatch = secretKey === ADMIN_SECRET_KEY;

    if (isUsernameMatch && isPasswordMatch && isSecretKeyMatch) {
        // `db.get` ile admin kullanıcısını çekiyoruz.
        db.get('SELECT * FROM users WHERE username = ?', [ADMIN_USERNAME], async (err, adminUser) => {
            if (err) {
                console.error('Admin kontrolü sırasında hata:', err.message);
                return res.status(500).json({ message: 'Sunucu hatası.' });
            }

            if (!adminUser) {
                // Eğer admin kullanıcısı yoksa, oluşturuyoruz.
                db.run(`INSERT INTO users (username, phone, password, isAdmin) VALUES (?, ?, ?, ?)`,
                    [ADMIN_USERNAME, '000-000-00-00', ADMIN_PASSWORD_HASH, 1], (insertErr) => {
                        if (insertErr) {
                            console.error('Admin kullanıcısı eklenirken hata:', insertErr.message);
                            return res.status(500).json({ message: 'Sunucu hatası.' });
                        }
                    });
            } else if (!adminUser.isAdmin) {
                // Eğer admin kullanıcısı varsa ama yetkisi yoksa, güncelliyoruz.
                db.run('UPDATE users SET isAdmin = ? WHERE username = ?', [1, ADMIN_USERNAME], (updateErr) => {
                    if (updateErr) {
                        console.error('Admin yetkisi güncellenirken hata:', updateErr.message);
                        return res.status(500).json({ message: 'Sunucu hatası.' });
                    }
                });
            }

            const token = jwt.sign(
                { username: ADMIN_USERNAME, isAdmin: true },
                JWT_SECRET,
                { expiresIn: '2h' }
            );

            res.status(200).json({
                message: 'Admin girişi başarılı!',
                username: ADMIN_USERNAME,
                isAdmin: true,
                token: token
            });
        });
    } else {
        res.status(401).json({ message: 'Geçersiz admin bilgileri.' });
    }
});

// Koruma altındaki bir API endpoint'i
app.get('/api/protected-resource', verifyToken, (req, res) => {
    res.status(200).json({
        message: 'Bu korumalı bir kaynaktır. Erişime izniniz var!',
        user: req.user
    });
});

// Admin Kullanıcıları Listeleme API endpoint'i (SQLite versiyonu)
app.get('/api/admin-users', verifyToken, async (req, res) => {
    if (!req.user.isAdmin) {
        return res.status(403).json({ message: 'Erişim reddedildi. Bu kaynak için yönetici yetkisi gerekli.' });
    }

    // `db.all` ile tüm kullanıcıları çekiyoruz.
    db.all('SELECT username, phone, isAdmin FROM users', [], (err, rows) => {
        if (err) {
            console.error('Admin kullanıcılarını yüklerken hata oluştu:', err.message);
            return res.status(500).json({ message: 'Admin kullanıcıları yüklenemedi.' });
        }
        res.status(200).json(rows);
    });
});

// Kullanıcı İstatistikleri API endpoint'i (SQLite versiyonu)
app.get('/api/stats/users', verifyToken, async (req, res) => {
    if (!req.user.isAdmin) {
        return res.status(403).json({ message: 'Erişim reddedildi. Bu kaynak için yönetici yetkisi gerekli.' });
    }

    // `db.get` ve `COUNT(*)` ile kullanıcı sayısını çekiyoruz.
    db.get('SELECT COUNT(*) AS totalUsers FROM users', [], (err, row) => {
        if (err) {
            console.error('Kullanıcı istatistikleri alınırken hata:', err.message);
            return res.status(500).json({ message: 'Kullanıcı istatistikleri alınamadı.' });
        }
        res.status(200).json(row);
    });
});

// Erişim Günlükleri API endpoint'i
app.get('/api/stats/logs', verifyToken, async (req, res) => {
    if (!req.user.isAdmin) {
        return res.status(403).json({ message: 'Erişim reddedildi. Bu kaynak için yönetici yetkisi gerekli.' });
    }

    try {
        const logs = await readLogs();
        res.status(200).json(logs);
    } catch (error) {
        console.error('Erişim günlükleri alınırken hata:', error);
        res.status(500).json({ message: 'Erişim günlükleri alınamadı.' });
    }
});

// Temel HTML sayfalarını sunma
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/admin.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin.html'));
});

app.get('/bilgilendirme.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'bilgilendirme.html'));
});

// Sunucuyu başlat
app.listen(PORT, () => {
    console.log(`Backend sunucusu http://localhost:${PORT} adresinde çalışıyor...`);
    console.log(`Kullanıcı veritabanı dosyası: ${DB_PATH}`);
    console.log(`Erişim günlükleri dosyası: ${LOG_FILE}`);
});
