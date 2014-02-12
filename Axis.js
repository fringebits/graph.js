function Axis(dir, min, max) {
	this.dir = dir;
	this.min = min;
	this.max = max;
}

Axis.prototype = {
	__proto__: Graphic.prototype,
	X: 0,
	Y: 1,
	Z: 2,
	minorTickStep: 1,
	minorTickSize: 2.5,
	majorTickStep: 5,
	majorTickSize: 5,
	ticks: true,
	grid: true,
	color: "black",

	toGraphCoords: function(graph, point) {
		var p = 0;
		return this.min + (this.max - this.min) * p;
	},

	toScreenCoords: function(graph, point) {
		var p = (point - this.min) / (this.max - this.min);
		if (this.dir == Axis.prototype.X) {
			return  p * graph.width;
		} else if (this.dir == Axis.prototype.Y) {
			return (1 - p) * graph.height;
		}
	},

	shift: function(dist) {
		this.min += dist;
		this.max += dist;
	},

	zoom: function(dist, x) {
		var p = this.min + x*(this.max - this.min);
		this.min = (this.min - p)*(1+dist/100) + p;
		this.max = (this.max - p)*(1+dist/100) + p;
	},

	draw: function(ctx, graph, offset) {
		ctx.save();
		this.setupDrawing(ctx);
		ctx.beginPath();

		if (this.dir == Axis.prototype.X) {
			ctx.moveTo(           0, offset);
			ctx.lineTo(graph.width, offset);
		} else if (this.dir == Axis.prototype.Y) {
			ctx.moveTo(offset, 0);
			ctx.lineTo(offset, graph.height);
		}
		ctx.stroke();

		if (this.ticks) {
			this.drawTicks(offset, ctx, graph);
		}

		if (this.grid) {
			this.drawGrid(ctx, graph);
		}
		ctx.restore();
	},

	drawGrid: function(ctx, graph) {
		ctx.strokeStyle = "lightgray";
		var offset = graph.width;
		if (this.dir == Axis.prototype.X) {
			offset = graph.height;
		}
		this._drawTicks(0, this.min, -this.minorTickStep, offset, 0, ctx, graph, false);
		this._drawTicks(0, this.max, this.minorTickStep, offset, 0, ctx, graph, false);
	},

	_drawTicks: function(start, end, step, size, offset, ctx, graph, drawLabels) {
		for (var i = start; step > 0 ? i <= end : i >= end; i += step) {
			if (i === 0)
				continue;

			ctx.beginPath();
			var p = this.toScreenCoords(graph, i);
			if (this.dir == Axis.prototype.X) {
				ctx.moveTo(p, offset - size);
				ctx.lineTo(p, offset + size);
			} else if (this.dir == Axis.prototype.Y) {
				ctx.moveTo(offset - size, p);
				ctx.lineTo(offset + size, p);
			}
			ctx.stroke();

			if (!drawLabels)
				continue;

			var round = 1;
			while (this.majorTickStep*round < 1) {
				round *= 10;
			};
			var num = Math.round(i*round)/round;
			var txt = ctx.measureText(num).width;
			var margin = 4;
			var fontsize=8;

			if (this.dir == Axis.prototype.X) {
				var y = offset+this.majorTickSize+margin+fontsize;
				if (y < 0) y = fontsize;
				else if (y > graph.height) y = graph.height - fontsize;

  				ctx.fillText(num, p - txt/2, y);
  			} else {
  				var x = offset-this.majorTickSize-txt-margin;
				if (x < 0) x = margin + this.majorTickSize;
				else if (x > graph.width) x = graph.width-txt-this.majorTickSize-margin;
  				ctx.fillText(num, x, p+fontsize/2);
  			}
		}
	},

	drawTicks: function(offset, ctx, graph) {
		if (this.majorDivision) {
			var i = 1;
			do {
				this.majorTickStep = Math.floor((this.max - this.min) / this.majorDivision * i) / i;
				i *= 10;
			} while (this.majorTickStep == 0);
		}

		if (this.minorDivision && this.majorTickStep) {
			this.minorTickStep = this.majorTickStep / this.minorDivision;
			this._drawTicks(0, this.min, -this.minorTickStep, this.minorTickSize, offset, ctx, graph, false);
			this._drawTicks(0, this.max, this.minorTickStep, this.minorTickSize, offset, ctx, graph, false);
		}

		if (this.majorDivision) {
			this._drawTicks(0, this.min, -this.majorTickStep, this.majorTickSize, offset, ctx, graph, true);
			this._drawTicks(0, this.max, this.majorTickStep, this.majorTickSize, offset, ctx, graph, true);
		}
	}
}