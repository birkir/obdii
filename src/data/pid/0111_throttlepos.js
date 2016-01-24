module.exports =
{
    mode:   "01",
    pid:    "11",
    name:   "throttlepos",
    description: "Absolute Throttle Position",

    min:    1,
    max:    100,
    unit:   "%",

    bytes:  1,
    convertToUseful: function( byteA )
    {
        return parseInt( byteA, 16 ) * ( 100 / 255 );
    }
};