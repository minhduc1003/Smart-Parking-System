#include <WiFi.h>
#include <esp_camera.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <NTPClient.h>
#include <WiFiUdp.h>
#include <ESP32Servo.h>
#include <time.h>

#define WIFI_SSID "minhduc03"
#define WIFI_PASSWORD "duc23102003"

#define IR_SENSOR_IN 13
#define IR_SENSOR_OUT 15
#define SERVO_PIN 14

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

const char* API_URL = "https://api.platerecognizer.com/v1/plate-reader/";
const char* API_TOKEN = "3585a740fccd9b2efa968b0ffa84bb99a9fcbc7d";
const char* FORWARD_URL = "http://vuondaoduc.io.vn:3000/get-in";
const char* FORWARD_URL_NOTFOUND = "http://vuondaoduc.io.vn:3000/in-not-found";

#define SENSOR_COOLDOWN_MS 5000
#define BARRIER_DELAY_MS 1000
#define STREAM_FPS_INTERVAL_MS 40

WebServer server(80);
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", 25200);
Servo barrierServo;

String currentTime = "";
volatile bool isCapturing = false;

void setupCamera();
void captureAndSendImage();
void handleStream();
void openBarrier();
void closeBarrier();
String getFormattedTime();

String extractJsonStringValue(const String& jsonString, const String& key) {
  int keyIndex = jsonString.indexOf(key);
  if (keyIndex == -1) return "";

  int startIndex = jsonString.indexOf(':', keyIndex) + 2;
  int endIndex = jsonString.indexOf('"', startIndex);

  if (startIndex == -1 || endIndex == -1) return "";

  return jsonString.substring(startIndex, endIndex);
}

void setup() {
  Serial.begin(115200);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  unsigned long startAttemptTime = millis();

  while (WiFi.status() != WL_CONNECTED && millis() - startAttemptTime < 10000) {
    delay(100);
  }

  if (WiFi.status() != WL_CONNECTED) {
    ESP.restart();
  }

  pinMode(IR_SENSOR_IN, INPUT_PULLUP);
  pinMode(IR_SENSOR_OUT, INPUT_PULLUP);

  barrierServo.setPeriodHertz(50);
  barrierServo.attach(SERVO_PIN, 1000, 2000);
  barrierServo.write(0);

  setupCamera();
  timeClient.begin();
  timeClient.forceUpdate();

  server.on("/", handleStream);
  server.begin();
}

void loop() {
  server.handleClient();
  static unsigned long lastTimeUpdate = 0;

  if (millis() - lastTimeUpdate >= 5000) {
    timeClient.update();
    currentTime = getFormattedTime();
    lastTimeUpdate = millis();
  }
}

void openBarrier() {
  barrierServo.write(180);
  delay(BARRIER_DELAY_MS);
}

void closeBarrier() {
  barrierServo.write(0);
  delay(BARRIER_DELAY_MS);
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
    config.jpeg_quality = 10;
    config.fb_count = 1;
    config.fb_location = CAMERA_FB_IN_PSRAM;
  } else {
    config.frame_size = FRAMESIZE_QQVGA;
    config.jpeg_quality = 12;
    config.fb_count = 1;
  }

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    delay(1000);
    ESP.restart();
  }

  sensor_t *s = esp_camera_sensor_get();
  if (s) {
    s->set_brightness(s, 0);
    s->set_contrast(s, 0);
    s->set_saturation(s, 0);
    s->set_special_effect(s, 0);
    s->set_whitebal(s, 1);
    s->set_awb_gain(s, 1);
    s->set_wb_mode(s, 0);
    s->set_exposure_ctrl(s, 1);
    s->set_aec2(s, 0);
    s->set_ae_level(s, 0);
    s->set_aec_value(s, 300);
    s->set_gain_ctrl(s, 1);
    s->set_agc_gain(s, 0);
    s->set_gainceiling(s, (gainceiling_t)0);
    s->set_bpc(s, 0);
    s->set_wpc(s, 1);
    s->set_raw_gma(s, 1);
    s->set_lenc(s, 1);
    s->set_hmirror(s, 0);
    s->set_vflip(s, 0);
    s->set_dcw(s, 1);
    s->set_colorbar(s, 0);
  }
}

