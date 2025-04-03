#include <ESP8266WiFi.h>
#include <espnow.h>
#include <Wire.h> 
#include <LiquidCrystal_I2C.h>
#include <WebSocketsClient.h>
#define CAR_SLOT 3
#define IR_CAR1 15
#define led_CAR1 2
#define IR_CAR2 4
#define led_CAR2 16
#define IR_CAR3 17
#define led_CAR3 5
#define led_ALL 18
WebSocketsClient webSocket;  // WebSocket client object
LiquidCrystal_I2C lcd(0x27, 20, 4);
// Replace with your Wi-Fi credentials
const char* ssid = "tang5-2.4";
const char* password = "23102003";
short gsArray_Sensor[CAR_SLOT] = {IR_CAR1, IR_CAR2, IR_CAR3};
short gsArray_LED[CAR_SLOT] = {led_CAR1, led_CAR2, led_CAR3};
const char* websocket_server = "192.168.0.157";  // Replace with your Node.js server's IP
const int websocket_port = 8080;  // WebSocket port
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
void loopShow() {
    // Print a message to the LCD
  delay(1000);
  lcd.backlight(); // Turn on the backlight
  lcd.setCursor(0, 0); // Column 0, Row 0
  lcd.print("Hello, World!");
  lcd.setCursor(0, 1); // Column 0, Row 1
  lcd.print("ESP8266 + I2C LCD");
}
void vLCD_Display(short sCar_Slot, unsigned short sArray_Sensor[])
{
  lcd.clear();
  lcd.setCursor(0,0);
  lcd.print("Slot Left: ");
  lcd.print(sCar_Slot);

  lcd.setCursor(0,1);
  // Show all sensors status on second line
  lcd.print("S1:");
  lcd.print(sArray_Sensor[0] ? "F" : "E");
  lcd.print(" S2:");
  lcd.print(sArray_Sensor[1] ? "F" : "E");
  lcd.print(" S3:");
  lcd.print(sArray_Sensor[2] ? "F" : "E");
}

unsigned short sIR_Detect(short sWhichSensor)
{
  if(digitalRead(sWhichSensor) == 0)
  {
    delay(50);
    if(digitalRead(sWhichSensor) == 0)
    {
      return 1; 
    }
    else
    {
      return 0;
    }
  }
  else 
  {
    return 0; 
  }
}
void setup() {
  Serial.begin(115200);

  // Connect to Wi-Fi
  WiFi.begin(ssid, password);
 lcd.init();
  lcd.backlight();
lcd.print("Wifi Connect...");
  pinMode(IR_CAR1, INPUT_PULLUP);
  pinMode(IR_CAR2, INPUT_PULLUP);
  pinMode(IR_CAR3, INPUT_PULLUP);
  pinMode(led_CAR1, OUTPUT);
  pinMode(led_CAR2, OUTPUT);
  pinMode(led_CAR3, OUTPUT);
  pinMode(led_ALL, OUTPUT);
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
  webSocket.begin(websocket_server, websocket_port);  // Start WebSocket connection
  webSocket.onEvent(webSocketEvent);  // Register the WebSocket event handler
  esp_now_set_self_role(ESP_NOW_ROLE_SLAVE);
  esp_now_register_recv_cb(OnDataRecv);
    
}


void loop() {
  webSocket.loop();
   unsigned short usSensorStatus[CAR_SLOT] = {0,0,0};
  short sCar_Slot = CAR_SLOT;
  for(short i=0; i<CAR_SLOT; i++)
    {
      usSensorStatus[i]= sIR_Detect(gsArray_Sensor[i]);
      if (usSensorStatus[i] == 1) {
        digitalWrite(gsArray_LED[i], HIGH);
      } else {
        digitalWrite(gsArray_LED[i], LOW);
      }

    }
     String statusMessage = "{\"action\":\"slot-status\",\"slots\":[";
  for (short i = 0; i < CAR_SLOT; i++) {
    statusMessage += String(usSensorStatus[i]);
    if (i < CAR_SLOT - 1) {
      statusMessage += ",";
    }
  }
  statusMessage += "]}";

  webSocket.sendTXT(statusMessage);  
    vLCD_Display(sCar_Slot, usSensorStatus);
  delay(500);


}
void webSocketEvent(WStype_t type, uint8_t* payload, size_t length) {
 String message = String((char *)payload);
  switch (type) {
    case WStype_CONNECTED:
      Serial.println("Connected to WebSocket server");
      break;
    case WStype_DISCONNECTED:
      Serial.println("Disconnected from WebSocket server");
      break;
    case WStype_TEXT:
      Serial.print("Received message: ");
      Serial.println((char*)payload);
      // Parse the JSON message
      // Check if the message is a JSON with type "lightStatus"
      if (message.indexOf("\"type\":\"light-status\"") >= 0 && message.indexOf("\"lightStatus\":") >= 0) {
        
        // Find the value of lightStatus in the message
        int statusIndex = message.indexOf("\"lightStatus\":") + 15;  // Skip past the "lightStatus": part
        String statusValue = message.substring(statusIndex-1, statusIndex + 3);  // Get the boolean value
        Serial.print(statusValue);
        // If status is "true", turn on the LED, otherwise turn it off
        if (statusValue == "true") {
          digitalWrite(led_ALL, HIGH);  // Turn the LED on
          Serial.println("LED is ON");
        } else {
          digitalWrite(led_ALL, LOW);   // Turn the LED off
          Serial.println("LED is OFF");
        }
      }
       if (message.indexOf("\"type\":\"plate-entry\"") >= 0) {
        // Extract the plate number and time from the message
        int plateIndex = message.indexOf("\"plateNumber\":\"") + 15;
        int plateEndIndex = message.indexOf("\"", plateIndex);
        String plateNumber = message.substring(plateIndex, plateEndIndex);
        
        int timeIndex = message.indexOf("\"time\":\"") + 8;
        int timeEndIndex = message.indexOf("\"", timeIndex);
        String entryTime = message.substring(timeIndex, timeEndIndex);
        
        // Display on LCD
        lcd.clear();
        lcd.setCursor(0, 0);
        lcd.print("Plate: " + plateNumber);
        lcd.setCursor(0, 1);
        lcd.print("Time: " + entryTime);
        
        Serial.println("Detected plate: " + plateNumber);
        Serial.println("Entry time: " + entryTime);
        
        // Wait a few seconds before returning to normal display
        delay(1000);
      }
      if (message.indexOf("\"type\":\"plate-exit\"") >= 0) {
        // Extract information from the message
        int plateIndex = message.indexOf("\"plateNumber\":\"") + 15;
        int plateEndIndex = message.indexOf("\"", plateIndex);
        String plateNumber = message.substring(plateIndex, plateEndIndex);
        
        int feeIndex = message.indexOf("\"fee\":") + 6;
        int feeEndIndex = message.indexOf("}", feeIndex);
        if (message.indexOf(",", feeIndex) > 0 && message.indexOf(",", feeIndex) < feeEndIndex) {
          feeEndIndex = message.indexOf(",", feeIndex);
        }
        String fee = message.substring(feeIndex, feeEndIndex);
        
        // Display on LCD
        lcd.clear();
        lcd.setCursor(0, 0);
        lcd.print("Exit: " + plateNumber);
        lcd.setCursor(0, 1);
        lcd.print("Fee: " + fee);
        
        Serial.println("Exit plate: " + plateNumber);
        Serial.println("Fee: " + fee);
        
        // Wait before returning to normal display
        delay(1000);
      }
      break;
    case WStype_ERROR:
      Serial.println("WebSocket error");
      break;
  }
}