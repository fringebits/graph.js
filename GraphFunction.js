(function() {
window.GraphFunction = function(options) {
	Graphic.call(this, options);

	this.valCache = { };
	this.time = 0;
	this.startTime = Date.now();

	var functionOptions = FunctionUtils.getFromString(this.textContent);
	this.fun = functionOptions.fun;
	this.iterate = functionOptions.iterate;
	this.crossAxis = functionOptions.crossAxis;
	this.polar = functionOptions.polar;
	this.useTime = functionOptions.useTime;
}

window.GraphFunction.prototype = {
	__proto__: Graphic.prototype,

	shouldInvalidate: function() {
		return this.invalidate || this.useTime;
	},

	setInvalidate: function(val) {
		this.invalidate = val;
	},

	draw: function(graph) {
		this.ctx.clearRect(0, 0, graph.scrollWidth, graph.scrollHeight);
		if (this.useTime) {
			if (this.startTime < 0) {
				this.startTime = Date.now();
			}
			this.time = Date.now() - this.startTime;
		}

		this.ctx.beginPath();
		this.setupDrawing(this.ctx);

		this.step = this.polar ? Math.PI*2/800 : (graph.xaxis.max - graph.xaxis.min) / graph.width;

		// Animating or dragging, we reduce the resolution
		if (graph.startDragPoint) this.step = this.step*10;
		else if (this.useTime) this.step = this.step*3;

		var start = this.polar ? 0          : graph.xaxis.min;
		var end   = this.polar ? Math.PI*2  : graph.xaxis.max;

		var point;
		var res = {};
		var s = true;

		for (var a = start; a < end; a += this.step) {
			res[this.iterate] = a;
			try {
				res[this.crossAxis] = this.fun(a, this.time)
			} catch(ex) { }

			if (this.polar)  point = graph.toScreenCoords(graph.polarToXY(res));
			else point = graph.toScreenCoords(res);

			if (s) {
				this.ctx.moveTo(point.x, point.y);
				s = false;
			} else {
				this.ctx.lineTo(point.x,point.y);
			}
		}

		this.ctx.stroke();
		if (this.fill) {
			if (!this.polar) {
				var x = this.iterate == "x" ? graph.xaxis.max : 0;
				var y  = this.iterate == "y" ? graph.yaxis.max : 0;
				var p = graph.toScreenCoords({ x: x, y: y });
				this.ctx.lineTo(p.x, p.y);

				x = this.iterate == "x" ? graph.xaxis.min : 0;
				y  = this.iterate == "y" ? graph.yaxis.min : 0;
				var p = graph.toScreenCoords({ x: x, y: y });
				this.ctx.lineTo(p.x, p.y);
			}

			this.ctx.fill();
		}
		this.invalidate = this.useTime;
	}
}

xtag.register('x-function', {
	extends: "div",
	lifecycle: {
		created: function() {
			var options = this.getBaseOptions(this);
			this.mixin(options, {
				step: this.getFloat("this.step", this),
			});
			this.resolveStyles(this, options);
			window.GraphFunction.call(this, options);
		},

		inserted: function() {
			this.canvas.setAttribute("width", this.parentNode.scrollWidth);
			this.canvas.setAttribute("height", this.parentNode.scrollHeight);
			this.canvas.width = this.parentNode.scrollWidth;
			this.canvas.height = this.parentNode.scrollHeight;
		},
		removed: function(){ },
		attributeChanged: function(){ },
	},

	events: { },
	accessors: { },
	methods: window.GraphFunction.prototype,
});

})();