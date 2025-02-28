#include <ESP8266WiFi.h>
#include <espnow.h>
#include <Wire.h> 
#include <LiquidCrystal_I2C.h>
#include <WebSocketsClient.h>
#define CAR_SLOT 3
#define IR_CAR1 16
#define IR_CAR2 2
#define IR_CAR3 14
WebSocketsClient webSocket;  // WebSocket client object
LiquidCrystal_I2C lcd(0x27, 20, 4);
// Replace with your Wi-Fi credentials
const char* ssid = "tang2-2.4";
const char* password = "23102003";
short gsArray_Sensor[CAR_SLOT] = {IR_CAR1, IR_CAR2, IR_CAR3};
const char* websocket_server = "192.168.0.115";  // Replace with your Node.js server's IP
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
      break;
    case WStype_ERROR:
      Serial.println("WebSocket error");
      break;
  }
}