#include <WiFi.h>
#include <esp_camera.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <NTPClient.h>
#include <WiFiUdp.h>
#include <ESP32Servo.h>
#include <time.h>
// Configuration Constants
#define WIFI_SSID "tang5-2.4"
#define WIFI_PASSWORD "23102003"

// Pin Definitions
#define IR_SENSOR_IN 13
#define IR_SENSOR_OUT 15
#define SERVO_PIN 14

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

// API Configuration
const char* API_URL = "https://api.platerecognizer.com/v1/plate-reader/";
const char* API_TOKEN = "3585a740fccd9b2efa968b0ffa84bb99a9fcbc7d";
const char* FORWARD_URL = "http://192.168.1.100:3000/get-in";
// Timing and Control
#define SENSOR_COOLDOWN_MS 5000
#define BARRIER_DELAY_MS 2000
#define STREAM_FPS_INTERVAL_MS 40

// Global Objects
WebServer server(80);
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, "pool.ntp.org", 25200); // UTC+7 offset
Servo barrierServo;

// Global State
String currentTime = "";
bool isCapturing = false;

// Function Prototypes
void setupCamera();
void captureAndSendImage();
void handleStream();
void openBarrier();
void closeBarrier();
String getFormattedTime();
String extractJsonStringValue(const String& jsonString, const String& key);

void setup() {
  Serial.begin(115200);
  
  // Check for PSRAM
  if(!psramFound()) {
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

  // Initialize Hardware
  pinMode(IR_SENSOR_IN, INPUT_PULLUP);
  pinMode(IR_SENSOR_OUT, INPUT_PULLUP);
  
  barrierServo.setPeriodHertz(50);
  barrierServo.attach(SERVO_PIN, 1000, 2000);
  barrierServo.write(0); // Initial position (closed)

  // Initialize services
  setupCamera();
  timeClient.begin();
  timeClient.update();
  
  // Set up server
  server.on("/", handleStream);
  server.begin();
  Serial.println("HTTP server started");
}

void loop() {
  server.handleClient();
  currentTime = getFormattedTime();
}

void openBarrier() {
  Serial.println("Barrier Opens");
  barrierServo.write(180);
  delay(BARRIER_DELAY_MS);
}

void closeBarrier() {
  Serial.println("Barrier Closes");
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
    config.jpeg_quality = 4;  // Higher quality (lower is better, but uses more memory)
    config.fb_count = 1;       // Reduce buffer count to minimize memory usage
    Serial.println("PSRAM found");
  } else {
    config.frame_size = FRAMESIZE_QVGA;
    config.jpeg_quality = 4;  // Lower quality to use less memory
    config.fb_count = 1;
    Serial.println("WARNING: Running without PSRAM will limit performance");
  }

  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x", err);
    delay(1000);
    ESP.restart();
  }
  
  // sensor_t *s = esp_camera_sensor_get();
  // if (s) {
  //    s->set_vflip(s, 1);
  //    s->set_hmirror(s, 1);
  // }
}

void handleStream() {
  WiFiClient client = server.client();
  client.write("HTTP/1.1 200 OK\r\nContent-Type: multipart/x-mixed-replace; boundary=frame\r\n\r\n", 78);

  unsigned long lastTimers[5] = {0}; // [FpsTime, TriggerTime, SensorCheck, DebugPrint, TimeUpdate]
  unsigned long frameCount = 0;
  
  while (client.connected()) {
    // Update time every 5s
    if (millis() - lastTimers[4] >= 5000) {
      currentTime = getFormattedTime();
      lastTimers[4] = millis();
    }
    
    // Check IR sensors every 100ms
    if (millis() - lastTimers[2] >= 100) {
      lastTimers[2] = millis();
      int irInState = digitalRead(IR_SENSOR_IN);
      int irOutState = digitalRead(IR_SENSOR_OUT);
      
      // Debug print every 5s
      if (millis() - lastTimers[3] >= 5000) {
        Serial.printf("IR IN: %d, IR OUT: %d\n", irInState, irOutState);
        lastTimers[3] = millis();
      }

      // Handle vehicle entry
      if (irInState == LOW && millis() - lastTimers[1] > SENSOR_COOLDOWN_MS) {
        Serial.println("Vehicle detected at entry point");
        lastTimers[1] = millis();
        isCapturing = true;
        captureAndSendImage();
        isCapturing = false;
      }
      
      // Handle vehicle exit
      if (irOutState == LOW && millis() - lastTimers[1] > SENSOR_COOLDOWN_MS) {
        Serial.println("Vehicle detected at exit point");
        lastTimers[1] = millis();
        closeBarrier();
      }
    }
    
    // Handle streaming when not capturing
    if (!isCapturing) {
      camera_fb_t *fb = esp_camera_fb_get();
      if (fb) {
        client.write("--frame\r\nContent-Type: image/jpeg\r\n\r\n", 37);
        client.write(fb->buf, fb->len);
        client.write("\r\n", 2);
        esp_camera_fb_return(fb);
        
        // Calculate FPS every second
        frameCount++;
        if (millis() - lastTimers[0] >= 1000) {
          Serial.printf("Streaming: %.1f FPS\n", frameCount / ((millis() - lastTimers[0]) / 1000.0));
          frameCount = 0;
          lastTimers[0] = millis();
        }
        
        delay(STREAM_FPS_INTERVAL_MS);
      }
    } else {
      delay(50);
    }
    
    yield();
  }
  
  Serial.println("Client disconnected");
}

