

#include <Wire.h>              //for ESP8266 use bug free i2c driver https://github.com/enjoyneering/ESP8266-I2C-Driver
#include <LiquidCrystal_I2C.h>
#include <EEPROM.h>

#define COLUMS           16
#define ROWS             4

#define LCD_SPACE_SYMBOL 0x20  //space symbol from the LCD ROM, see p.9 of GDM2004D datasheet

#define START_SYMB "["
#define FINISH_SYMB "]"
#define STR_END_SYMB "!"
#define LED_PIN PD3
#define PIR_PIN PD2
LiquidCrystal_I2C lcd(PCF8574_ADDR_A21_A11_A01, 4, 5, 6, 16, 11, 12, 13, 14, POSITIVE);

String input;
bool first = false;

// Variables will change:
int lcdState = -1;             // ledState used to set the LED
int newLcdState = -2;   


unsigned long previousMillis = 0;        
unsigned long movementTimeOff = 0; 

int alarmInterval = 0;
int moveLightTime = 0;

#define MEM_DISPLAY     0
#define MEM_BLINK       1
#define MEM_CURSOR      2
#define MEM_SCROLL      3
#define MEM_LIGHT       4

#define MEM_BRIGHT      10
#define MEM_BLINK_TIME  12
#define MEM_LIGHT_TIME  14


void printUART(String text, int time = 0) {
  Serial.print(text);
  if (time) {
    delay(time);
  }
}


void pirAction() {
  bool state = digitalRead(PIR_PIN);
  if (state == HIGH) {
    if ( moveLightTime > 0) {
      newLcdState = HIGH;//lcd.backlight();
    }
    printUART("k1", 0);
    movementTimeOff = 0;
  }
  else {
    //newLcdState = LOW;//lcd.noBacklight();
    printUART("k0", 0);
    if ( moveLightTime > 0) {
      unsigned long adjustS = moveLightTime * 100;
      unsigned long adjustF = adjustS * 10;
      movementTimeOff = millis() + adjustF;
    }
  }
}

void setModeLight(int mode) {
  if (mode == 1) {
    lcd.backlight();
    printUART("l1");
  }
  else if (mode == 0) {
    lcd.noBacklight();
    printUART("l0");
  }
  if ((mode == 0 || mode == 1 ) && EEPROM.read(MEM_LIGHT) != mode) {
    bool newMode = false;
    if (mode) newMode = true;
    EEPROM.write(MEM_LIGHT, newMode);
  }
}

void setModeCursor(int mode) {
  if (mode == 1) {
    lcd.cursor();
    printUART("w1");
  }
  else if (mode == 0) {
    lcd.noCursor();
    printUART("w0");
  }
  if ((mode == 0 || mode == 1 ) && EEPROM.read(MEM_CURSOR) != mode) {
    bool newMode = false;
    if (mode) newMode = true;
    EEPROM.write(MEM_CURSOR, newMode);
  }
}

void setModeScroll(int mode) {
  if (mode == 1) {
    lcd.autoscroll();
    printUART("s1");
  }
  else if (mode == 0) {
    lcd.noAutoscroll();
    printUART("s0");
  }
  if ((mode == 0 || mode == 1 ) && EEPROM.read(MEM_SCROLL) != mode) {
    bool newMode = false;
    if (mode) newMode = true;
    EEPROM.write(MEM_SCROLL, newMode);
  }
}

void setModeBlink(int mode) {
  if (mode == 1) {
    lcd.blink();
    printUART("q1");
  }
  else if (mode == 0) {
    lcd.noBlink();
    printUART("q0");
  }
  if ((mode == 0 || mode == 1 ) && EEPROM.read(MEM_BLINK) != mode) {
    bool newMode = false;
    if (mode) newMode = true;
    EEPROM.write(MEM_BLINK, newMode);
  }
}

void setModeDisplay(int mode) {
  if (mode == 1) {
    lcd.displayOn();
    printUART("d1");
  }
  else if (mode == 0) {
    lcd.displayOff();
    printUART("d0");
  }
  if ((mode == 0 || mode == 1 ) && EEPROM.read(MEM_DISPLAY) != mode) {
    bool newMode = false;
    if (mode) newMode = true;
    EEPROM.write(MEM_DISPLAY, newMode);
  }
}

void setValBrightness(int val) {
  if (val >= 0 && val < 256) {
    lcd.setBrightness(LED_PIN,val,POSITIVE);
    printUART("b"+String(val));
    if ((EEPROM.read(MEM_BRIGHT)*100 + EEPROM.read(MEM_BRIGHT+1)) != val) {
      EEPROM.write(MEM_BRIGHT, val / 100);
      EEPROM.write(MEM_BRIGHT+1, val % 100);
    }
  }
}

