#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include "soc/soc.h"
#include "soc/rtc_cntl_reg.h"
#include "esp_camera.h"
#include <NTPClient.h>
#include <WiFiUdp.h>
#include <ESP32Servo.h>
#include <HTTPClient.h>
#include "esp_timer.h"
#include "img_converters.h"
#include "fb_gfx.h"
#include "esp_http_server.h"
#include <esp_now.h>
#include <WebServer.h>
// WiFi credentials and server information
const char* ssid = "tang2-2.4";             // Replace xxx with your WiFi SSID
const char* password = "23102003";          // Replace xxx with your WiFi Password
String serverName = "www.circuitdigest.cloud";  // Replace with your server domain
String serverPath = "/readnumberplate";         // API endpoint path "/readqrcode" or "/readnumberplate"
const int serverPort = 443;                     // HTTPS port
String apiKey = "QGPtHPHPVP1l";                   // Replace xxx with your API key
String imageViewLink = "https://www.circuitdigest.cloud/static/" + apiKey + ".jpeg";
#define flashLight 4  // GPIO pin for the flashlight
int count = 0;        // Counter for image uploads
WiFiClientSecure client;  // Secure client for HTTPS communication
HTTPClient http;
WebServer server(80);
String serverResponse = "http://192.168.0.115:3000/get-in";  // Variable to store server response
uint8_t receiverMac[] = {0xDC, 0x4F, 0x22, 0x31, 0xBE, 0x63};
// Camera GPIO pins - adjust based on your ESP32-CAM board
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
#define PART_BOUNDARY "123456789000000000000987654321"
#define APP_CPU 1
#define PRO_CPU 0
// Network Time Protocol (NTP) setup
const char* ntpServer = "pool.ntp.org";  // NTP server
const long utcOffsetInSeconds = 19800;   // IST offset (UTC + 5:30)
int servoPin = 14;                      // GPIO pin for the servo motor
int inSensor = 13;                     // GPIO pin for the entry sensor
int outSensor = 15;                    // GPIO pin for the exit sensor
Servo myservo;                         // Servo object
int pos = 0;                           // Variable to hold servo position
// Initialize the NTPClient
WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, ntpServer, utcOffsetInSeconds);
String currentTime = "";
// Web server on port 80

// Variables to hold recognized data, current status, and history
String recognizedPlate = "";          // Variable to store the recognized plate number
String imageLink = "";                // Variable to store the image link
String currentStatus = "Idle";        // Variable to store the current status of the system
int availableSpaces = 4;             // Total parking spaces available
int vehicalCount = 0;                // Number of vehicles currently parked
int barrierDelay = 3000;             // Delay for barrier operations
int siteRefreshTime = 1;             // Web page refresh time in seconds

// History of valid number plates and their entry times
struct PlateEntry {
  String plateNumber;  // Plate number of the vehicle
  String time;        // Entry time of the vehicle
  String type;
};

std::vector<PlateEntry> plateHistory;  // Vector to store the history of valid plates

// Function to extract a JSON string value by key
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
// ===== rtos task handles =========================
// Streaming is implemented with 3 tasks:
TaskHandle_t tMjpeg;   // handles client connections to the webserver
TaskHandle_t tCam;     // handles getting picture frames from the camera and storing them locally
TaskHandle_t tStream;  // actually streaming frames to all connected clients

// frameSync semaphore is used to prevent streaming buffer as it is replaced with the next frame
SemaphoreHandle_t frameSync = NULL;

// Queue stores currently connected clients to whom we are streaming
QueueHandle_t streamingClients = NULL;

// We will try to achieve 25 FPS frame rate
const int FPS = 10;

// We will handle web client requests every 50 ms (20 Hz)
const int WSINTERVAL = 100;


