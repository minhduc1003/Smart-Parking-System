#include <ESP8266WiFi.h>
#include <espnow.h>
#include <Wire.h> 
#include <LiquidCrystal_I2C.h>
LiquidCrystal_I2C lcd(0x27, 20, 4);
// Replace with your Wi-Fi credentials
const char* ssid = "tang2-2.4";
const char* password = "23102003";

// Callback when data is received via ESP-NOW
void OnDataRecv(uint8_t* mac, uint8_t* incomingData, uint8_t len) {
  char data[50];
  memcpy(data, incomingData, len);
  data[len] = '\0'; // Null-terminate the string

  // Split license plate and timestamp
  String receivedData = String(data);
  int separatorIndex = receivedData.indexOf('|');
  String licensePlate = receivedData.substring(0, separatorIndex);
  String timestamp = receivedData.substring(separatorIndex + 1);
  Serial.println(licensePlate);
  // Display on LCD
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Plate: " + licensePlate);
  lcd.setCursor(0, 1);
  lcd.print("Time: " + timestamp);
}

void setup() {
  Serial.begin(115200);

  // Connect to Wi-Fi
  WiFi.begin(ssid, password);
 lcd.init();
  lcd.backlight();
lcd.print("Wifi Connect...");


  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWi-Fi connected");
    lcd.setCursor(0,1);
  lcd.print("Done!");
  WiFi.channel(1);
  Serial.print("ESP8266 MAC Address: ");
  Serial.println(WiFi.macAddress());


  // Initialize ESP-NOW
  if (esp_now_init() != 0) {
    Serial.println("ESP-NOW init failed");
    return;
  }

  esp_now_set_self_role(ESP_NOW_ROLE_SLAVE);
  esp_now_register_recv_cb(OnDataRecv);
}
void loopShow() {
    // Print a message to the LCD
  delay(1000);
  lcd.backlight(); // Turn on the backlight
  lcd.setCursor(0, 0); // Column 0, Row 0
  lcd.print("Hello, World!");
  lcd.setCursor(0, 1); // Column 0, Row 1
  lcd.print("ESP8266 + I2C LCD");
}
void loop() {
}