void setValAlarmInterval(int val) {
  if (val >= 0 && val < 301) {
    alarmInterval = val;
    printUART("a"+String(val));
    if (val == 0) {
      setModeLight(EEPROM.read(MEM_LIGHT));
    }
    if ((EEPROM.read(MEM_BLINK_TIME)*100 + EEPROM.read(MEM_BLINK_TIME+1)) != val) {
      EEPROM.write(MEM_BLINK_TIME, val / 100);
      EEPROM.write(MEM_BLINK_TIME+1, val % 100);
    }
  }
}

void setValMoveLightTime(int val) {
  if (val >= 0 && val < 301) {
    moveLightTime = val;
    printUART("p"+String(val));
    if ((EEPROM.read(MEM_LIGHT_TIME)*100 + EEPROM.read(MEM_LIGHT_TIME+1)) != val) {
      EEPROM.write(MEM_LIGHT_TIME, val / 100);
      EEPROM.write(MEM_LIGHT_TIME+1, val % 100);
    }
  }
}

void setup() {
  Serial.begin(9600);
  
  Serial.setTimeout(50); // about 1mS/char at 9600baud

  input.reserve(80); // expected line size, see Taming Arduino Strings
  // https://www.forward.com.au/pfod/ArduinoProgramming/ArduinoStrings/index.html


  while (lcd.begin(COLUMS, ROWS) != 1)
  { 
    printUART("e0"); //ERROR LCD CONNECT
    delay(10000);   
  }
  
  lcd.setCursor(2, 1);  
  lcd.print(F("Waiting for"));  
  lcd.setCursor(1, 2);  
  lcd.print(F("Zigbee command"));  //(F()) saves string to flash & keeps dynamic memory fre

  delay(3000); 

  setModeDisplay(EEPROM.read(MEM_DISPLAY));
  setModeLight(EEPROM.read(MEM_LIGHT));
  setModeBlink(EEPROM.read(MEM_BLINK));
  setModeCursor(EEPROM.read(MEM_CURSOR));
  setModeScroll(EEPROM.read(MEM_SCROLL));
  
  
  setValBrightness(EEPROM.read(MEM_BRIGHT)*100 + EEPROM.read(MEM_BRIGHT+1));
  setValAlarmInterval(EEPROM.read(MEM_BLINK_TIME)*100 + EEPROM.read(MEM_BLINK_TIME+1));
  setValMoveLightTime(EEPROM.read(MEM_LIGHT_TIME)*100 + EEPROM.read(MEM_LIGHT_TIME+1));
  //lcd.setBrightness(LED_PIN,255,POSITIVE);

  

  printUART("c0");    //to do - replace c1/c0 with something else


  printUART("m1"); //lcd ok and ready


  pinMode(PIR_PIN, INPUT);
  digitalWrite(PIR_PIN, LOW);
  // Attach an interrupt to the ISR vector
  attachInterrupt(digitalPinToInterrupt(PIR_PIN), pirAction, CHANGE);

/*
  lcd.setCursor(2, 1);  
  lcd.print(F("Привет друг"));  
  lcd.setCursor(1, 2);  
  lcd.print(F("Зигбии бля"));  //(F()) saves string to flash & keeps dynamic memory fre
  // устанавливаем 1 станицу знакогенератора
  lcd.send(0, 0x2A, 4);
  delay(1000);
  lcd.send(0, 0x28, 4);
  delay(1000);
  lcd.send(0, 0x2A, 8);
  delay(1000);
  lcd.send(0, 0x28, 8);
  delay(1000);
  */
}




int readCmdArg(String cmd, String cmd_txt, int min_val, int max_val, int diff = 0) {
  int cmd_index = cmd.indexOf(cmd_txt);
  int arg_id = min_val - 1;
  if (cmd_index > -1) {
    if (cmd_txt == "c" || cmd_txt == "b" || cmd_txt == "a" || cmd_txt == "p") {
      String char2nd = cmd.substring(cmd_index+2,cmd_index+3);
      int int2nd = char2nd[0]-'0';
      if (int2nd > -1 && int2nd < 10) {
        String char3rd = cmd.substring(cmd_index+3,cmd_index+4);
        int int3rd = char3rd[0]-'0';
        if (int3rd > -1 && int3rd < 10) {
          arg_id = cmd.substring(cmd_index+1,cmd_index+2).toInt()*100 + int2nd*10 + int3rd - diff;
        }
        else {
          arg_id = cmd.substring(cmd_index+1,cmd_index+2).toInt()*10 + int2nd - diff;
        }
      }
      else {
        arg_id = cmd.substring(cmd_index+1,cmd_index+2).toInt()-diff;
      }
    }
    else { 
      arg_id = cmd.substring(cmd_index+1,cmd_index+2).toInt()-diff;
    }
    
    if (arg_id > min_val && arg_id < max_val) {
      return arg_id;
    }
    else {
      printUART("e1"+cmd_txt); //ERROR arg id
      return min_val+1;
    }
  }
  else {
    return min_val+1; //ERROR cmd id
  }
  
}