// ======== Server Connection Handler Task ==========================
void mjpegCB(void* pvParameters) {
  TickType_t xLastWakeTime;
  const TickType_t xFrequency = pdMS_TO_TICKS(WSINTERVAL);

  // Creating frame synchronization semaphore and initializing it
  frameSync = xSemaphoreCreateBinary();
  xSemaphoreGive( frameSync );

  // Creating a queue to track all connected clients
  streamingClients = xQueueCreate( 10, sizeof(WiFiClient*) );

  //=== setup section  ==================

  //  Creating RTOS task for grabbing frames from the camera
  xTaskCreatePinnedToCore(
    camCB,        // callback
    "cam",        // name
    4096,         // stacj size
    NULL,         // parameters
    2,            // priority
    &tCam,        // RTOS task handle
    APP_CPU);     // core

  //  Creating task to push the stream to all connected clients
  xTaskCreatePinnedToCore(
    streamCB,
    "strmCB",
    4 * 1024,
    NULL, //(void*) handler,
    2,
    &tStream,
    APP_CPU);

  //  Registering webserver handling routines
  server.on("/mjpeg/1", HTTP_GET, handleJPGSstream);
  server.on("/jpg", HTTP_GET, handleJPG);
  server.onNotFound(handleNotFound);

  //  Starting webserver
  server.begin();

  //=== loop() section  ===================
  xLastWakeTime = xTaskGetTickCount();
  for (;;) {
    server.handleClient();

    //  After every server client handling request, we let other tasks run and then pause
    taskYIELD();
    vTaskDelayUntil(&xLastWakeTime, xFrequency);
  }
}


// Commonly used variables:
volatile size_t camSize;    // size of the current frame, byte
volatile char* camBuf;      // pointer to the current frame


// ==== RTOS task to grab frames from the camera =========================
void camCB(void* pvParameters) {

  TickType_t xLastWakeTime;

  //  A running interval associated with currently desired frame rate
  const TickType_t xFrequency = pdMS_TO_TICKS(1000 / FPS);

  // Mutex for the critical section of swithing the active frames around
  portMUX_TYPE xSemaphore = portMUX_INITIALIZER_UNLOCKED;

  //  Pointers to the 2 frames, their respective sizes and index of the current frame
  char* fbs[2] = { NULL, NULL };
  size_t fSize[2] = { 0, 0 };
  int ifb = 0;

  //=== loop() section  ===================
  xLastWakeTime = xTaskGetTickCount();
for (;;) {
    // Grab a frame from the camera and query its size
    camera_fb_t* fb = esp_camera_fb_get();
    if (!fb) {
      Serial.println("Camera capture failed");
      continue;
    }

    // If frame size is more than we have previously allocated - request 125% of the current frame space
    if (fb->len > fSize[ifb]) {
      fSize[ifb] = fb->len * 4 / 3;
      fbs[ifb] = (char*) realloc(fbs[ifb], fSize[ifb]);
    }

    // Copy current frame into local buffer
    memcpy(fbs[ifb], fb->buf, fb->len);

    // Release the frame buffer
    esp_camera_fb_return(fb);

    // Notify streaming task that the frame is available
    xTaskNotify(tStream, 0, eNoAction);

    // Let other tasks run and wait until the end of the current frame rate interval (if any time left)
    taskYIELD();
    vTaskDelayUntil(&xLastWakeTime, xFrequency);

    // Only switch frames around if no frame is currently being streamed to a client
    // Wait on a semaphore until client operation completes
    xSemaphoreTake(frameSync, portMAX_DELAY);

    // Do not allow interrupts while switching the current frame
    portENTER_CRITICAL(&xSemaphore);
    camBuf = fbs[ifb];
    camSize = fSize[ifb];
    ifb++;
    ifb &= 1;  // this should produce 1, 0, 1, 0, 1 ... sequence
    portEXIT_CRITICAL(&xSemaphore);

    // Let anyone waiting for a frame know that the frame is ready
    xSemaphoreGive(frameSync);

    // Immediately let other (streaming) tasks run
    taskYIELD();

    // If streaming task has suspended itself (no active clients to stream to)
    // there is no need to grab frames from the camera. We can save some juice
    // by suspending the tasks
    if (eTaskGetState(tStream) == eSuspended) {
      vTaskSuspend(NULL);  // passing NULL means "suspend yourself"
    }
  }
 
}


