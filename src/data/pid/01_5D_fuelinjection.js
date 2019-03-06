module.exports = {
  mode: '01',
  pid: '5D',
  name: 'fuelinjection',
  description: 'Fuel injection timing',

  min: -210.0,
  max: 301.992,
  unit: '°',

  bytes: 2,
  convertToUseful: function(byteA, byteB) {
    return (parseInt(byteA, 16) * 256 + parseInt(byteB, 16) - 26.88) / 128;
  },
};
