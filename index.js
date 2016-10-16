'use strict';

const COMMA = 0x2c;
const BRACKET_START = 0x5b;
const BRACKET_END = 0x5d;

module.exports = parse;

function parse( read ){
	var done = false;
	var queue = [];
	var pos = 0;
	var ni = 0;
	var head = '';
	var tail = '';
	var line = '';

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

				if (head === '')
					return cb(true);

				done = true;
				data = '\n';
			}

			pos = 0;

			if (typeof data !== 'string')
				data = data.toString();

			while ((ni = data.indexOf('\n', pos)) !== -1) {
				tail = data.slice(pos, data.charCodeAt(ni - 1) === COMMA
					? ni - 1
					: ni);

				line = (pos === 0
					? (ni === 0 && head.charCodeAt(head.length - 1) === COMMA
						? head.slice(0, -1)
						: head)
					: '')+tail;

				pos = ni + 1;

				if (line.length === 1 && (line.charCodeAt(0) === BRACKET_START || line.charCodeAt(0) === BRACKET_END))
					continue;

				queue.push(JSON.parse(line));
			}

			head = (pos === 0 ? head : '')+data.slice(pos);

			return again(null, cb);
		});
	}
}