void captureAndSendImage() {
  camera_fb_t *fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("ERROR: Camera capture failed!");
    return;
  }
  String boundary = "Boundary-" + String(millis());
  String header = "--" + boundary + "\r\n";
  header += "Content-Disposition: form-data; name=\"upload\"; filename=\"capture.jpg\"\r\n";
  header += "Content-Type: image/jpeg\r\n\r\n";
  String footer = "\r\n--" + boundary + "--\r\n";
  
  // Calculate total length
  size_t totalLength = header.length() + fb->len + footer.length();

  // 3. Initialize HTTP client
  HTTPClient http;
  http.begin(API_URL);
  http.addHeader("Authorization", "Token " + String(API_TOKEN));
  http.addHeader("Content-Type", "multipart/form-data; boundary=" + boundary);
  http.addHeader("Connection", "close");
  uint8_t* buffer = (uint8_t*)malloc(totalLength);
  if (!buffer) {
    Serial.println("ERROR: Memory allocation failed!");
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
  free(buffer); // Free the buffer after sending
  Serial.printf("HTTP Status Code: %d\n", httpCode);

  if (httpCode > 0) {
    String response = http.getString();
    Serial.printf("Full API Response (%d bytes):\n%s\n", response.length(), response.c_str());
    openBarrier();
    if (httpCode == HTTP_CODE_OK || httpCode == HTTP_CODE_CREATED) {
      String plateNumber = extractJsonStringValue(response, "plate");
      if (plateNumber != "") {
        Serial.printf("SUCCESS: Detected plate - %s\n", plateNumber.c_str());

        // Forward to local server
        Serial.println("Forwarding to local server...");
        HTTPClient httpForward;
        httpForward.begin(FORWARD_URL);
        httpForward.addHeader("Content-Type", "application/json");
        
        String jsonPayload = "{\"plate\":\"" + plateNumber + "\",\"time\":\"" + currentTime + "\"}";
        Serial.printf("Forward payload: %s\n", jsonPayload.c_str());
        
        int forwardCode = httpForward.POST(jsonPayload);
        if (forwardCode == HTTP_CODE_OK) {
          Serial.println("SUCCESS: Data forwarded");
          openBarrier();
        } else {
          Serial.printf("ERROR: Forward failed (%d): %s\n", forwardCode, httpForward.errorToString(forwardCode).c_str());
        }
        httpForward.end();
      } else {
        Serial.println("WARNING: No plate detected in response");
      }
    } else {
      Serial.printf("ERROR: API returned %d\n", httpCode);
    }
  } else {
    Serial.printf("ERROR: API request failed - %s\n", http.errorToString(httpCode).c_str());
  }

  http.end();
  Serial.println("===== Finished captureAndSendImage =====\n");
}
String getFormattedTime() {
  // Update the time from the NTP client
  timeClient.update();
  time_t rawtime =  timeClient.getEpochTime();
  struct tm * ti;
  ti = localtime (&rawtime);

 uint16_t year = ti->tm_year + 1900;
   String yearStr = String(year);

   uint8_t month = ti->tm_mon + 1;
   String monthStr = month < 10 ? "0" + String(month) : String(month);

   uint8_t day = ti->tm_mday;
   String dayStr = day < 10 ? "0" + String(day) : String(day);


  int hour = timeClient.getHours();


  int minute = timeClient.getMinutes();

   
  int second = timeClient.getSeconds();
  // Format the date and time into JavaScript-compatible format: yyyy-mm-ddTHH:MM:SS
  String formattedDateTime =yearStr + "-" +
                             monthStr + "-"+
                             dayStr + "T" +
                             (hour < 10 ? "0" : "") + String(hour) + ":" +
                             (minute < 10 ? "0" : "") + String(minute) + ":" +
                             (second < 10 ? "0" : "") + String(second);

  return formattedDateTime;
}
String extractJsonStringValue(const String& jsonString, const String& key) {
  int keyIndex = jsonString.indexOf(key);
  if (keyIndex == -1) {
    return "";
  }

  int startIndex = jsonString.indexOf(':', keyIndex) + 2;
  int endIndex = jsonString.indexOf('"', startIndex);

  if (startIndex == -1 || endIndex == -1) {
    return "";
  }

  return jsonString.substring(startIndex, endIndex);
}