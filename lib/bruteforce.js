// Bruteforce class

'use strict';

function Brute(chars, min_size, max_size) {
	this.chars      = chars
	this.min_size   = min_size;
	this.max_size   = max_size;
	this.arra       = filled_array(max_size, 0);
	this.interval   = null;
	this.b_continue = true;

	for (var i=0; i<max_size; i++) {
		if (i < (max_size - min_size)) {
			this.arra[i] = -1;
		}
	}
}

Brute.prototype.get_limit = function() {
	charset_length = this.chars.length;

	if (this.max_size == this.min_size)
		return Math.pow(charset_length, this.max_size)

	var j = 0;
	for (var i=this.max_size; i>=0; i--)
		j += Math.pow(charset_length, i);

	return j;
};

Brute.prototype.get_value = function() {
	var value = "";
	for (var i=0; i<this.arra.length; i++) {
		if (this.arra[i] >= 0)
			value += this.chars[this.arra[i]];
	}
	this.next();
	return value;
};

Brute.prototype.next = function () {
	for (var pos=this.arra.length-1; pos>=0; pos--) {
		if (this.arra[pos] < this.chars.length-1) {
			this.arra[pos]++;

			for (var i=pos+1; i<this.arra.length; i++)
				this.arra[i] = 0;			
			break;
		}
		if (pos == 0 && this.arra[0] == this.chars.length-1) {
			this.b_continue = false;
			clearInterval(this.interval);
		}

	}
};

function filled_array(len, val) {
	var rv = new Array(len);
	while (--len >= 0) {
		rv[len] = val;
	}
	return rv;
}

function bruteforce(opts, callback) {
	b = new Brute(opts.charset, opts.min, opts.max);
	b.interval = setInterval(function (){
		value = b.get_value()
		callback(value);
	}, 0);
};

module.exports = bruteforce;