void handleStream() {
  WiFiClient client = server.client();
  client.write("HTTP/1.1 200 OK\r\nContent-Type: multipart/x-mixed-replace; boundary=frame\r\n\r\n", 78);

  unsigned long lastSensorCheck = 0;
  unsigned long lastTriggerTime = 0;

  while (client.connected()) {
    unsigned long currentMillis = millis();

    if (currentMillis - lastSensorCheck >= 100) {
      lastSensorCheck = currentMillis;

      int irInState = digitalRead(IR_SENSOR_IN);
      int irOutState = digitalRead(IR_SENSOR_OUT);

      if (irInState == LOW && currentMillis - lastTriggerTime > SENSOR_COOLDOWN_MS) {
        lastTriggerTime = currentMillis;
        isCapturing = true;
        captureAndSendImage();
        isCapturing = false;
      }

      if (irOutState == LOW && currentMillis - lastTriggerTime > SENSOR_COOLDOWN_MS) {
        lastTriggerTime = currentMillis;
        closeBarrier();
      }
    }

    if (!isCapturing) {
      camera_fb_t *fb = esp_camera_fb_get();
      if (fb) {
        client.write("--frame\r\nContent-Type: image/jpeg\r\n\r\n", 37);

        size_t chunkSize = 512;
        for (size_t i = 0; i < fb->len; i += chunkSize) {
          size_t remaining = fb->len - i;
          size_t sendSize = (remaining < chunkSize) ? remaining : chunkSize;
          client.write(fb->buf + i, sendSize);
        }

        client.write("\r\n", 2);
        esp_camera_fb_return(fb);

        unsigned long frameEndTime = millis();
        if (frameEndTime - currentMillis < STREAM_FPS_INTERVAL_MS) {
          delay(STREAM_FPS_INTERVAL_MS - (frameEndTime - currentMillis));
        }
      }
    } else {
      delay(10);
    }

    yield();
  }
}

void captureAndSendImage() {
  camera_fb_t *fb = esp_camera_fb_get();
  if (!fb) return;

  String boundary = "Boundary-" + String(millis());
  String header = "--" + boundary + "\r\n";
  header += "Content-Disposition: form-data; name=\"upload\"; filename=\"capture.jpg\"\r\n";
  header += "Content-Type: image/jpeg\r\n\r\n";
  String footer = "\r\n--" + boundary + "--\r\n";
  
  size_t totalLength = header.length() + fb->len + footer.length();

  HTTPClient http;
  http.begin(API_URL);
  http.addHeader("Authorization", "Token " + String(API_TOKEN));
  http.addHeader("Content-Type", "multipart/form-data; boundary=" + boundary);
  http.addHeader("Connection", "close");

  uint8_t* buffer = (uint8_t*)malloc(totalLength);
  if (!buffer) {
    esp_camera_fb_return(fb);
    return;
  }

  size_t pos = 0;
  memcpy(buffer + pos, header.c_str(), header.length());
  pos += header.length();
  memcpy(buffer + pos, fb->buf, fb->len);
  pos += fb->len;
  memcpy(buffer + pos, footer.c_str(), footer.length());

  esp_camera_fb_return(fb);

  int httpCode = http.sendRequest("POST", buffer, totalLength);
  free(buffer);

  if (httpCode > 0) {
    String response = http.getString();
    if (httpCode == HTTP_CODE_OK || httpCode == HTTP_CODE_CREATED) {
      String plateNumber = extractJsonStringValue(response, "plate");
      if (plateNumber != "") {
        HTTPClient httpForward;
        httpForward.begin(FORWARD_URL);
        httpForward.addHeader("Content-Type", "application/json");
        
        String jsonPayload = "{\"plate\":\"" + plateNumber + "\",\"time\":\"" + currentTime + "\"}";
        int forwardCode = httpForward.POST(jsonPayload);
        if (forwardCode == HTTP_CODE_OK) {
          openBarrier();
        }
        httpForward.end();
      } else {
        HTTPClient httpForwardNotFound;
        httpForwardNotFound.begin(FORWARD_URL_NOTFOUND);
        httpForwardNotFound.addHeader("Content-Type", "application/json");
        
        String jsonPayload = "{\"time\":\"" + currentTime + "\"}";
        httpForwardNotFound.POST(jsonPayload);
        httpForwardNotFound.end();
      }
    }
  }

  http.end();
}

String getFormattedTime() {
  timeClient.update();
  time_t rawtime = timeClient.getEpochTime();
  struct tm *ti;
  ti = localtime(&rawtime);

  uint16_t year = ti->tm_year + 1900;
  String yearStr = String(year);

  uint8_t month = ti->tm_mon + 1;
  String monthStr = month < 10 ? "0" + String(month) : String(month);

  uint8_t day = ti->tm_mday;
  String dayStr = day < 10 ? "0" + String(day) : String(day);

  int hour = timeClient.getHours();
  int minute = timeClient.getMinutes();
  int second = timeClient.getSeconds();

  String formattedDateTime = yearStr + "-" +
                             monthStr + "-" +
                             dayStr + "T" +
                             (hour < 10 ? "0" : "") + String(hour) + ":" +
                             (minute < 10 ? "0" : "") + String(minute) + ":" +
                             (second < 10 ? "0" : "") + String(second);

  return formattedDateTime;
}
