#include <WiFi.h>
#include <Wire.h> 
#include <LiquidCrystal_I2C.h>
#include <WebSocketsClient.h>

#define CAR_SLOT 4
#define IR_CAR1 15
#define led_CAR1 2
#define IR_CAR2 4
#define led_CAR2 16
#define IR_CAR3 17
#define led_CAR3 5
#define IR_CAR4 18
#define led_CAR4 19
#define led_ALL 23

WebSocketsClient webSocket;  // WebSocket client object
LiquidCrystal_I2C lcd(0x27, 16, 2);

void TCA9548A(uint8_t bus) {
  Wire.beginTransmission(0x70);  // TCA9548A address
  Wire.write(1 << bus);          // send byte to select bus
  Wire.endTransmission();
  Serial.print(bus);
}

// Replace with your Wi-Fi credentials
const char* ssid = "minhduc03";
const char* password = "duc23102003";
short gsArray_Sensor[CAR_SLOT] = {IR_CAR1, IR_CAR2, IR_CAR3,IR_CAR4};
short gsArray_LED[CAR_SLOT] = {led_CAR1, led_CAR2, led_CAR3,led_CAR4};
const char* websocket_server = "vuondaoduc.io.vn";  // Replace with your Node.js server's IP
const int websocket_port = 8080;  // WebSocket port


void vLCD_Display(short sCar_Slot, unsigned short sArray_Sensor[]) {
  TCA9548A(7);
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Slots:");
  lcd.print(sCar_Slot);
  lcd.print(" S1:");
  lcd.print(sArray_Sensor[0] ? "F" : "E");

  lcd.setCursor(0, 1);
  lcd.print("S2:");
  lcd.print(sArray_Sensor[1] ? "F" : "E");
  lcd.print(" S3:");
  lcd.print(sArray_Sensor[2] ? "F" : "E");
  lcd.print(" S4:");
  lcd.print(sArray_Sensor[3] ? "F" : "E");
}

unsigned short sIR_Detect(short sWhichSensor) {
  if(digitalRead(sWhichSensor) == 0) {
    delay(50);
    if(digitalRead(sWhichSensor) == 0) {
      return 1; 
    } else {
      return 0;
    }
  } else {
    return 0; 
  }
}

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  Wire.begin();
  
  pinMode(IR_CAR1, INPUT_PULLUP);
  pinMode(IR_CAR2, INPUT_PULLUP);
  pinMode(IR_CAR3, INPUT_PULLUP);
  pinMode(IR_CAR4, INPUT_PULLUP);
  pinMode(led_CAR1, OUTPUT);
  pinMode(led_CAR2, OUTPUT);
  pinMode(led_CAR3, OUTPUT);
  pinMode(led_CAR4, OUTPUT);
  pinMode(led_ALL, OUTPUT);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWi-Fi connected");
  
  TCA9548A(7);
  lcd.init();  // Initialize the first LCD
  lcd.backlight();  // Turn on backlight
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("LCD 1 Initialized");
  
  // Init LCD2 on bus number 1
  TCA9548A(6);
  lcd.init();  // Initialize the second LCD
  lcd.backlight();  // Turn on backlight
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Smart Parking");
  lcd.setCursor(0, 1);
  lcd.print("Drive safely!");
  Serial.print("ESP8266 MAC Address: ");
  Serial.println(WiFi.macAddress());
  webSocket.begin(websocket_server, websocket_port);  // Start WebSocket connection
  webSocket.onEvent(webSocketEvent);  // Register the WebSocket event handler
}

void loop() {
  webSocket.loop(); 
  unsigned short usSensorStatus[CAR_SLOT] = {0, 0, 0, 0};
  short sCar_Slot = CAR_SLOT;
  
  for(short i = 0; i < CAR_SLOT; i++) {
    usSensorStatus[i] = sIR_Detect(gsArray_Sensor[i]);
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
        TCA9548A(7);
        lcd.clear();
        lcd.setCursor(0, 0);
        lcd.print("Plate: " + plateNumber);
        lcd.setCursor(0, 1);
        lcd.print("Time: " + entryTime);
        
        Serial.println("Detected plate: " + plateNumber);
        Serial.println("Entry time: " + entryTime);
        
        // Wait a few seconds before returning to normal display
        delay(10000);
      }
      
      if (message.indexOf("\"type\":\"plate-exit\"") >= 0) {
        // Extract information from the message
        int plateIndex = message.indexOf("\"plateNumber\":\"") + 15;
        int plateEndIndex = message.indexOf("\"", plateIndex);
        String plateNumber = message.substring(plateIndex, plateEndIndex);
        
        int feeIndex = message.indexOf("\"fee\":") + 6;
        int feeEndIndex = message.indexOf(",", feeIndex);
        String fee = message.substring(feeIndex, feeEndIndex);

        int paymentStatusIndex = message.indexOf("\"paymentStatus\":\"") + 17;
        int paymentStatusEndIndex = message.indexOf("\"", paymentStatusIndex);
        String paymentStatus = message.substring(paymentStatusIndex, paymentStatusEndIndex);
        
        // Display on LCD
        TCA9548A(6);
        lcd.clear();
        lcd.setCursor(0, 0);
        lcd.print("Exit: " + plateNumber);
        lcd.setCursor(0, 1);
        lcd.print("Fee: " + fee + " " + paymentStatus);
        
        Serial.println("Exit plate: " + plateNumber);
        Serial.println("Fee: " + fee);
        Serial.println("Payment Status: " + paymentStatus);
        
        // Wait before returning to normal display
        delay(10000);
        lcd.clear();
        lcd.setCursor(0, 0);
        lcd.print("Smart Parking");
        lcd.setCursor(0, 1);
        lcd.print("Drive safely!");
      }
      if(message.indexOf("\"type\":\"plate-in-not-found\"") >= 0) {
        // Extract the time from the message
        int timeIndex = message.indexOf("\"time\":\"") + 8; 
        int timeEndIndex = message.indexOf("\"", timeIndex);
        String entryTime = message.substring(timeIndex, timeEndIndex);
        
        // Display on LCD
        TCA9548A(7);
        lcd.clear();
        lcd.setCursor(0, 0);
        lcd.print("Not Found plate");
        lcd.setCursor(0, 1);
        lcd.print("Time: " + entryTime);
        
       
        
        // Wait before returning to normal display
        delay(2000);
      }
      if(message.indexOf("\"type\":\"plate-out-not-found\"") >= 0) {
        // Extract the time from the message
        int timeIndex = message.indexOf("\"time\":\"") + 8; 
        int timeEndIndex = message.indexOf("\"", timeIndex);
        String entryTime = message.substring(timeIndex, timeEndIndex);
        
        // Display on LCD
        TCA9548A(6);
        lcd.clear();
        lcd.setCursor(0, 0);
        lcd.print("Not Found plate");
        lcd.setCursor(0, 1);
        lcd.print("Time: " + entryTime);
        
       
        
        // Wait before returning to normal display
        delay(2000);
        lcd.clear();
        lcd.setCursor(0, 0);
        lcd.print("Smart Parking");
        lcd.setCursor(0, 1);
        lcd.print("Drive safely!");
      }
      break;
      
    case WStype_ERROR:
      Serial.println("WebSocket error");
      break;
  }
}