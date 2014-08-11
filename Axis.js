(function() {
window.Axis = function() {
	Graphic.call(this, {});
	this.ticks = true;
	this.grid = true;
	this.min = -10;
	this.max = -10;
	this.majorDivision = 5;
	this.minorDivision = 1;
	this.minorTickSize = 5;
	this.majorTickSize = 5;
	this.cache = {};
}

window.Axis.prototype = {
	__proto__: Graphic.prototype,
	X: 0,
	Y: 1,
	Z: 2,

	toGraphCoords: function(graph, point) {
		var p = 0;
		return this.min + this.range * p;
	},

	toScreenCoords: function(graph, point) {
		if (this.cache[point]) {
			return this.cache[point];
		}

		var p = (point - this.min) / this.range;

		if (this.axis === Axis.prototype.X) {
			this.cache[point] = p * graph.width;
		} else if (this.axis === Axis.prototype.Y) {
			this.cache[point] = (1 - p) * graph.height;
		}

		return this.cache[point];
	},

	shift: function(dist) {
		this.min += dist;
		this.max += dist;
		this.range = this.max - this.min;
		this.cache = {};
		this.setInvalidate(true);

		var evt = document.createEvent('CustomEvent');
		evt.initCustomEvent("invalidate", true, true, null);
		this.dispatchEvent(evt);
	},

	zoom: function(dist, x) {
		var p = this.min + x*this.range;
		this.min = (this.min - p)*(1+dist/100) + p;
		this.max = (this.max - p)*(1+dist/100) + p;
		this.range = this.max - this.min;
		this.cache = {};
		this.setInvalidate(true);

		var evt = document.createEvent('CustomEvent');
		evt.initCustomEvent("invalidate", true, true, null);
		this.dispatchEvent(evt);
	},

	draw: function(graph) {
		this.ctx.clearRect(0,0,this.canvas.width, this.canvas.height);
		this.ctx.save();

		this.ctx.beginPath();
		var offset = 0;
		if (this.axis === Axis.prototype.X) {
			offset = graph.getXOffset();
			this.ctx.moveTo(           0, offset);
			this.ctx.lineTo(graph.scrollWidth, offset);
		} else if (this.axis === Axis.prototype.Y) {
			offset = graph.getYOffset();
			this.ctx.moveTo(offset, 0);
			this.ctx.lineTo(offset, graph.scrollHeight);
		}
		this.ctx.stroke();

		if (this.ticks) {
			this.drawTicks(offset, graph);
		}

		if (this.grid) {
			this.drawGrid(graph);
		}

		this.ctx.restore();
	},

	drawGrid: function(graph) {
		this.ctx.strokeStyle = "lightgray";
		var offset = graph.scrollWidth;
		if (this.axis === Axis.prototype.X) {
			offset = graph.scrollHeight;
		}
		this._drawTicks(0, this.min, -this.minorTickStep, offset, 0, graph, false);
		this._drawTicks(0, this.max, this.minorTickStep, offset, 0, graph, false);
	},

	_drawTicks: function(start, end, step, size, offset, graph, drawLabels) {
		for (var i = start; step > 0 ? i <= end : i >= end; i += step) {
			if (i === 0) {
				continue;
			}

			this.ctx.beginPath();
			var p = this.toScreenCoords(graph, i);
			if (this.axis === Axis.prototype.X) {
				this.ctx.moveTo(p, offset - size);
				this.ctx.lineTo(p, offset + size);
			} else if (this.axis === Axis.prototype.Y) {
				this.ctx.moveTo(offset - size, p);
				this.ctx.lineTo(offset + size, p);
			}
			this.ctx.stroke();

			if (!drawLabels) {
				continue;
			}

			var round = 1;
			while (this.majorTickStep*round < 1) {
				round *= 10;
			};
			var num = Math.round(i*round)/round;
			var txt = this.ctx.measureText(num).width;
			var margin = 4;
			var fontsize=8;

			if (this.axis === Axis.prototype.X) {
				var y = offset+this.majorTickSize+margin+fontsize;
				if (y < 0) y = fontsize;
				else if (y > graph.scrollHeight) y = graph.scrollHeight - fontsize;

  				this.ctx.fillText(num, p - txt/2, y);
  			} else {
  				var x = offset-this.majorTickSize-txt-margin;
				if (x < 0) x = margin + this.majorTickSize;
				else if (x > graph.scrollWidth) x = graph.scrollWidth-txt-this.majorTickSize-margin;
  				this.ctx.fillText(num, x, p+fontsize/2);
  			}
		}
	},

	drawTicks: function(offset, graph) {
		if (this.majorDivision) {
			var i = 1;
			do {
				this.majorTickStep = Math.floor(this.range / this.majorDivision * i) / i;
				i *= 10;
			} while (this.majorTickStep == 0);
		}

		if (this.minorDivision && this.majorTickStep) {
			this.minorTickStep = this.majorTickStep / this.minorDivision;
			this._drawTicks(0, this.min, -this.minorTickStep, this.minorTickSize, offset, graph, false);
			this._drawTicks(0, this.max, this.minorTickStep, this.minorTickSize, offset, graph, false);
		}

		if (this.majorDivision) {
			this._drawTicks(0, this.min, -this.majorTickStep, this.majorTickSize, offset, graph, true);
			this._drawTicks(0, this.max, this.majorTickStep, this.majorTickSize, offset, graph, true);
		}
	}
}

xtag.register('x-graph-axis', {
	extends: "div",
	lifecycle: {
		created: function() {
			window.Axis.call(this);
		},

		inserted: function() {
			var axis = this.getAttribute("axis");
			this.axis = (axis === "z") ? Axis.prototype.Z :
					   ((axis === "y") ? Axis.prototype.Y :
						                 Axis.prototype.X);

			this.min = parseFloat(this.getAttribute("min"));
			this.max = parseFloat(this.getAttribute("max"));
			this.range = this.max - this.min;
			this.cache = {};

			this.canvas.setAttribute("width", this.getAttribute("width"));
			this.canvas.setAttribute("height", this.getAttribute("height"));
			this.canvas.width = this.getAttribute("width");
			this.canvas.height = this.getAttribute("height");

			this.grid = this.getBool("grid", this, true);
			this.ticks = this.getBool("ticks", this, true);
		},
		removed: function(){ },
		attributeChanged: function(){ },
	},

	events: { },
	accessors: { },
	methods: window.Axis.prototype,
});

})();