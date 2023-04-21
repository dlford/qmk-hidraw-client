var os = require('os-utils');
const HID = require('node-hid');

const devices = HID.devices();
// console.log(devices);

const indices = {
  NOTIFICATION: 1,
  CPU_USAGE: 2,
  STRING_VALUE: 3,
};

let activeIndex = 1;
let device;

function sendData() {
  switch (activeIndex) {
    case indices.NOTIFICATION:
      writeBool(true);
      break;
    case indices.CPU_USAGE:
      os.cpuUsage(function (v) {
        writeByte(parseInt(v * 100));
      });
      break;
    case indices.STRING_VALUE:
      writeString('Hello World!');
      break;
    default:
      activeIndex = 1;
      sendData();
  }
}

function writeString(str) {
  const chars = [activeIndex];
  for (let i = 0; i < str.length; i++) {
    chars.push(str.charCodeAt(i));
  }
  if (chars.length < 32) {
    for (let i = chars.length; i < 32; i++) {
      chars.push(0x00);
    }
  }
  device.write(chars);
}

function writeBool(val) {
  const chars = [activeIndex];
  chars.push(val ? 0x01 : 0x00);
  for (let i = chars.length; i < 32; i++) {
    chars.push(0x00);
  }
  device.write(chars);
}

function writeByte(val) {
  const chars = [activeIndex];
  chars.push(val);
  for (let i = chars.length; i < 32; i++) {
    chars.push(0x00);
  }
  device.write(chars);
}

function getDevice() {
  const deviceInfo = devices.find(function (d) {
    const isDactyl =
      d.manufacturer === 'DLFord' &&
      d.product === 'Dactyl Minidox (3x5+3)';
    return isDactyl && d.usagePage === 0xff60 && d.usage === 0x61;
  });

  if (deviceInfo) {
    device = new HID.HID(deviceInfo.path);
    return true;
  }

  return false;
}

function init() {
  getDevice();

  if (!device) {
    console.log('Waiting for device...');
    setTimeout(() => {
      init();
    }, 1000);
    return;
  }

  console.log('Device connected!');
  sendData();

  device.on('data', (data) => {
    const index = data[0];
    const value = data[1];
    if (value !== 1) {
      console.error(`Bad Response on index ${index}: `, data);
    }

    activeIndex++;
    sendData();
  });

  device.on('error', (err) => {
    throw err;
  });
}

init();
