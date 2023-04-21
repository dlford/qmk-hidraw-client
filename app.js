const HID = require('node-hid');

const devices = HID.devices();
// console.log(devices);

const deviceInfo = devices.find(function (d) {
  const isDactyl =
    d.manufacturer === 'DLFord' &&
    d.product === 'Dactyl Minidox (3x5+3)';
  return isDactyl && d.usagePage === 0xff60 && d.usage === 0x61;
});
if (deviceInfo) {
  // console.log(deviceInfo.path);
  const device = new HID.HID(deviceInfo.path);
  device.on('data', (data) => {
    console.log(`Received ${data.length} Bytes: "${data.toString()}"`);
    device.close();
  });
  device.on('error', (err) => {
    console.error(err);
    device.close();
  });
  const message = 'loopback message test';
  console.log(`Sending "${message}"`);
  const chars = [];
  for (let i = 0; i < message.length; i++) {
    chars.push(message.charCodeAt(i));
  }
  if (chars.length < 32) {
    for (let i = chars.length; i < 32; i++) {
      chars.push(0x00);
    }
  }
  console.log(`Sent ${device.write(chars)} Bytes`);
}
