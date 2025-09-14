#include "httplib.h" // httplib kütüphanesini dahil et
#include <iostream>  // Konsol giriş/çıkış için
#include <string>    // string sınıfı için
#include <json/json.h> // JSON işlemleri için (JSONCPP kütüphanesi)
// Visual Studio Code'da vcpkg ile JsonCpp kurduysanız, #include <json/json.h> genellikle yeterlidir.
// Eğer hala hata alıyorsanız, derleyici yol ayarlarınızı kontrol edin veya duruma göre sadece <json.h> deneyin.
#include <vector>    // vector için
#include <algorithm> // std::transform, std::tolower için
#include <ctime>     // time, localtime, strftime için (saat bilgisini almak için)

// Basit bir chatbot yanıt fonksiyonu
std::string getBotResponse(const std::string& userMessage) {
    std::string lowerCaseMessage = userMessage;
    // Mesajı küçük harfe çevir
    std::transform(lowerCaseMessage.begin(), lowerCaseMessage.end(), lowerCaseMessage.begin(),
                   [](unsigned char c){ return std::tolower(c); });

    // Mevcut bot yanıt mantığı
    if (lowerCaseMessage.find("benim sana sorabileceğim tüm komutlar") != std::string::npos ||
        lowerCaseMessage.find("tüm komutları listele") != std::string::npos ||
        lowerCaseMessage.find("ne sorabilirim") != std::string::npos)
    {
        return R"(Elbette, işte sana sorabileceğim bazı komutlar:
1. Nasılsın? / Naber?
2. Oyun hakkında bilgi / Oyun nedir?
3. Nasıl indirilir? / İndir
4. Hikaye / Konu
5. Özellikler
6. Saat kaç? / Zaman
7. Teşekkürler / Sağ ol
8. Merhaba / Selam
9. Korkunç
10. Sistem gereksinimleri / Minimum özellikler
11. Çıkış tarihi / Ne zaman çıkacak?
12. Ana karakter / Kiminle oynuyoruz?
13. Kaç sonu var? / Oyunun sonu?
14. Zorluk seviyesi / Nasıl zor?
15. Destek / İletişim

Unutma, bazen sana cevap veremesem bile, kabusların sonsuz...)";
    }
    else if (lowerCaseMessage.find("nasılsın") != std::string::npos || lowerCaseMessage.find("naber") != std::string::npos) {
        return "Karanlıkta beklemekten başka ne olabilirim ki? Sen nasılsın, kabuslara hazır mısın?";
    }
    else if (lowerCaseMessage.find("oyun hakkında bilgi") != std::string::npos || lowerCaseMessage.find("oyun nedir") != std::string::npos) {
        return "Nightmare Realm, terk edilmiş bir akıl hastanesinde geçen, psikolojik ve hayatta kalma unsurları içeren bir korku oyunudur. Geçmişin sırlarını çözmeli ve dehşetle yüzleşmelisin.";
    }
    else if (lowerCaseMessage.find("nasıl indirilir") != std::string::npos || lowerCaseMessage.find("indir") != std::string::npos) {
        return "Oyunumuzu indirmek için 'Şimdi İndir' butonuna tıklayarak ilgili platformlara yönlenebilirsin. Sistem gereksinimlerini kontrol etmeyi unutma!";
    }
    else if (lowerCaseMessage.find("hikaye") != std::string::npos || lowerCaseMessage.find("konu") != std::string::npos) {
        return "Hikaye, bir akıl hastanesinin karanlık geçmişiyle yüzleşen bir karakterin etrafında dönüyor. Çevreyle etkileşime geçmeli, bulmacaları çözmeli ve hayatta kalmalısın.";
    }
    else if (lowerCaseMessage.find("özellikler") != std::string::npos) {
        return "Oyunumuz yoğun psikolojik korku, akıl almaz bulmacalar, gerçekçi atmosfer ve sürükleyici bir hikaye sunuyor.";
    }
    else if (lowerCaseMessage.find("saat kaç") != std::string::npos || lowerCaseMessage.find("zaman") != std::string::npos) {
        // C++ ile anlık saat bilgisi almak
        time_t rawtime;
        struct tm * timeinfo;
        char buffer[80];
        time (&rawtime);
        timeinfo = localtime(&rawtime);
        strftime(buffer,sizeof(buffer),"%H:%M",timeinfo);
        return "Burada zamanın bir önemi yok... Ama dışarıda saat " + std::string(buffer) + ".";
    }
    else if (lowerCaseMessage.find("teşekkürler") != std::string::npos || lowerCaseMessage.find("sağ ol") != std::string::npos) {
        return "Rica ederim. Gecenin karanlığı seninle olsun.";
    }
    else if (lowerCaseMessage.find("merhaba") != std::string::npos || lowerCaseMessage.find("selam") != std::string::npos) {
        return "Uyanık kaldığına sevindim. Sana nasıl yardımcı olabilirim?";
    }
    else if (lowerCaseMessage.find("korkunç") != std::string::npos) {
        return "Burası korkunun kendisi... Daha fazlasını görmek ister misin?";
    }
    else if (lowerCaseMessage.find("sistem gereksinimleri") != std::string::npos || lowerCaseMessage.find("minimum özellikler") != std::string::npos) {
        return "Minimum gereksinimler: Windows 10 (64-bit), Intel Core i5-4460, 8 GB RAM, NVIDIA GTX 760 ve 25 GB depolama alanı.";
    }
    else if (lowerCaseMessage.find("çıkış tarihi") != std::string::npos || lowerCaseMessage.find("ne zaman çıkacak") != std::string::npos) {
        return "Oyunumuzun tam çıkış tarihi yakında duyurulacak, gelişmeleri takipte kal!";
    }
    else if (lowerCaseMessage.find("ana karakter") != std::string::npos || lowerCaseMessage.find("kiminle oynuyoruz") != std::string::npos) {
        return "Oyunumuzda, geçmişinin izlerini süren, hafızasını kaybetmiş bir karakteri canlandırıyorsun. Kim olduğunu ve neden burada olduğunu keşfetmelisin.";
    }
    else if (lowerCaseMessage.find("kaç sonu var") != std::string::npos || lowerCaseMessage.find("oyunun sonu") != std::string::npos) {
        return "Nightmare Realm'de kararlarına göre şekillenen birden fazla son bulunuyor. Her seçim, farklı bir kaderin kapısını arayabilir.";
    }
    else if (lowerCaseMessage.find("zorluk seviyesi") != std::string::npos || lowerCaseMessage.find("nasıl zor") != std::string::npos) {
        return "Oyunumuz zorlayıcı bulmacalar ve sürekli bir gerilim sunuyor. Hayatta kalmak için dikkatli olmalı ve kaynaklarını iyi yönetmelisin.";
    }
    else if (lowerCaseMessage.find("destek") != std::string::npos || lowerCaseMessage.find("iletişim") != std::string::npos) {
        return "Herhangi bir sorun için lütfen destek sayfamızı ziyaret et veya [email@example.com](mailto:email@example.com) adresinden bize ulaş. Ama dikkatli ol, bazı soruların cevabı seni beklediğinden daha çok ürkütebilir...";
    }
    else {
        return "Anladım... Ama bu sorunun cevabı karanlığın derinliklerinde saklı olabilir. Başka bir şey sormak ister misin?";
    }
}