// ==== Memory allocator that takes advantage of PSRAM if present =======================
char* allocateMemory(char* aPtr, size_t aSize) {

  //  Since current buffer is too smal, free it
  if (aPtr != NULL) free(aPtr);


  size_t freeHeap = ESP.getFreeHeap();
  char* ptr = NULL;

  // If memory requested is more than 2/3 of the currently free heap, try PSRAM immediately
  if ( aSize > freeHeap * 2 / 3 ) {
    if ( psramFound() && ESP.getFreePsram() > aSize ) {
      ptr = (char*) ps_malloc(aSize);
    }
  }
  else {
    //  Enough free heap - let's try allocating fast RAM as a buffer
    ptr = (char*) malloc(aSize);

    //  If allocation on the heap failed, let's give PSRAM one more chance:
    if ( ptr == NULL && psramFound() && ESP.getFreePsram() > aSize) {
      ptr = (char*) ps_malloc(aSize);
    }
  }

  // Finally, if the memory pointer is NULL, we were not able to allocate any memory, and that is a terminal condition.
  if (ptr == NULL) {
    ESP.restart();
  }
  return ptr;
}


// ==== STREAMING ======================================================
const char HEADER[] = "HTTP/1.1 200 OK\r\n" \
                      "Access-Control-Allow-Origin: *\r\n" \
                      "Content-Type: multipart/x-mixed-replace; boundary=123456789000000000000987654321\r\n";
const char BOUNDARY[] = "\r\n--123456789000000000000987654321\r\n";
const char CTNTTYPE[] = "Content-Type: image/jpeg\r\nContent-Length: ";
const int hdrLen = strlen(HEADER);
const int bdrLen = strlen(BOUNDARY);
const int cntLen = strlen(CTNTTYPE);


// ==== Handle connection request from clients ===============================
void handleJPGSstream(void)
{
  //  Can only acommodate 10 clients. The limit is a default for WiFi connections
  if ( !uxQueueSpacesAvailable(streamingClients) ) return;


  //  Create a new WiFi Client object to keep track of this one
  WiFiClient* client = new WiFiClient();
  *client = server.client();

  //  Immediately send this client a header
  client->write(HEADER, hdrLen);
  client->write(BOUNDARY, bdrLen);

  // Push the client to the streaming queue
  xQueueSend(streamingClients, (void *) &client, 0);

  // Wake up streaming tasks, if they were previously suspended:
  if ( eTaskGetState( tCam ) == eSuspended ) vTaskResume( tCam );
  if ( eTaskGetState( tStream ) == eSuspended ) vTaskResume( tStream );
}


// ==== Actually stream content to all connected clients ========================
void streamCB(void * pvParameters) {
  char buf[16];
  TickType_t xLastWakeTime;
  TickType_t xFrequency;

  //  Wait until the first frame is captured and there is something to send
  //  to clients
  ulTaskNotifyTake( pdTRUE,          /* Clear the notification value before exiting. */
                    portMAX_DELAY ); /* Block indefinitely. */

  xLastWakeTime = xTaskGetTickCount();
  for (;;) {
    // Default assumption we are running according to the FPS
    xFrequency = pdMS_TO_TICKS(1000 / FPS);

    //  Only bother to send anything if there is someone watching
    UBaseType_t activeClients = uxQueueMessagesWaiting(streamingClients);
    if ( activeClients ) {
      // Adjust the period to the number of connected clients
      xFrequency /= activeClients;

      //  Since we are sending the same frame to everyone,
      //  pop a client from the the front of the queue
      WiFiClient *client;
      xQueueReceive (streamingClients, (void*) &client, 0);

      //  Check if this client is still connected.

      if (!client->connected()) {
        //  delete this client reference if s/he has disconnected
        //  and don't put it back on the queue anymore. Bye!
        delete client;
      }
      else {

        //  Ok. This is an actively connected client.
        //  Let's grab a semaphore to prevent frame changes while we
        //  are serving this frame
        xSemaphoreTake( frameSync, portMAX_DELAY );

        client->write(CTNTTYPE, cntLen);
        sprintf(buf, "%d\r\n\r\n", camSize);
        client->write(buf, strlen(buf));
        client->write((char*) camBuf, (size_t)camSize);
        client->write(BOUNDARY, bdrLen);

        // Since this client is still connected, push it to the end
        // of the queue for further processing
        xQueueSend(streamingClients, (void *) &client, 0);

        //  The frame has been served. Release the semaphore and let other tasks run.
        //  If there is a frame switch ready, it will happen now in between frames
        xSemaphoreGive( frameSync );
        taskYIELD();
      }
    }
    else {
      //  Since there are no connected clients, there is no reason to waste battery running
      vTaskSuspend(NULL);
    }
    //  Let other tasks run after serving every client
    taskYIELD();
    vTaskDelayUntil(&xLastWakeTime, xFrequency);
  }
}



