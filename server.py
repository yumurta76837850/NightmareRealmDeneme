import http.server
import socketserver
import json
import os
import re
import hashlib
import secrets
from urllib.parse import parse_qs

PORT = 3000
DB_PATH = 'db.json'

# Veritabanını oku
def read_db():
    if not os.path.exists(DB_PATH):
        with open(DB_PATH, 'w') as f:
            json.dump({'subscribers': [], 'messages': [], 'users': []}, f)
    
    with open(DB_PATH, 'r') as f:
        return json.load(f)

# Veritabanına yaz
def write_db(data):
    with open(DB_PATH, 'w') as f:
        json.dump(data, f, indent=2)

# Email formatını kontrol et
def is_valid_email(email):
    pattern = r'^[^\s@]+@[^\s@]+\.[^\s@]+$'
    return re.match(pattern, email) is not None

class RequestHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Statik dosyaları sunmak için mevcut işleyiciyi kullan
        return http.server.SimpleHTTPRequestHandler.do_GET(self)
    
    def do_POST(self):
        content_length = int(self.headers['Content-Length'])
        post_data = self.rfile.read(content_length).decode('utf-8')
        
        # API endpoint'lerine göre işlem yap
        if self.path == '/api/subscribe':
            self.handle_subscribe(post_data)
        elif self.path == '/api/contact':
            self.handle_contact(post_data)
        elif self.path == '/api/register':
            self.handle_register(post_data)
        elif self.path == '/api/login':
            self.handle_login(post_data)
        else:
            self.send_response(404)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'success': False, 'message': 'Endpoint bulunamadı'}).encode())
    
    def handle_subscribe(self, post_data):
        try:
            data = json.loads(post_data)
            email = data.get('email')
            
            if not email:
                self.send_error_response('Email adresi gerekli')
                return
            
            if not is_valid_email(email):
                self.send_error_response('Geçersiz email formatı')
                return
            
            db = read_db()
            
            # Email zaten kayıtlı mı kontrol et
            for subscriber in db['subscribers']:
                if isinstance(subscriber, dict) and subscriber.get('email') == email:
                    self.send_error_response('Bu email adresi zaten kayıtlı')
                    return
                elif subscriber == email:
                    self.send_error_response('Bu email adresi zaten kayıtlı')
                    return
            
            # Yeni abone ekle
            db['subscribers'].append({
                'id': str(len(db['subscribers']) + 1),
                'email': email,
                'date': 'now'  # Gerçek uygulamada datetime kullanılabilir
            })
            
            write_db(db)
            
            self.send_success_response('Bülten aboneliğiniz başarıyla oluşturuldu')
        except Exception as e:
            print(f"Abone olma hatası: {e}")
            self.send_error_response('Sunucu hatası')
    
    def handle_contact(self, post_data):
        try:
            data = json.loads(post_data)
            name = data.get('name')
            email = data.get('email')
            message = data.get('message')
            
            if not name or not email or not message:
                self.send_error_response('İsim, email ve mesaj alanları gerekli')
                return
            
            if not is_valid_email(email):
                self.send_error_response('Geçersiz email formatı')
                return
            
            db = read_db()
            
            # Yeni mesaj ekle
            db['messages'].append({
                'id': str(len(db['messages']) + 1),
                'name': name,
                'email': email,
                'message': message,
                'date': 'now',  # Gerçek uygulamada datetime kullanılabilir
                'read': False
            })
            
            write_db(db)
            
            self.send_success_response('Mesajınız başarıyla gönderildi')
        except Exception as e:
            print(f"Mesaj gönderme hatası: {e}")
            self.send_error_response('Sunucu hatası')
    
    def send_success_response(self, data):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        
        # Eğer data bir string ise, message olarak gönder
        if isinstance(data, str):
            response_data = {'success': True, 'message': data}
        else:
            # Eğer data bir dict ise, doğrudan kullan
            response_data = {'success': True, **data}
            
        self.wfile.write(json.dumps(response_data).encode())
    
    def send_error_response(self, message, status=400):
        self.send_response(status)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({'success': False, 'message': message}).encode())

    def handle_register(self, post_data):
        try:
            data = json.loads(post_data)
            username = data.get('username')
            email = data.get('email')
            password = data.get('password')
            
            if not username or not email or not password:
                self.send_error_response('Kullanıcı adı, email ve şifre alanları gerekli')
                return
            
            if not is_valid_email(email):
                self.send_error_response('Geçersiz email formatı')
                return
            
            if len(password) < 6:
                self.send_error_response('Şifre en az 6 karakter olmalıdır')
                return
            
            db = read_db()
            
            # Kullanıcı adı veya email zaten kayıtlı mı kontrol et
            for user in db['users']:
                if user.get('username') == username:
                    self.send_error_response('Bu kullanıcı adı zaten kullanılıyor')
                    return
                if user.get('email') == email:
                    self.send_error_response('Bu email adresi zaten kullanılıyor')
                    return
            
            # Şifreyi hashle
            salt = secrets.token_hex(16)
            hashed_password = hashlib.sha256((password + salt).encode()).hexdigest()
            
            # Yeni kullanıcı ekle
            db['users'].append({
                'id': str(len(db['users']) + 1),
                'username': username,
                'email': email,
                'password': hashed_password,
                'salt': salt,
                'date': 'now'  # Gerçek uygulamada datetime kullanılabilir
            })
            
            write_db(db)
            
            self.send_success_response('Kayıt işlemi başarıyla tamamlandı')
        except Exception as e:
            print(f"Kayıt olma hatası: {e}")
            self.send_error_response('Sunucu hatası')
    
    def handle_login(self, post_data):
        try:
            data = json.loads(post_data)
            username = data.get('username')
            password = data.get('password')
            
            if not username or not password:
                self.send_error_response('Kullanıcı adı ve şifre gerekli')
                return
            
            db = read_db()
            
            # Kullanıcıyı bul
            user = None
            for u in db['users']:
                if u.get('username') == username:
                    user = u
                    break
            
            if not user:
                self.send_error_response('Kullanıcı adı veya şifre hatalı')
                return
            
            # Şifreyi kontrol et
            salt = user.get('salt')
            hashed_password = hashlib.sha256((password + salt).encode()).hexdigest()
            
            if hashed_password != user.get('password'):
                self.send_error_response('Kullanıcı adı veya şifre hatalı')
                return
            
            # Giriş başarılı, token oluştur
            token = secrets.token_hex(32)
            
            self.send_success_response({
                'message': 'Giriş başarılı',
                'token': token,
                'username': user.get('username'),
                'id': user.get('id')
            })
        except Exception as e:
            print(f"Giriş yapma hatası: {e}")
            self.send_error_response('Sunucu hatası')

def run_server():
    with socketserver.TCPServer(("", PORT), RequestHandler) as httpd:
        print(f"Sunucu http://localhost:{PORT} adresinde çalışıyor")
        httpd.serve_forever()

if __name__ == "__main__":
    run_server()