const zigbeeHerdsmanConverters = require('zigbee-herdsman-converters');

const exposes = zigbeeHerdsmanConverters.exposes;
const ea = exposes.access;
const e = exposes.presets;
const fz = zigbeeHerdsmanConverters.fromZigbeeConverters;
const tz = zigbeeHerdsmanConverters.toZigbeeConverters;

const ptvo_switch = zigbeeHerdsmanConverters.findByDevice({modelID: 'ptvo.switch'});
fz.legacy = ptvo_switch.meta.tuyaThermostatPreset;
fz.ptvo_on_off = {
  cluster: 'genOnOff',
  type: ['attributeReport', 'readResponse'],
  convert: (model, msg, publish, options, meta) => {
      if (msg.data.hasOwnProperty('onOff')) {
          const channel = msg.endpoint.ID;
          const endpointName = `l${channel}`;
          const binaryEndpoint = model.meta && model.meta.binaryEndpoints && model.meta.binaryEndpoints[endpointName];
          const prefix = (binaryEndpoint) ? model.meta.binaryEndpoints[endpointName] : 'state';
          const property = `${prefix}_${endpointName}`;
	  if (binaryEndpoint) {
            return {[property]: msg.data['onOff'] === 1};
          }
          return {[property]: msg.data['onOff'] === 1 ? 'ON' : 'OFF'};
      }
  },
};

const my_tz = {
  lcd_lines: {
        key: ['r1', 'r2', 'r3', 'r4'],
        convertSet: async (entity, key, value, meta) => {
            if (!value) {
                return;
            }
            let text = '[' + key + ']' + value
            let input = text.split("");
            value = [];
            value.push(text.length);
            input.forEach(letter => {
              const alphabet = {
                '⦁': 223,
                '♪': 237,
                '◌': 238,
                '°': 239,
                '§': 253,
                '✖': 213,
                '↑': 218,
                '↓': 217,
                'Ⅱ': 216,
                'Ⅰ': 215,
                '⇤': 219,
                '⇥': 220,
                '■': 255,
                'Ї': 12,
                'ї': 13,
                'І': 73,
                'і': 105,
                'Є': 14,
                'є': 15,
                'А': 65,
                'а': 97,
                'Б': 160,
                'б': 178,
                'В': 66,
                'в': 179,
                'Г': 161,
                'г': 180,
                'Д': 224,
                'д': 227,
                'Е': 69,
                'е': 101,
                'Ё': 162,
                'ё': 181,
                'Ж': 163,
                'ж': 182,
                'З': 164,
                'з': 183,
                'И': 165,
                'и': 184,
                'Й': 166,
                'й': 185,
                'К': 75,
                'к': 186,
                'Л': 167,
                'л': 187,
                'М': 77,
                'м': 188,
                'Н': 72,
                'н': 189,
                'О': 79,
                'о': 111,
                'П': 168,
                'п': 190,
                'Р': 80,
                'р': 112,
                'С': 67,
                'с': 99,
                'Т': 84,
                'т': 191,
                'У': 169,
                'у': 121,
                'Ф': 170,
                'ф': 228,
                'Х': 88,
                'х': 120,
                'Ц': 225,
                'ц': 229,
                'Ч': 171,
                'ч': 192,
                'Ш': 172,
                'ш': 193,
                'Щ': 226,
                'щ': 230,
                'Ъ': 173,
                'ъ': 194,
                'Ы': 174,
                'ы': 195,
                'Ь': 98,
                'ь': 196,
                'Э': 175,
                'э': 197,
                'Ю': 176,
                'ю': 198,
                'Я': 177,
                'я': 199,
              };
              const state = alphabet[letter];
              if (state) {
                value.push(state);
              }
              else {
                value.push(letter.charCodeAt(0));
              }
            });
            const payload = {14: {value, type: 0x42}};
            for (const endpoint of meta.device.endpoints) {
                const cluster = 'genMultistateValue';
                if (endpoint.supportsInputCluster(cluster) || endpoint.supportsOutputCluster(cluster)) {
                    await endpoint.write(cluster, payload);
                    return;
                }
            }
            await entity.write('genMultistateValue', payload);
        },
  },
  lcd_cntr: {
      key: ['clear', 'light', 'scroll', 'cursor', 'blink', 'display', 'brightness', 'alarm_mode', 'off_delay'],
      convertSet: async (entity, key, value, meta) => {
          orig = value
          const backlog = {[key]: orig};
          if (meta.message.hasOwnProperty('clear')) {
              value = '[x]'
          }
          else if (meta.message.hasOwnProperty('light')) {
              value = value.toLowerCase();
              const lookup = {'on':"[l1]", 'off':"[l0]"};
              const state = lookup[value];
              value = state;
          }
          else if (meta.message.hasOwnProperty('scroll')) {
              value = value.toLowerCase();
              const lookup = {'on':"[s1]", 'off':"[s0]"};
              const state = lookup[value];
              value = state;
          }
          else if (meta.message.hasOwnProperty('cursor')) {
              value = value.toLowerCase();
              const lookup = {'on':"[w1]", 'off':"[w0]"};
              const state = lookup[value];
              value = state;
          }
          else if (meta.message.hasOwnProperty('blink')) {
              value = value.toLowerCase();
              const lookup = {'on':"[q1]", 'off':"[q0]"};
              const state = lookup[value];
              value = state;
          }
          else if (meta.message.hasOwnProperty('display')) {
              value = value.toLowerCase();
              const lookup = {'on':"[d1]", 'off':"[d0]"};
              const state = lookup[value];
              value = state;
          }
          else if (meta.message.hasOwnProperty('brightness')) {
              value = '[b' + value + ']';
          }
          else if (meta.message.hasOwnProperty('alarm_mode')) {
              value = '[a' + parseInt(value / 100) + ']';
          }
          else if (meta.message.hasOwnProperty('off_delay')) {
              value = '[p' + value + ']';
          }

          const payload = {14: {value, type: 0x42}};
          for (const endpoint of meta.device.endpoints) {
              const cluster = 'genMultistateValue';
              if (endpoint.supportsInputCluster(cluster) || endpoint.supportsOutputCluster(cluster)) {
                  await endpoint.write(cluster, payload);
                  return {
                      state: backlog,
                  };
              }
          }
          await entity.write('genMultistateValue', payload);
          return {
              state: backlog,
          };
      },
  },
}

