
# Zigbee LCD 1604

Project to build informer using Arduino with character LCD 16x4 and CC2530/CC2652 for communication over Zigbee network.

![Front view](/images/front_mini.jpeg)

##### Possibilities:
 - send text to a specific line (also can specify column)
 - activate LCD backlight by motion (with delay select)
 - control LCD brightness level and power mode
 - support of Cyrillic and special symbols
 - clean entire LCD with one command
 - select interval for alarm mode (auto backlight blink)
 - change cursor, blink and autoscroll modes
 - all LCD setting stored in Arduino's EEPROM
 - support lots of environment sensors by [PTVO](https://ptvo.info) firmware

![z2m dashboard view](/images/z2m_dash.jpeg)
![z2m device view](/images/z2m_device.jpeg)  

#### Needed parts:
1. Any LCD (compatible with HD44780) with I2C module (PCF8574T) - I used **LC1641** (16x4)
2. Any Arduino or clones - I used **WAVGAT NANO 3.0**
3. Any Zigbee module, which is supported by PTVO firmware - I used **E18-MS1-PCB**
4. *Optional* Any PIR sensor with digital out - I used **HC-SR505**
5. *Optional* Any I2C sensors, which are supported by PTVO firmware- I used **BH1750, BE280, CCS881**

#### Assembly notes:
1. If you Arduino board has TTL-USB converter you need to cutoff RX and TX pins from it.
*You can simply bend the CH340 legs up*  
![Wavgat CH340 cutoff](/images/wavgat_ch340_cutoff.jpeg)
2. According to the specification, to connect CC2530 with Arduino, it is necessary to use level shifters (3.3v vs 5v) but CC2530 is tolerant to 5v, so everything works as it should.
3. **You must add fuses and varistor to AC side of HLK-PM01 for the protection** *You can use DC-DC convertor or USB cable to power up instead of HLK-PM01*

#### Firmware notes:
1. Arduino firmware:
  - to build from sources use [PlatformIO](https://platformio.org/)
  - to upload HEX file use [xLoader](https://github.com/binaryupdates/xLoader)
2. Zigbee firmware
  - to build with your options/sensors use [PTVO firmware builder](https://ptvo.info)
  - to flash hex file use CCDebuger with SmartRF Flash Programmer or visit [this page](https://www.zigbee2mqtt.io/guide/adapters/flashing/alternative_flashing_methods.html) to lookup for alternative methods

#### Schematic
![Schematic](/images/Schematic.png)  

#### PTVO settings
![PTVO settings](/zigbee/ptvo.lcd.jpeg)  

#### Enclose
STL files can be found on [Thingiverse](https://www.thingiverse.com/thing:5412333)

Box | Lid | Legs
:-:|:-:|:-:
![Box STL](https://cdn.thingiverse.com/assets/8f/06/96/98/55/large_display_1604_zigbee_box.png) | ![Lid STL](https://cdn.thingiverse.com/assets/42/3c/57/d9/4c/large_display_1604_zigbee_lid.png) | ![Legs STL](https://cdn.thingiverse.com/assets/b8/eb/7c/9c/5f/large_display_1604_zigbee_legs.png)


#### UART protocol description (Arduino-Zigbee)

| Command     | Direction     | Description                     |
|-------------|---------------|---------------------------------|
| rX          | rx            | set line (1-4)                  |
| cXX         | rx            | set column (1-16)               |
| **Command** | **Direction** | **Description**                 |
| bXXX        | both          | set brightness (0-255)          |
| aXXX        | both          | set alarm_mode_interval (0-300) |
| pXXX        | both          | set move turn on time (0-300)   |
| dX          | both          | turn on/off display (0/1)       |
| lX          | both          | turn on/off backlight (0/1)     |
| qX          | both          | turn on/off blink (0/1)         |
| wX          | both          | turn on/off cursor (0/1)        |
| sX          | both          | turn on/off autoscroll (0/1)    |
| **Command** | **Direction** | **Description**                 |
| kX          | tx            | PIR move/idle (0/1)             |
| mX          | tx            | msg ok/empty (0/1)              |
| e0          | tx            | lcd connect error               |
| e1          | tx            | arg id err                      |
| e2          | tx            | cmd format error                |


### Like ♥️?
[!["Buy Me A Coffee"](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/xyzroe)

