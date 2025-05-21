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
#define CAR_SLOT2 3
#define IR_park2_S1 32
#define led_park2_L1 14
#define IR_park2_S2 27
#define led_park2_L2 26
#define IR_park2_S3 25
#define led_park2_L3 33

WebSocketsClient webSocket;
LiquidCrystal_I2C lcd1(0x27, 16, 2);
LiquidCrystal_I2C lcd2(0x27, 16, 2);
LiquidCrystal_I2C lcd3(0x27, 16, 2);

void TCA9548A(uint8_t bus) {
  Wire.beginTransmission(0x70);
  Wire.write(1 << bus);
  Wire.endTransmission();
}

const char* ssid = "minhduc03";
const char* password = "duc23102003";
short gsArray_Sensor[CAR_SLOT] = {IR_CAR1, IR_CAR2, IR_CAR3, IR_CAR4};
short gsArray_LED[CAR_SLOT] = {led_CAR1, led_CAR2, led_CAR3, led_CAR4};
short gsArray_Sensor2[CAR_SLOT2] = {IR_park2_S1, IR_park2_S2, IR_park2_S3};
short gsArray_LED2[CAR_SLOT2] = {led_park2_L1, led_park2_L2, led_park2_L3};
const char* websocket_server = "vuondaoduc.io.vn";
const int websocket_port = 8080;

void vLCD_Display(short sCar_Slot, unsigned short sArray_Sensor[]) {
  TCA9548A(4);
  lcd1.clear();
  lcd1.setCursor(0, 0);
  lcd1.print("Slots:");
  int availableSlots = 0;
  for(int i = 0; i < CAR_SLOT; i++) {
    if(!sArray_Sensor[i]) availableSlots++;
  }
  lcd1.print(availableSlots);
  lcd1.print(" S1:");
  lcd1.print(sArray_Sensor[0] ? "F" : "E");

  lcd1.setCursor(0, 1);
  lcd1.print("S2:");
  lcd1.print(sArray_Sensor[1] ? "F" : "E");
  lcd1.print(" S3:");
  lcd1.print(sArray_Sensor[2] ? "F" : "E");
  lcd1.print(" S4:");
  lcd1.print(sArray_Sensor[3] ? "F" : "E");
}

