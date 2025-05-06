#include <WiFi.h>
#include <esp_camera.h>
#include <WebServer.h>

// Configuration Constants
#define WIFI_SSID "minhduc03"
#define WIFI_PASSWORD "duc23102003"

// Camera pins for ESP32-CAM
#define PWDN_GPIO_NUM 32
#define RESET_GPIO_NUM -1
#define XCLK_GPIO_NUM 0
#define SIOD_GPIO_NUM 26
#define SIOC_GPIO_NUM 27
#define Y9_GPIO_NUM 35
#define Y8_GPIO_NUM 34
#define Y7_GPIO_NUM 39
#define Y6_GPIO_NUM 36
#define Y5_GPIO_NUM 21
#define Y4_GPIO_NUM 19
#define Y3_GPIO_NUM 18
#define Y2_GPIO_NUM 5
#define VSYNC_GPIO_NUM 25
#define HREF_GPIO_NUM 23
#define PCLK_GPIO_NUM 22

// Global Objects
WebServer server(80);
unsigned long frameCount = 0;
unsigned long lastFPSCheck = 0;
float currentFPS = 0.0;
// Function Prototypes
void setupCamera();
void handleStream();

void setup() {
    Serial.begin(115200);

    // Check for PSRAM
    if (!psramFound()) {
        Serial.println("PSRAM not found");
    } else {
        Serial.println("PSRAM found");
    }

    // Connect to Wi-Fi
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
    Serial.print("Connecting to Wi-Fi");
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println("\nWiFi connected: " + WiFi.localIP().toString());

    // Initialize camera
    setupCamera();

    // Set up server
    server.on("/", handleStream);
    server.begin();
    Serial.println("HTTP server started");
}

void loop() {
    server.handleClient();
}

void setupCamera() {
    camera_config_t config;
    config.ledc_channel = LEDC_CHANNEL_0;
    config.ledc_timer = LEDC_TIMER_0;
    config.pin_d0 = Y2_GPIO_NUM;
    config.pin_d1 = Y3_GPIO_NUM;
    config.pin_d2 = Y4_GPIO_NUM;
    config.pin_d3 = Y5_GPIO_NUM;
    config.pin_d4 = Y6_GPIO_NUM;
    config.pin_d5 = Y7_GPIO_NUM;
    config.pin_d6 = Y8_GPIO_NUM;
    config.pin_d7 = Y9_GPIO_NUM;
    config.pin_xclk = XCLK_GPIO_NUM;
    config.pin_pclk = PCLK_GPIO_NUM;
    config.pin_vsync = VSYNC_GPIO_NUM;
    config.pin_href = HREF_GPIO_NUM;
    config.pin_sscb_sda = SIOD_GPIO_NUM;
    config.pin_sscb_scl = SIOC_GPIO_NUM;
    config.pin_pwdn = PWDN_GPIO_NUM;
    config.pin_reset = RESET_GPIO_NUM;
    config.xclk_freq_hz = 20000000;
    config.pixel_format = PIXFORMAT_JPEG;

    if (psramFound()) {
        config.frame_size = FRAMESIZE_QVGA;
        config.jpeg_quality = 4;
        config.fb_count = 1;
        Serial.println("PSRAM found");
        config.grab_mode = CAMERA_GRAB_LATEST; // Get latest frame
    } else {
        config.frame_size = FRAMESIZE_QVGA;
        config.jpeg_quality = 4;
        config.fb_count = 1;
        Serial.println("WARNING: Running without PSRAM will limit performance");
    }

    esp_err_t err = esp_camera_init(&config);
    if (err != ESP_OK) {
        Serial.printf("Camera init failed with error 0x%x", err);
        delay(1000);
        ESP.restart();
    }
}

void handleStream() {
    WiFiClient client = server.client();
    client.write("HTTP/1.1 200 OK\r\nContent-Type: multipart/x-mixed-replace; boundary=frame\r\n\r\n", 78);

    while (client.connected()) {
        // FPS calculation
        unsigned long now = millis();
        frameCount++;
        
        if (now - lastFPSCheck >= 1000) { // Calculate FPS every second
            currentFPS = frameCount * 1000.0 / (now - lastFPSCheck);
            Serial.printf("FPS: %.2f\n", currentFPS);
            frameCount = 0;
            lastFPSCheck = now;
        }

        camera_fb_t *fb = esp_camera_fb_get();
        if (fb) {
            client.write("--frame\r\nContent-Type: image/jpeg\r\n\r\n", 37);
            client.write(fb->buf, fb->len);
            client.write("\r\n", 2);
            esp_camera_fb_return(fb);
            // Reduce delay to increase FPS
            delay(10); // Stream at ~100 FPS (theoretical maximum)
        } else {
            delay(10);
        }
        yield();
    }

    Serial.println("Client disconnected");
}
