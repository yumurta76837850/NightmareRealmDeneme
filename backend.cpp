#include <boost/beast.hpp>
#include <boost/beast/http.hpp>
#include <boost/beast/version.hpp>
#include <boost/asio/ip/tcp.hpp>
#include <boost/config.hpp>

#include <iostream>
#include <string>
#include <thread>
#include <memory>
#include <vector>

// Boost kütüphanelerinin kýsa isim alanlarý
namespace beast = boost::beast;
namespace http = beast::http;
namespace net = boost::asio;
using tcp = net::ip::tcp;

// JSON verisi için basit bir struct
struct JsonData {
    std::string key;
    std::string value;
};

// HTTP isteðini iþleyen ve cevap dönen sýnýf
class http_session : public std::enable_shared_from_this<http_session> {
private:
    tcp::socket socket_;
    beast::flat_buffer buffer_;
    http::request<http::string_body> request_;

public:
    // Yapýlandýrýcý (Constructor)
    explicit http_session(tcp::socket socket)
        : socket_(std::move(socket)) {
    }

    // Oturumu baþlat
    void run() {
        http::async_read(socket_, buffer_, request_,
            beast::bind_front_handler(&http_session::on_read, shared_from_this()));
    }

    // Gelen isteðe göre farklý cevaplar üreten fonksiyon
    void handle_request() {
        // HTTP cevabý için bir þablon oluþtur
        http::response<http::string_body> response{ http::status::ok, request_.version() };
        response.set(http::field::server, BOOST_BEAST_VERSION_STRING);
        response.keep_alive(request_.keep_alive());

        // Gelen URL'ye (URI) göre yönlendirme yapma (routing)
        if (request_.target() == "/login") {
            response.set(http::field::content_type, "application/json");
            response.body() = R"({"status": "success", "message": "Giris basarili!"})";
        }
        else if (request_.target() == "/scores") {
            response.set(http::field::content_type, "application/json");
            response.body() = R"({"scores": [{"user": "Ahmet Baba", "score": 1500}, {"user": "Oyuncu2", "score": 1200}]})";
        }
        else {
            // Tanýmlanmamýþ URL için 404 Not Found hatasý
            response.result(http::status::not_found);
            response.set(http::field::content_type, "text/plain");
            response.body() = "404 Sayfa Bulunamadi";
        }

        response.prepare_payload();

        // Asenkron yazma iþlemini baþlat
        http::async_write(socket_, response,
            beast::bind_front_handler(&http_session::on_write, shared_from_this(), response.need_eof()));
    }

    // Okuma iþlemi tamamlandýðýnda çaðrýlan fonksiyon
    void on_read(beast::error_code ec, std::size_t bytes_transferred) {
        boost::ignore_unused(bytes_transferred);

        if (ec == http::error::end_of_stream) {
            return do_close();
        }

        if (ec) {
            return;
        }

        // Gelen isteði iþle
        handle_request();
    }

    // Yazma iþlemi tamamlandýðýnda çaðrýlan fonksiyon
    void on_write(beast::error_code ec, std::size_t bytes_transferred, bool close) {
        boost::ignore_unused(bytes_transferred);

        if (ec) {
            return;
        }

        if (close) {
            return do_close();
        }

        request_ = {};
        http::async_read(socket_, buffer_, request_,
            beast::bind_front_handler(&http_session::on_read, shared_from_this()));
    }

    // Soketi kapat
    void do_close() {
        beast::error_code ec;
        socket_.shutdown(tcp::socket::shutdown_send, ec);
    }
};

// Ana sunucu döngüsünü baþlatan fonksiyon
void run_server(const char* host, unsigned short port) {
    auto const address = net::ip::make_address(host);
    net::io_context ioc{ 1 };
    tcp::acceptor acceptor{ ioc, {address, port} };

    std::cout << "KORKUOYUNU.SITE sunucusu baslatildi, " << host << ":" << port << " adresini dinliyor.\n";

    for (;;) {
        tcp::socket socket{ ioc };
        acceptor.accept(socket);

        std::thread([s = std::move(socket)]() mutable {
            std::make_shared<http_session>(std::move(s))->run();
            }).detach();
    }
}

// Ana fonksiyon
int main(int argc, char* argv[]) {
    auto const host = "0.0.0.0"; // "localhost" yerine 0.0.0.0, dýþ baðlantýlar için daha iyi
    auto const port = 8080;

    run_server(host, port);

    return 0;
}
