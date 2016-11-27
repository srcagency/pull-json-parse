'use strict';

var COMMA = 0x2c;
var BRACKET_START = 0x5b;
var BRACKET_END = 0x5d;

module.exports = parse;

function parse( opts ){
	var opts = opts || {};
	var separator = opts.separator || '\n';

	return function( read ){
		var done = false;
		var queue = [];

		var cc = 0;
		var pos = 0;
		var buffer = '';
		var head = '';
		var commaDebt = false;
		var separatorPos = 0;
		var bufferFirstC = 0;

		return function again( abort, cb ){
			if (abort)
				return read(abort, cb);

			if (queue.length > 0)
				return cb(null, queue.shift());

			if (done)
				return cb(true);

			return read(null, function( end, data ){
				if (end !== null) {
					if (end !== true)
						return cb(end);	// error

					if (buffer === '')
						return cb(true);

					done = true;
					data = separator;
				}

				data = head+data;

				for (;pos < data.length;pos++) {
					cc = data.charCodeAt(pos);

					if (separatorPos === -1) {
						// recovering, ignore this character

						separatorPos = 0;
					} else if (cc === separator.charCodeAt(separatorPos)) {
						// (still) looking like a separator?

						separatorPos++;

						// do we need to collect more?
						if (separatorPos !== separator.length)
							continue;

						// full separator

						bufferFirstC = buffer.charCodeAt(0);

						if (bufferFirstC !== BRACKET_START && bufferFirstC !== BRACKET_END)
							queue.push(JSON.parse(buffer));

						buffer = '';
						separatorPos = 0;
						commaDebt = false;

						continue;
					} else if (separatorPos !== 0) {
						// it wasn't a separator, revert

						separatorPos = -1;
						pos = pos - separatorPos - 1;
						continue;
					}

					if (commaDebt) {
						buffer += ',';
						commaDebt = false;
					}

					if (cc === COMMA) {
						commaDebt = true;
					} else {
						buffer += String.fromCharCode(cc);
					}
				}

				if (buffer.length !== 0 || separatorPos !== 0) {
					head = data;
				} else {
					head = '';
					pos = 0;
				}

				return again(null, cb);
			});
		}
	}
}