const char JHEADER[] = "HTTP/1.1 200 OK\r\n" \
                       "Content-disposition: inline; filename=capture.jpg\r\n" \
                       "Content-type: image/jpeg\r\n\r\n";
const int jhdLen = strlen(JHEADER);

// ==== Serve up one JPEG frame =============================================
void handleJPG(void)
{

  WiFiClient client = server.client();

  if (!client.connected()) return;
  camera_fb_t* fb = esp_camera_fb_get();
  if (!fb) {
    Serial.println("Camera capture failed");
    return;
  }
  client.write(JHEADER, jhdLen);
  client.write((char*)fb->buf, fb->len);
  esp_camera_fb_return(fb);
}


// ==== Handle invalid URL requests ============================================
void handleNotFound()
{
  String message = "Server is running!\n\n";
  message += "URI: ";
  message += server.uri();
  message += "\nMethod: ";
  message += (server.method() == HTTP_GET) ? "GET" : "POST";
  message += "\nArguments: ";
  message += server.args();
  message += "\n";
  server.send(200, "text / plain", message);
}

void OnDataSent(const uint8_t *mac_addr, esp_now_send_status_t status) {
  Serial.println(status == ESP_NOW_SEND_SUCCESS ? "Sent successfully" : "Failed");
}
// Function to handle the root web page





// Function to handle image capture trigger
void handleTrigger() {
  currentStatus = "Capturing Image";
  // server.sendHeader("Location", "/");  // Redirect to root to refresh status
  // server.send(303);                    // Send redirect response to refresh the page

  // Perform the image capture and upload
  int status = sendPhoto();

  // Update status based on sendPhoto result
  if (status == -1) {
    currentStatus = "Image Capture Failed";
  } else if (status == -2) {
    currentStatus = "Server Connection Failed";
  } else if (status == 1) {
    currentStatus = "No Parking Space Available";
  } else if (status == 2) {
    currentStatus = "Invalid Plate Recognized [No Entry]";
  } else {
    currentStatus = "Idle";
  }
}

void openBarrier() {
  currentStatus = "Barrier Opening";
  Serial.println("Barrier Opens");
  myservo.write(0);
  delay(barrierDelay);
}
void closeBarrier() {
  currentStatus = "Barrier Closing";
  Serial.println("Barrier Closes");
  myservo.write(180);
  delay(barrierDelay);
}

