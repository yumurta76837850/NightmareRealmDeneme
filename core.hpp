#include <iostream>
#include <vector>
#include <string>
#include <algorithm>

// Yap�lacak g�revi temsil eden bir yap� (struct)
struct Gorev {
    int id;
    std::string baslik;
    std::string aciklama;
};

// Global g�rev listesi
std::vector<Gorev> gorevler;
int nextId = 1;

// Yeni g�rev ekleme fonksiyonu
void gorevEkle() {
    std::string baslik;
    std::string aciklama;

    std::cout << "Gorev Basligi: ";
    std::cin.ignore(); // �nceki girdiden kalanlar� temizler
    std::getline(std::cin, baslik);

    std::cout << "Gorev Aciklamasi: ";
    std::getline(std::cin, aciklama);

    Gorev yeniGorev;
    yeniGorev.id = nextId++;
    yeniGorev.baslik = baslik;
    yeniGorev.aciklama = aciklama;

    gorevler.push_back(yeniGorev);
    std::cout << "Gorev basariyla eklendi.\n\n";
}

// G�revleri listeleme fonksiyonu
void gorevleriListele() {
    if (gorevler.empty()) {
        std::cout << "Henuz hic gorev yok.\n\n";
        return;
    }

    std::cout << "--- Gorev Listesi ---\n";
    for (const auto& g : gorevler) {
        std::cout << "ID: " << g.id << "\n";
        std::cout << "Baslik: " << g.baslik << "\n";
        std::cout << "Aciklama: " << g.aciklama << "\n";
        std::cout << "---------------------\n";
    }
    std::cout << "\n";
}

// Bir g�revi ID'sine g�re silme fonksiyonu
void gorevSil() {
    int silinecekId;
    std::cout << "Silinecek gorevin ID'sini girin: ";
    std::cin >> silinecekId;

    // std::remove_if ve erase ile g�revi sil
    auto yeniSon = std::remove_if(gorevler.begin(), gorevler.end(),
        [silinecekId](const Gorev& g) {
            return g.id == silinecekId;
        });

    if (yeniSon != gorevler.end()) {
        gorevler.erase(yeniSon, gorevler.end());
        std::cout << "Gorev basariyla silindi.\n\n";
    }
    else {
        std::cout << "Belirtilen ID'de gorev bulunamadi.\n\n";
    }
}

// Ana program d�ng�s�
int main() {
    int secim;

    while (true) {
        std::cout << "--- Secenekler ---\n";
        std::cout << "1. Gorev Ekle\n";
        std::cout << "2. Gorevleri Listele\n";
        std::cout << "3. Gorev Sil\n";
        std::cout << "4. Cikis\n";
        std::cout << "Seciminizi girin: ";
        std::cin >> secim;

        switch (secim) {
        case 1:
            gorevEkle();
            break;
        case 2:
            gorevleriListele();
            break;
        case 3:
            gorevSil();
            break;
        case 4:
            std::cout << "Programdan cikiliyor.\n";
            return 0;
        default:
            std::cout << "Gecersiz secim. Lutfen tekrar deneyin.\n\n";
            break;
        }
    }

    return 0;
}
