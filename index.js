const Base32 = (function() {
    var alphabet = '0123456789abcdefghjkmnpqrtuvwxyz'
    var alias = { o:0, i:1, l:1, s:5 }

    var lookup = function() {
        var table = {}
        for (var i = 0; i < alphabet.length; i++) {
            table[alphabet[i]] = i
        }
        for (var key in alias) {
            if (!alias.hasOwnProperty(key)) continue
            table[key] = table['' + alias[key]]
        }
        lookup = function() { return table }
        return table
    }

    Number.prototype.toBinary = function(places) {
        if (!places) places = 0
        var val = this + 0
        var str = ''
        while (val || places > 0) {
            str = ((val & 1) ? '1' : '0') + str
            val >>= 1
            places--
        }
        return str
    }

    function Encoder() {
        var skip = 0
        var bits = 0

        this.output = ''

        this.readByte = function(byte) {
            if (typeof byte == 'string') byte = byte.charCodeAt(0)

            if (skip < 0) {
                bits |= (byte >> (-skip))
            } else {
                bits = (byte << skip) & 248
            }

            if (skip > 3) {
                skip -= 8
                return 1
            }

            if (skip < 4) {
                // produce a character
                //console.log('         > ' + (bits >> 3).toBinary(5))
                this.output += alphabet[bits >> 3]
                skip += 5
            }

            return 0
        }

        this.finish = function(check) {
            var output = this.output + (skip < 0 ? alphabet[bits >> 3] : '') + (check ? '$' : '')
            this.output = ''
            return output
        }
    }

    Encoder.prototype.update = function(input) {
        for (var i = 0; i < input.length; ) {
            i += this.readByte(input[i])
        }
        var output = this.output
        this.output = ''
        return output
    }

    function Decoder() {
        var skip = 0
        var byte = 0

        this.output = ''

        this.readChar = function(char) {
            if (typeof char != 'string'){
                if (typeof char == 'number') {
                    char = String.fromCharCode(char)
                }
            }
            char = char.toLowerCase()
            var val = lookup()[char]
            if (typeof val == 'undefined') {
                return
            }
            val <<= 3
            
            byte |= val >>> skip
            skip += 5
            
            if (skip >= 8) {
                this.output += String.fromCharCode(byte)
                skip -= 8
                if (skip > 0) byte = (val << (5 - skip)) & 255
                else byte = 0
            }

        }

        this.finish = function(check) {
            var output = this.output + (skip < 0 ? alphabet[bits >> 3] : '') + (check ? '$' : '')
            this.output = ''
            return output
        }
    }

    Decoder.prototype.update = function(input) {
        for (var i = 0; i < input.length; i++) {
            this.readChar(input[i])
        }
        var output = this.output
        this.output = ''
        return output
    }

    function decode(input) {
        decoder = new Decoder()
        var output = decoder.update(input) + decoder.finish()
        return output
    }

    function encode(input) {
        encoder = new Encoder()
        var output = encoder.update(input) + encoder.finish()
        return output
    }

    return {
        decode: decode,
        encode: encode
    };
})();

console.log(Base32.encode('rorack'))
console.log(Base32.decode(Base32.encode('rorack')))