// Function to capture and send photo to the server
int sendPhoto() {
  camera_fb_t* fb = NULL;

  // Turn on flashlight and capture image
  // digitalWrite(flashLight, HIGH);
    if (tStream != NULL) vTaskSuspend(tStream);
  if (tCam != NULL) vTaskSuspend(tCam);
  delay(300);
  fb = esp_camera_fb_get();
  delay(300);

  // digitalWrite(flashLight, LOW);
  if (!fb) {
    Serial.println("Camera capture failed");
    currentStatus = "Image Capture Failed";
    return -1;
  }

  // Connect to server
  Serial.println("Connecting to server:" + serverName);
  client.setInsecure();  // Skip certificate validation for simplicity

  if (client.connect(serverName.c_str(), serverPort)) {
    Serial.println("Connection successful!");

    // Increment count and prepare file name
    count++;
    Serial.println(count);
    String filename = apiKey + ".jpeg";

    // Prepare HTTP POST request
    String head = "--CircuitDigest\r\nContent-Disposition: form-data; name=\"imageFile\"; filename=\"" + filename + "\"\r\nContent-Type: image/jpeg\r\n\r\n";
    String tail = "\r\n--CircuitDigest--\r\n";
    uint32_t imageLen = fb->len;
    uint32_t extraLen = head.length() + tail.length();
    uint32_t totalLen = imageLen + extraLen;

    client.println("POST " + serverPath + " HTTP/1.1");
    client.println("Host: " + serverName);
    client.println("Content-Length: " + String(totalLen));
    client.println("Content-Type: multipart/form-data; boundary=CircuitDigest");
    client.println("Authorization:" + apiKey);
    client.println();
    client.print(head);

    // Send the image
    currentStatus = "Uploading Image";

    // Send image data in chunks
    uint8_t* fbBuf = fb->buf;
    size_t fbLen = fb->len;
    for (size_t n = 0; n < fbLen; n += 1024) {
      if (n + 1024 < fbLen) {
        client.write(fbBuf, 1024);
        fbBuf += 1024;
      } else {
        size_t remainder = fbLen % 1024;
        client.write(fbBuf, remainder);
      }
    }


    client.print(tail);

    // Release the frame buffer
    esp_camera_fb_return(fb);
    Serial.println("Image sent successfully");

    // Waiting for server response
    currentStatus = "Waiting for Server Response";

    String response = "";
    long startTime = millis();
    while (client.connected() && millis() - startTime < 10000) {
      if (client.available()) {
        char c = client.read();
        response += c;
      }
    }



    // Extract data from response
    recognizedPlate = extractJsonStringValue(response, "\"number_plate\"");
    imageLink = extractJsonStringValue(response, "\"view_image\"");

    currentStatus = "Response Recieved Successfully";


    // Add valid plate to history
    if (vehicalCount > availableSpaces) {

      // Log response and return
      Serial.print("Response: ");
      Serial.println(response);
      client.stop();
      esp_camera_fb_return(fb);
      return 1;

    } else if (recognizedPlate.length() > 4 && recognizedPlate.length() < 11) {
      // Valid plate
      PlateEntry newEntry;
      newEntry.plateNumber = recognizedPlate ;
      newEntry.time = currentTime;  // Use the current timestamp
      newEntry.type= "Entry";
      plateHistory.push_back(newEntry);
      vehicalCount++;
      String data = recognizedPlate + "|" + currentTime;
     esp_err_t result = esp_now_send(receiverMac, (uint8_t*)data.c_str(), data.length());
     http.begin(serverResponse.c_str()); 
    Serial.println("Connecting to server:" + serverResponse);
    http.addHeader("Content-Type", "application/json");
    String jsonData = "{\"plateNumber\":\"" + newEntry.plateNumber + "\",\"time\":\"" + newEntry.time + "\",\"type\":\"" + newEntry.type + "\"}";
    int httpResponseCode = http.POST(jsonData);
    
    if (httpResponseCode > 0) {
      Serial.print("HTTP Response code: ");
      Serial.println(httpResponseCode);
    } else {
      Serial.print("Error code: ");
      Serial.println(httpResponseCode);
    }
    http.end();
      openBarrier();
      delay(barrierDelay);
      closeBarrier();

      // Log response and return
      Serial.print("Response: ");
      Serial.println(response);
      client.stop();
      esp_camera_fb_return(fb);
            if (tStream != NULL) vTaskResume(tStream);
      if (tCam != NULL) vTaskResume(tCam);
      return 0;

    } else {
      currentStatus = "Invalid Plate Recognized '" + recognizedPlate + "' " + "[No Entry]";
      // Log response and return
      Serial.print("Response: ");
      Serial.println(response);
      client.stop();
      esp_camera_fb_return(fb);
            if (tStream != NULL) vTaskResume(tStream);
      if (tCam != NULL) vTaskResume(tCam);
      return 2;
    }


  } else {
    Serial.println("Connection to server failed");
    esp_camera_fb_return(fb);
          if (tStream != NULL) vTaskResume(tStream);
      if (tCam != NULL) vTaskResume(tCam);
    return -2;
  }
}

