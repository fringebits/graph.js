function Animate(attribute, endVal, duration) {
	this.attr = attribute;
	this.end = endVal;
	this.dur = duration;
}

Animate.prototype = {
	__proto__: Graphic.prototype,
	startTime: 0,
	attr: "",
	end: 0,
	dur: 0,
	repeat: true,

	fromNode: function(node) {
		var a = new Animate(Graphic.prototype.getString("attr", node, ""),
                            Graphic.prototype.getString("end", node, 0),
                            Graphic.prototype.getFloat("duration", node, 1000));
		return a;
	},

	animate: function(dt, node) {
		if (this.start == undefined) {
			this.start = node[this.attr];
		}

		if (this.repeat) {
			dt %= this.dur;
		}

		if (dt > this.dur)
			return false;

		var ret = eval(this.end);
		if (this.end == ret)
			node[this.attr] = (ret - this.start) * dt / this.dur + this.start;
		else
			node[this.attr] = ret;

		if (dt < this.dur) return true;

		if (this.repeat) {
			node[this.attr] = this.start;
			return true;
		}

		node[this.attr] = this.end;
		return false;
	},
}