function isCharNumber(c) {
  return c >= '0' && c <= '9';
}

const my_fz = {
  lcd_uart: {
        cluster: 'genMultistateValue',
        type: ['attributeReport', 'readResponse'],
        convert: (model, msg, publish, options, meta) => {
            let data = msg.data['stateText'];
            if (typeof data === 'object') {
                data = data.toString('latin1');
            }
            const payload = {};
            if (data.includes("l1")) {
              payload['light'] = 'ON';
            }
            if (data.includes("l0")) {
              payload['light'] = 'OFF';
            }
            if (data.includes("s1")) {
              payload['scroll'] = 'ON';
            }
            if (data.includes("s0")) {
              payload['scroll'] = 'OFF';
            }
            if (data.includes("w1")) {
              payload['cursor'] = 'ON';
            }
            if (data.includes("w0")) {
              payload['cursor'] = 'OFF';
            }
            if (data.includes("q1")) {
              payload['blink'] = 'ON';
            }
            if (data.includes("q0")) {
              payload['blink'] = 'OFF';
            }
            if (data.includes("d1")) {
              payload['display'] = 'ON';
            }
            if (data.includes("d0")) {
              payload['display'] = 'OFF';
            }
            if (data.includes("c1")) {
              payload['clear'] = 'ON';
            }
            if (data.includes("e")) {
              payload['error'] = true;
              //payload['msg'] = data;
            }
            if (data.includes("m1")) {
              payload['error'] = false;
              //payload['msg'] = ' ';
              payload['clear'] = 'OFF';
            }
            if (data.includes("k1")) {
              payload['occupancy'] = true;
            }
            if (data.includes("k0")) {
              payload['occupancy'] = false;
            }
            if (data.includes("b")) {
              start_index = data.indexOf("b") + 1;
              if (isCharNumber(data[start_index + 1])) {
                if (isCharNumber(data[start_index + 2])) {
                  end_index = start_index + 3;
                }
                else {
                    end_index = start_index + 2;
                }
              }
              else {
                end_index = start_index + 1;
              }
              value = data.substring(start_index, end_index);
              payload['brightness'] = parseInt(value);

            }
            if (data.includes("a")) {
              start_index = data.indexOf("a") + 1;
              if (isCharNumber(data[start_index + 1])) {
                if (isCharNumber(data[start_index + 2])) {
                  end_index = start_index + 3;
                }
                else {
                    end_index = start_index + 2;
                }
              }
              else {
                end_index = start_index + 1;
              }
              value = data.substring(start_index, end_index);
              payload['alarm_mode'] = parseInt(value)*100;
            }
            if (data.includes("p")) {
              start_index = data.indexOf("p") + 1;
              if (isCharNumber(data[start_index + 1])) {
                if (isCharNumber(data[start_index + 2])) {
                  end_index = start_index + 3;
                }
                else {
                    end_index = start_index + 2;
                }
              }
              else {
                end_index = start_index + 1;
              }
              value = data.substring(start_index, end_index);
              payload['off_delay'] = parseInt(value);
            }
            payload['msg'] = data;
            return payload;
        },
    },
    ptvo_uptime: {
       cluster: 'genAnalogInput',
       type: ['attributeReport', 'readResponse'],
       convert: (model, msg, publish, options, meta) => {
           const payload = {};
           const channel = msg.endpoint.ID;
           if (channel == 8) {
             const name = 'uptime';
             payload[name] = msg.data['presentValue'];
             return payload;
           }
       },
   },
}

