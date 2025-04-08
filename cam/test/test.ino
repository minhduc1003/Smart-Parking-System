

#include <Wire.h>
#include <LiquidCrystal_I2C.h>

LiquidCrystal_I2C lcd(0x27, 16, 2);  // Changed to match the actual LCD dimensions (16x2)

// Select I2C BUS
void TCA9548A(uint8_t bus) {
  Wire.beginTransmission(0x70);  // TCA9548A address
  Wire.write(1 << bus);          // send byte to select bus
  Wire.endTransmission();
  Serial.print(bus);
}

void setup() {
  Serial.begin(115200);

  // Start I2C communication with the Multiplexer
  Wire.begin();

  // Init LCD1 on bus number 0
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
  lcd.print("LCD 2 Initialized");

  // Add more LCDs or devices as needed, repeating the process
}

void loop() {
  // Countdown on both LCDs from 10 to 0
  for (int count = 10; count >= 0; count--) {
    // Update LCD1 (on bus 7)
    TCA9548A(7);
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("LCD 1 Countdown:");
    lcd.setCursor(0, 1);
    lcd.print(count);
    
    // Update LCD2 (on bus 6)
    TCA9548A(6);
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("LCD 2 Countdown:");
    lcd.setCursor(0, 1);
    lcd.print(count);
    
    delay(1000); // Wait for 1 second
  }
  
  // Display completion message
  TCA9548A(7);
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("LCD 1 Done!");
  
  TCA9548A(6);
  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("LCD 2 Done!");
  
  delay(3000); // Wait before restarting countdown
}