void vLCD_Display2(short sCar_Slot2, unsigned short sArray_Sensor[]) {
  TCA9548A(5);
  lcd3.clear();
  lcd3.setCursor(0, 0);
  lcd3.print("Slots:");
  int availableSlots = 0;
  for(int i = 0; i < CAR_SLOT2; i++) {
    if(!sArray_Sensor[i]) availableSlots++;
  }
  lcd3.print(availableSlots);
  lcd3.print(" S1:");
  lcd3.print(sArray_Sensor[0] ? "F" : "E");

  lcd3.setCursor(0, 1);
  lcd3.print("S2:");
  lcd3.print(sArray_Sensor[1] ? "F" : "E");
  lcd3.print(" S3:");
  lcd3.print(sArray_Sensor[2] ? "F" : "E");
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
  pinMode(IR_park2_S1, INPUT_PULLUP);
  pinMode(IR_park2_S2, INPUT_PULLUP);
  pinMode(IR_park2_S3, INPUT_PULLUP);
  pinMode(led_park2_L1, OUTPUT);
  pinMode(led_park2_L2, OUTPUT);
  pinMode(led_park2_L3, OUTPUT);
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
  
  TCA9548A(4);
  lcd1.init();
  lcd1.backlight();
  lcd1.clear();
  lcd1.setCursor(0, 0);
  lcd1.print("LCD 1 Initialized");
  
  TCA9548A(6);
  lcd2.init();
  lcd2.backlight();
  lcd2.clear();
  lcd2.setCursor(0, 0);
  lcd2.print("Smart Parking");
  lcd2.setCursor(0, 1);
  lcd2.print("Drive safely!");
  
  TCA9548A(5);
  lcd3.init();
  lcd3.backlight();
  lcd3.clear();
  lcd3.setCursor(0, 0);
  lcd3.print("LCD 3 Initialized");
  
  Serial.print("ESP8266 MAC Address: ");
  Serial.println(WiFi.macAddress());
  webSocket.begin(websocket_server, websocket_port);
  webSocket.onEvent(webSocketEvent);
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
  
  vLCD_Display(sCar_Slot, usSensorStatus);
  unsigned short usSensorStatus2[CAR_SLOT2] = {0, 0, 0};
  short sCar_Slot2 = CAR_SLOT2;
  
  for(short i = 0; i < CAR_SLOT2; i++) {
    usSensorStatus2[i] = sIR_Detect(gsArray_Sensor2[i]);
    if (usSensorStatus2[i] == 1) {
      digitalWrite(gsArray_LED2[i], HIGH);
    } else {
      digitalWrite(gsArray_LED2[i], LOW);
    }
  }
  
  statusMessage += "],\"slots2\":[";
  for (short i = 0; i < CAR_SLOT2; i++) {
    statusMessage += String(usSensorStatus2[i]);
    if (i < CAR_SLOT2 - 1) {
      statusMessage += ",";
    }
  }
  statusMessage += "]}";
  
  webSocket.sendTXT(statusMessage);
  vLCD_Display2(sCar_Slot2, usSensorStatus2);  
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
      
      if (message.indexOf("\"type\":\"light-status\"") >= 0 && message.indexOf("\"lightStatus\":") >= 0) {
        int statusIndex = message.indexOf("\"lightStatus\":") + 15;
        String statusValue = message.substring(statusIndex-1, statusIndex + 3);
        Serial.print(statusValue);
        
        if (statusValue == "true") {
          digitalWrite(led_ALL, HIGH);
          Serial.println("LED is ON");
        } else {
          digitalWrite(led_ALL, LOW);
          Serial.println("LED is OFF");
        }
      }
      
      if (message.indexOf("\"type\":\"plate-entry\"") >= 0) {
        int plateIndex = message.indexOf("\"plateNumber\":\"") + 15;
        int plateEndIndex = message.indexOf("\"", plateIndex);
        String plateNumber = message.substring(plateIndex, plateEndIndex);
        
        int timeIndex = message.indexOf("\"time\":\"") + 8; 
        int timeEndIndex = message.indexOf("\"", timeIndex);
        String entryTime = message.substring(timeIndex, timeEndIndex);
        
        TCA9548A(4);
        lcd1.clear();
        lcd1.setCursor(0, 0);
        lcd1.print("Plate: " + plateNumber);
        lcd1.setCursor(0, 1);
        lcd1.print("Time: " + entryTime);
        
        Serial.println("Detected plate: " + plateNumber);
        Serial.println("Entry time: " + entryTime);
        
        delay(10000);
      }
      
      if (message.indexOf("\"type\":\"plate-exit\"") >= 0) {
        int plateIndex = message.indexOf("\"plateNumber\":\"") + 15;
        int plateEndIndex = message.indexOf("\"", plateIndex);
        String plateNumber = message.substring(plateIndex, plateEndIndex);
        
        int feeIndex = message.indexOf("\"fee\":") + 6;
        int feeEndIndex = message.indexOf(",", feeIndex);
        String fee = message.substring(feeIndex, feeEndIndex);

        int paymentStatusIndex = message.indexOf("\"paymentStatus\":\"") + 17;
        int paymentStatusEndIndex = message.indexOf("\"", paymentStatusIndex);
        String paymentStatus = message.substring(paymentStatusIndex, paymentStatusEndIndex);
        
        TCA9548A(6);
        lcd2.clear();
        lcd2.setCursor(0, 0);
        lcd2.print("Exit: " + plateNumber);
        lcd2.setCursor(0, 1);
        lcd2.print("Fee: " + fee + " " + paymentStatus);
        
        Serial.println("Exit plate: " + plateNumber);
        Serial.println("Fee: " + fee);
        Serial.println("Payment Status: " + paymentStatus);
        
        delay(10000);
        lcd2.clear();
        lcd2.setCursor(0, 0);
        lcd2.print("Smart Parking");
        lcd2.setCursor(0, 1);
        lcd2.print("Drive safely!");
      }
      
      if(message.indexOf("\"type\":\"plate-in-not-found\"") >= 0) {
        int timeIndex = message.indexOf("\"time\":\"") + 8; 
        int timeEndIndex = message.indexOf("\"", timeIndex);
        String entryTime = message.substring(timeIndex, timeEndIndex);
        
        TCA9548A(4);
        lcd1.clear();
        lcd1.setCursor(0, 0);
        lcd1.print("Not Found plate");
        lcd1.setCursor(0, 1);
        lcd1.print("Time: " + entryTime);
        
        delay(2000);
      }
      
      if(message.indexOf("\"type\":\"plate-out-not-found\"") >= 0) {
        int timeIndex = message.indexOf("\"time\":\"") + 8; 
        int timeEndIndex = message.indexOf("\"", timeIndex);
        String entryTime = message.substring(timeIndex, timeEndIndex);
        
        TCA9548A(6);
        lcd2.clear();
        lcd2.setCursor(0, 0);
        lcd2.print("Not Found plate");
        lcd2.setCursor(0, 1);
        lcd2.print("Time: " + entryTime);
        
        delay(2000);
        lcd2.clear();
        lcd2.setCursor(0, 0);
        lcd2.print("Smart Parking");
        lcd2.setCursor(0, 1);
        lcd2.print("Drive safely!");
      }
      break;
      
    case WStype_ERROR:
      Serial.println("WebSocket error");
      break;
  }
}