const device = {
    zigbeeModel: ['ptvo.lcd'],
    model: 'ptvo.lcd',
    vendor: 'xyzroe.cc',
    description: '[Zigbee LCD 1604](https://xyzroe.cc/zigbee_lcd_1604)',
    fromZigbee: [fz.ignore_basic_report, fz.ptvo_switch_analog_input, my_fz.lcd_uart, my_fz.ptvo_uptime, fz.ptvo_multistate_action, fz.legacy.ptvo_switch_buttons],
    toZigbee: [tz.ptvo_switch_trigger, tz.ptvo_switch_uart, tz.ptvo_switch_analog_input, my_tz.lcd_lines, my_tz.lcd_cntr,],
    exposes: [
      e.temperature().withEndpoint('l2'),
      e.humidity().withEndpoint('l2'),
      e.pressure().withUnit('Pa').withEndpoint('l2'),
      exposes.numeric('quality', ea.STATE).withEndpoint('l4').withUnit('ppm').withDescription('CO2'),
      exposes.numeric('val1', ea.STATE).withEndpoint('l4').withUnit('ppm').withDescription('TVOC'),
      e.illuminance_lux().withEndpoint('l5'),

      exposes.binary('display', ea.STATE_SET, value_on='ON', value_off='OFF').withDescription('Entire LCD'),

      exposes.text('r1', ea.STATE_SET).withDescription('LCD line 1'),
      exposes.text('r2', ea.STATE_SET).withDescription('LCD line 2'),
      exposes.text('r3', ea.STATE_SET).withDescription('LCD line 3'),
      exposes.text('r4', ea.STATE_SET).withDescription('LCD line 4'),

      exposes.binary('light', ea.STATE_SET, value_on='ON', value_off='OFF').withDescription('Backlight LCD'),
      exposes.numeric('brightness', ea.STATE_SET).withValueMin(0).withValueMax(255).withDescription('Brightness LCD'),

      exposes.binary('blink', ea.STATE_SET, value_on='ON', value_off='OFF').withDescription('blink LCD'),
      exposes.binary('cursor', ea.STATE_SET, value_on='ON', value_off='OFF').withDescription('cursor LCD'),

      exposes.binary('scroll', ea.STATE_SET, value_on='ON', value_off='OFF').withDescription('autoscroll LCD'),
      exposes.binary('clear', ea.SET, value_on='ON', value_off='OFF').withDescription('Clear LCD'),
      exposes.numeric('alarm_mode', ea.STATE_SET).withValueMin(0).withValueMax(30000).withUnit('ms').withDescription('Alarm blink mode interval'),
      exposes.numeric('off_delay', ea.STATE_SET).withValueMin(0).withValueMax(300).withUnit('s').withDescription('Display light off delay after no move'),

      e.occupancy().withDescription('PIR movement detect'),
      //e.cpu_temperature().withProperty('temperature').withEndpoint('l7'),
      exposes.binary('error', ea.STATE, value_on=true, value_off=false).withDescription('Error LCD'),
      exposes.text('msg', ea.STATE).withDescription('Msg from LCD'),

      exposes.numeric('uptime', ea.STATE).withDescription('Uptime').withUnit('s'),
      exposes.text('action', ea.STATE_SET).withDescription('clear data to LCD'),
],
    meta: {
        multiEndpoint: true,
        //binaryEndpoints: {'l1': 'occupancy', },
    },
    endpoint: (device) => {
        return {
            l1: 1, action: 1, l2: 2, l4: 4, l5: 5,
        };
    },
    icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKAAAACgCAYAAACLz2ctAAABMWlDQ1BBZG9iZSBSR0IgKDE5OTgpAAAoz62OsUrDUBRAz4ui4lArBHFweJMoKLbqYMakLUUQrNUhydakoUppEl5e1X6Eo1sHF3e/wMlRcFD8Av9AcergECGDgwie6dzD5XLBqNh1p2GUYRBr1W460vV8OfvEDFMA0Amz1G61DgDiJI74wecrAuB50647Df7GfJgqDUyA7W6UhSAqQP9CpxrEGDCDfqpB3AGmOmnXQDwApV7uL0ApyP0NKCnX80F8AGbP9Xww5gAzyH0FMHV0qQFqSTpSZ71TLauWZUm7mwSRPB5lOhpkcj8OE5UmqqOjLpD/B8BivthuOnKtall76/wzrufL3N6PEIBYeixaQThU598qjJ3f5+LGeBkOb2F6UrTdK7jZgIXroq1WobwF9+MvwMZP/U6/OGUAAAAJcEhZcwAACxMAAAsTAQCanBgAAAovaVRYdFhNTDpjb20uYWRvYmUueG1wAAAAAAA8P3hwYWNrZXQgYmVnaW49Iu+7vyIgaWQ9Ilc1TTBNcENlaGlIenJlU3pOVGN6a2M5ZCI/PiA8eDp4bXBtZXRhIHhtbG5zOng9ImFkb2JlOm5zOm1ldGEvIiB4OnhtcHRrPSJBZG9iZSBYTVAgQ29yZSA2LjAtYzAwNiA3OS5kYWJhY2JiLCAyMDIxLzA0LzE0LTAwOjM5OjQ0ICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1sbnM6c3RSZWY9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZVJlZiMiIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOnRpZmY9Imh0dHA6Ly9ucy5hZG9iZS5jb20vdGlmZi8xLjAvIiB4bWxuczpleGlmPSJodHRwOi8vbnMuYWRvYmUuY29tL2V4aWYvMS4wLyIgeG1wTU06RG9jdW1lbnRJRD0iYWRvYmU6ZG9jaWQ6cGhvdG9zaG9wOjhlMmI4ZDRmLWQ4ZDItYjk0NS05MWYzLWEyMTE2ZDJkN2U0OCIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDpmMjM2NmQyZS1lYmRiLTQ1YjktOTAyZS0xZDJjYmQzNDA0OTkiIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0iQkM1ODY2RjMwRUJCRjc1MUNFMDBERDc3RDU1MkU5QUUiIGRjOmZvcm1hdD0iaW1hZ2UvcG5nIiBwaG90b3Nob3A6Q29sb3JNb2RlPSIzIiBwaG90b3Nob3A6SUNDUHJvZmlsZT0iQWRvYmUgUkdCICgxOTk4KSIgeG1wOkNyZWF0ZURhdGU9IjIwMjItMDYtMTBUMTk6Mzk6NTUrMDM6MDAiIHhtcDpNb2RpZnlEYXRlPSIyMDIyLTA2LTE2VDAxOjQwOjM5KzAzOjAwIiB4bXA6TWV0YWRhdGFEYXRlPSIyMDIyLTA2LTE2VDAxOjQwOjM5KzAzOjAwIiB0aWZmOkltYWdlV2lkdGg9IjEwMDAiIHRpZmY6SW1hZ2VMZW5ndGg9IjEwMDAiIHRpZmY6UGhvdG9tZXRyaWNJbnRlcnByZXRhdGlvbj0iMiIgdGlmZjpTYW1wbGVzUGVyUGl4ZWw9IjMiIHRpZmY6WFJlc29sdXRpb249IjEvMSIgdGlmZjpZUmVzb2x1dGlvbj0iMS8xIiB0aWZmOlJlc29sdXRpb25Vbml0PSIxIiBleGlmOkV4aWZWZXJzaW9uPSIwMjMxIiBleGlmOkNvbG9yU3BhY2U9IjY1NTM1IiBleGlmOlBpeGVsWERpbWVuc2lvbj0iMTAwMCIgZXhpZjpQaXhlbFlEaW1lbnNpb249IjEwMDAiPiA8eG1wTU06SGlzdG9yeT4gPHJkZjpTZXE+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDpjNzNkZTUxZi04NmYyLTRlYzMtODJjYy1lMmI0YmQyZmJkNmEiIHN0RXZ0OndoZW49IjIwMjItMDYtMTBUMTk6NDE6MjkrMDM6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi40IChNYWNpbnRvc2gpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJjb252ZXJ0ZWQiIHN0RXZ0OnBhcmFtZXRlcnM9ImZyb20gaW1hZ2UvanBlZyB0byBpbWFnZS9wbmciLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImRlcml2ZWQiIHN0RXZ0OnBhcmFtZXRlcnM9ImNvbnZlcnRlZCBmcm9tIGltYWdlL2pwZWcgdG8gaW1hZ2UvcG5nIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo4MDRiNDQ4NC1lYjExLTRhNjMtYmY1NS1lM2ZhNGM1YjMxNjMiIHN0RXZ0OndoZW49IjIwMjItMDYtMTBUMTk6NDE6MjkrMDM6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi40IChNYWNpbnRvc2gpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDpmMjM2NmQyZS1lYmRiLTQ1YjktOTAyZS0xZDJjYmQzNDA0OTkiIHN0RXZ0OndoZW49IjIwMjItMDYtMTZUMDE6NDA6MzkrMDM6MDAiIHN0RXZ0OnNvZnR3YXJlQWdlbnQ9IkFkb2JlIFBob3Rvc2hvcCAyMi40IChNYWNpbnRvc2gpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDwvcmRmOlNlcT4gPC94bXBNTTpIaXN0b3J5PiA8eG1wTU06RGVyaXZlZEZyb20gc3RSZWY6aW5zdGFuY2VJRD0ieG1wLmlpZDpjNzNkZTUxZi04NmYyLTRlYzMtODJjYy1lMmI0YmQyZmJkNmEiIHN0UmVmOmRvY3Vt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',
};

module.exports = device;