bool printLCD(String text, int col = 0, int row = 0) {
  if (text.length() > 0)  {
    if (first == false) {
      first = true;
      lcd.clear();
    }
    if (col >= 0 && row >= 0) {
      lcd.setCursor(col, row);
    }
    if (lcd.print(text)) {
      printUART("m1"); //msg pring ok
      return true;
    }
    else {
      printUART("e0"); //ERROR LCD CONNECT
      return false;
    }
  }
  else {
    printUART("m0"); //no msg text
  }
}

void loop() {

  unsigned long currentMillis = millis();
  if (currentMillis - previousMillis >= alarmInterval*100 && alarmInterval > 0) {
    previousMillis = currentMillis;

    if (lcdState == LOW) {
      lcdState = HIGH;
      lcd.noBacklight();
    } else {
      lcdState = LOW;
      lcd.backlight();
    }
  }

  else if (alarmInterval == 0 && newLcdState != lcdState) {
    //Serial.println(' ');
    //Serial.println("trd 0");
    if (newLcdState == HIGH) {
      lcd.backlight();
      lcdState = HIGH;
      printUART("l1");
    } else {
      lcd.noBacklight();
      lcdState = LOW;
      printUART("l0");
      newLcdState = LOW;
    }
  }

  if (lcdState == HIGH && moveLightTime > 0 && currentMillis >= movementTimeOff && movementTimeOff > 0) {
    newLcdState = LOW;
    movementTimeOff = 0;
    //Serial.println(' ');
    //Serial.println("trd 1");
  }

  while (Serial.available()) {
    input = Serial.readStringUntil('\n');
    if (input.length() > 0) { 

      //get clear msg  
      if (isspace(input.substring(input.length()-1,input.length())[0])) {
        input = input.substring(0,input.length()-1);
      }    
    

      if (input.startsWith(START_SYMB)) {

        int cmd_finish_id = input.lastIndexOf(FINISH_SYMB);

        if (cmd_finish_id > 0) {
          String cmd = input.substring(1,cmd_finish_id);

          //clear LCD
          if (cmd.indexOf("x") != -1) { 
            lcd.clear();
            printUART("c1"); 
          }

          //get row
          int row_id = readCmdArg(cmd, "r", -1, ROWS, 1);

          //get colum
          int col_id = readCmdArg(cmd, "c", -1, COLUMS, 1);

          //get light
          int light = readCmdArg(cmd, "l", -2, 2);
          if (light == 1) {
            //lcd.backlight();
            newLcdState = HIGH;
            //lcd.setBrightness(LED_PIN,255,POSITIVE);
            //printUART("l1");
          }
          else if (light == 0) {
            //lcd.noBacklight();
            newLcdState = LOW;
            //lcd.setBrightness(LED_PIN,0,POSITIVE);
            //printUART("l0");
          }

          //get brightness
          setValBrightness(readCmdArg(cmd, "b", -2, 256));

          //get alarm_int
          setValAlarmInterval(readCmdArg(cmd, "a", -2, 301));
          
          //get move_light_time
          setValMoveLightTime(readCmdArg(cmd, "p", -2, 301));

          //get scroll
          setModeScroll(readCmdArg(cmd, "s", -2, 2));

          //get cursor
          setModeCursor(readCmdArg(cmd, "w", -2, 2));

          //get blink
          setModeBlink(readCmdArg(cmd, "q", -2, 2));

          //get display
          setModeDisplay(readCmdArg(cmd, "d", -2, 2));


          //lcd.printHorizontalGraph()

          //get text        
          input = input.substring(cmd_finish_id+1,input.length());

          printLCD(input, col_id, row_id);  
          

        }
        else {
          printUART("e2"); //ERROR cmd format
        }
      }
      else {
        printLCD(input, -1, -1);  
      }
    }
  }
}