void setup() {
  // Disable brownout detector
  WRITE_PERI_REG(RTC_CNTL_BROWN_OUT_REG, 0);
  Serial.begin(115200);
  pinMode(flashLight, OUTPUT);
  pinMode(inSensor, INPUT_PULLUP);
  pinMode(outSensor, INPUT_PULLUP);
  digitalWrite(flashLight, LOW);

  // Connect to WiFi
  WiFi.mode(WIFI_STA);
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    delay(500);
  }
  Serial.println();
  Serial.print("ESP32-CAM IP Address: ");
  Serial.println(WiFi.localIP());

  // Initialize NTPClient
  timeClient.begin();
  timeClient.update();



  // Configure camera
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

  // Adjust frame size and quality based on PSRAM availability
  if (psramFound()) {
    config.frame_size = FRAMESIZE_HVGA;
    config.jpeg_quality = 10;  // Lower number means higher quality (0-63)
    config.fb_count = 2;
    config.grab_mode = CAMERA_GRAB_WHEN_EMPTY;
    Serial.println("PSRAM found");
  } else {
    config.frame_size = FRAMESIZE_QVGA;
    config.jpeg_quality = 12;  // Lower number means higher quality (0-63)
    config.fb_count = 1;
    config.grab_mode = CAMERA_GRAB_LATEST;
  }

  // Initialize camera
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x", err);
    delay(1000);
    ESP.restart();
  }
  if (esp_now_init() != ESP_OK) {
    Serial.println("ESP-NOW init failed");
    return;
  }

  esp_now_register_send_cb(OnDataSent);

  // Add receiver as peer
  esp_now_peer_info_t peerInfo;
  memcpy(peerInfo.peer_addr, receiverMac, 6);
  peerInfo.channel = WiFi.channel(1); // Use the same channel as Wi-Fi
  peerInfo.encrypt = false;

  if (esp_now_add_peer(&peerInfo) != ESP_OK) {
    Serial.println("Failed to add peer");
    return;
  }

  // Allow allocation of all timers
  ESP32PWM::allocateTimer(0);
  ESP32PWM::allocateTimer(1);
  ESP32PWM::allocateTimer(2);
  ESP32PWM::allocateTimer(3);
  myservo.setPeriodHertz(50);            // standard 50 hz servo
  myservo.attach(servoPin, 1000, 2000);  // attaches the servo on pin 18 to the servo object
    // Set the initial position of the servo (barrier closed)
  myservo.write(180);
 xTaskCreatePinnedToCore(
    mjpegCB,
    "mjpeg",
    4 * 1024,
    NULL,
    2,
    &tMjpeg,
    APP_CPU);
}

void loop() {
  // Update the NTP client to get the current time
  timeClient.update();
  currentTime = timeClient.getFormattedTime();

  // Check the web server for any incoming client requests
  // Send data every 2 seconds


  // Monitor sensor states for vehicle entry/exit
  if (digitalRead(inSensor) == LOW && vehicalCount < availableSpaces) {
    delay(2000);      // delay for vehicle need to be in a position
    handleTrigger();  // Trigger image capture for entry
  }

  if (digitalRead(outSensor) == LOW && vehicalCount > 0) {
    delay(2000);  // delay for vehicle need to be in a position

    openBarrier();
    PlateEntry newExit;
    newExit.plateNumber = "NULL-Exit";
    newExit.time = currentTime;  // Use the current timestamp
    plateHistory.push_back(newExit);
    delay(barrierDelay);
    vehicalCount--;
    closeBarrier();

    currentStatus = "Idle";
  }
}