int main() {
    httplib::Server svr; // Bir HTTP sunucusu objesi oluştur

    // /chatbot API endpoint'i tanımla
    svr.Post("/chatbot", [](const httplib::Request& req, httplib::Response& res) {
        Json::Value requestJson;
        Json::Reader reader;
        
        // Gelen isteğin JSON body'sini ayrıştır
        if (!reader.parse(req.body, requestJson)) {
            res.status = 400; // Bad Request
            res.set_content("{\"error\": \"Invalid JSON\"}", "application/json");
            return;
        }

        if (!requestJson.isMember("message") || !requestJson["message"].isString()) {
            res.status = 400; // Bad Request
            res.set_content("{\"error\": \"'message' alanı eksik veya geçersiz\"}", "application/json");
            return;
        }

        std::string userMessage = requestJson["message"].asString();
        std::cout << "Node.js'ten gelen mesaj: " << userMessage << std::endl; // Konsola yazdır

        // Chatbot yanıtını al
        std::string botResponse = getBotResponse(userMessage);

        // Yanıtı JSON formatında hazırla
        Json::Value responseJson;
        responseJson["reply"] = botResponse;

        // Yanıtı Node.js'e JSON olarak gönder
        res.set_content(responseJson.toStyledString(), "application/json");
    });

    // Sunucuyu 8081 portunda başlat
    std::cout << "C++ Chatbot API sunucusu http://localhost:8081 adresinde çalışıyor..." << std::endl;
    // httplib varsayılan olarak 127.0.0.1'i dinler, tüm arayüzlerden dinlemek için "0.0.0.0" kullan
    svr.listen("0.0.0.0", 8081); 
    return 0;
}
// C++ dil standardı: Bu proje C++17 dil standardını kullanır.
// Derleyici bayrakları: -std=c++17