#include <WiFi.h>
#include <esp_camera.h>
#include <WebServer.h>
#include "FS.h"
#include "SD_MMC.h"
#include "time.h"

// WiFi credentials
#define WIFI_SSID "minhduc03"
#define WIFI_PASSWORD "duc23102003"

// Camera pin config (AI Thinker)
#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27
#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5
#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

WebServer server(80);
File videoFile;
bool isRecording = true;

unsigned long lastSplitTime = 0;
const unsigned long splitInterval = 1 * 60 * 1000; // 5 phút
const size_t maxFileSize = 5 * 1024 * 1024;         // 5MB

// --- Time Sync (GMT+7) ---
void setupTime() {
  configTime(7 * 3600, 0, "pool.ntp.org", "time.nist.gov"); // GMT+7
  Serial.print("Syncing time");
  while (time(nullptr) < 100000) {
    Serial.print(".");
    delay(500);
  }
  Serial.println(" OK");
}

// --- Tạo tên file theo thời gian ---
String getTimestampedFilename() {
  time_t now = time(nullptr);
  struct tm *timeinfo = localtime(&now);
  char filename[32];
  sprintf(filename, "/video_%04d%02d%02d_%02d%02d%02d.mjpeg",
          timeinfo->tm_year + 1900, timeinfo->tm_mon + 1, timeinfo->tm_mday,
          timeinfo->tm_hour, timeinfo->tm_min, timeinfo->tm_sec);
  return String(filename);
}

// --- Tạo file mới ---
void createNewVideoFile() {
  if (videoFile) videoFile.close();
  String filename = getTimestampedFilename();
  videoFile = SD_MMC.open(filename, FILE_WRITE);
  if (videoFile) {
    Serial.println("Recording to: " + filename);
  } else {
    Serial.println("⚠ Failed to open new video file.");
  }
}

// --- Kiểm tra chia file ---
void checkSplitConditions() {
  if (millis() - lastSplitTime > splitInterval || 
      (videoFile && videoFile.size() >= maxFileSize)) {
    createNewVideoFile();
    lastSplitTime = millis();
  }
}

// --- Ghi từng chunk vào file SD ---
void writeChunkedToSD(const uint8_t* data, size_t len) {
  const size_t CHUNK_SIZE = 1024;
  size_t offset = 0;
  while (offset < len) {
    size_t toWrite = min(CHUNK_SIZE, len - offset);
    videoFile.write(data + offset, toWrite);
    offset += toWrite;
  }
  videoFile.flush(); // đảm bảo đã ghi ra thẻ
}

// --- Khởi tạo camera ---
void setupCamera() {
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer   = LEDC_TIMER_0;
  config.pin_d0       = Y2_GPIO_NUM;
  config.pin_d1       = Y3_GPIO_NUM;
  config.pin_d2       = Y4_GPIO_NUM;
  config.pin_d3       = Y5_GPIO_NUM;
  config.pin_d4       = Y6_GPIO_NUM;
  config.pin_d5       = Y7_GPIO_NUM;
  config.pin_d6       = Y8_GPIO_NUM;
  config.pin_d7       = Y9_GPIO_NUM;
  config.pin_xclk     = XCLK_GPIO_NUM;
  config.pin_pclk     = PCLK_GPIO_NUM;
  config.pin_vsync    = VSYNC_GPIO_NUM;
  config.pin_href     = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn     = PWDN_GPIO_NUM;
  config.pin_reset    = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;

  if (psramFound()) {
    config.frame_size = FRAMESIZE_QVGA;
    config.jpeg_quality = 10;
    config.fb_count = 2;
  } else {
    config.frame_size = FRAMESIZE_QQVGA;
    config.jpeg_quality = 12;
    config.fb_count = 1;
  }

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed: 0x%x", err);
    while (true);
  }
}

// --- Xử lý stream MJPEG ---
void handleStream() {
  WiFiClient client = server.client();
  client.println("HTTP/1.1 200 OK");
  client.println("Content-Type: multipart/x-mixed-replace; boundary=frame");
  client.println();

  while (client.connected()) {
    camera_fb_t *fb = esp_camera_fb_get();
    if (!fb) {
      Serial.println("Camera capture failed");
      continue;
    }

    client.printf("--frame\r\nContent-Type: image/jpeg\r\nContent-Length: %u\r\n\r\n", fb->len);
    
    // Write frame data in chunks of 512 bytes
    const size_t CHUNK_SIZE = 512;
    size_t offset = 0;
    while (offset < fb->len) {
      size_t toWrite = min(CHUNK_SIZE, fb->len - offset);
      client.write(fb->buf + offset, toWrite);
      offset += toWrite;
    }
    
    client.write("\r\n");

    if (isRecording && videoFile) {
      writeChunkedToSD(fb->buf, fb->len);
    }

    esp_camera_fb_return(fb);
    checkSplitConditions();
    delay(100); // 10 fps
  }
}

// --- SETUP ---
void setup() {
  Serial.begin(115200);

  // Kết nối WiFi
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi connected: " + WiFi.localIP().toString());

  // Sync thời gian & camera
  setupTime();
  setupCamera();

  // Khởi tạo SD
  if (!SD_MMC.begin()) {
    Serial.println("⚠ SD Card Mount Failed");
    return;
  }

  if (SD_MMC.cardType() == CARD_NONE) {
    Serial.println("⚠ No SD card");
    return;
  }

  // Ghi file đầu tiên
  createNewVideoFile();
  lastSplitTime = millis();

  server.on("/", handleStream);
  server.begin();
  Serial.println("✅ Stream: http://" + WiFi.localIP().toString());
}

// --- LOOP ---
void loop() {
  server.handleClient();
}
