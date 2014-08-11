(function() {
window.BarGraph = function(options) {
	Graphic.call(this, options);
}

window.BarGraph.prototype = {
	__proto__: Graphic.prototype,
	id: 0,

	draw: function(graph) {
		var x = 0;
		this.ctx.clearRect(0, 0, graph.scrollWidth, graph.scrollHeight);
		for (var childId in this.children) {
			var child = this.children[childId];

			if (!child.draw) {
				continue;
			}

			x += child.paddingLeft;
			var p = graph.toScreenCoords({ x: x, y: 0 });

			this.ctx.save();
			this.ctx.translate(p.x, p.y);
			child.draw(graph, this.ctx);
			this.ctx.restore();

			x += child.width + child.paddingRight;
		}
	},
}

window.Bar = function(options) {
	this.width = 1;
	this.height = 0;
	this.paddingLeft = 0.1;
	this.paddingRight = 0.1;

	createAnimatableProperty(this, "height");
	this.mixin(this, options, options);
	// Graphic.call(this, options);
}
window.Bar.prototype = {
	__proto__: Graphic.prototype,

	draw: function(graph, ctx) {
		ctx.save();
		this.setupDrawing(ctx);

		var p2 = graph.toScreenCoords({ x: this.width + graph.xaxis.min, y: this.height + graph.yaxis.max });
		ctx.strokeRect(0, 0, p2.x, p2.y);
		if (this.fill) {
			ctx.fillRect(0, 0, p2.x, p2.y);
		}

		// TODO: Support text-align
		// TODO: Use right fontSize rather than hardcoded 15
		ctx.fillStyle = this.color;
		var measure = ctx.measureText(this.label);
		ctx.fillText(this.label, p2.x/2 - measure.width/2, 15);

		ctx.restore();
	},
}

window.BoxAndWhiskers = function(options) {
	createAnimatableProperty(this, "min");
	createAnimatableProperty(this, "max");
	createAnimatableProperty(this, "median");
	createAnimatableProperty(this, "lowerQuartile");
	createAnimatableProperty(this, "upperQuartile");

	this.min = 0;
	this.lowerQuartile = 1;
	this.median = 2;
	this.upperQuartile = 3;
	this.max = 4;

	Bar.call(this, options);
}

window.BoxAndWhiskers.prototype = {
	__proto__: Bar.prototype,

	drawHorizLine: function(ctx, graph, y, x1, x2) {
		ctx.moveTo(x1, y);
		ctx.lineTo(x2-x1, y);
	},

	drawVertLine: function(ctx, graph, x, y1, y2) {
		ctx.moveTo(x, y1);
		ctx.lineTo(x, y2);
	},

	drawBox: function(ctx, graph, x1, y1, x2, y2) {
		ctx.strokeRect(x1, y1, x2-x1, y2-y1);
		if (this.fill) {
			ctx.fillRect(x1, y1, x2-x1, y2-y1);
		}
	},

	draw: function(graph, ctx) {
		ctx.save();
		this.setupDrawing(ctx);

		var p2 = graph.toScreenCoords({ x: this.width + graph.xaxis.min,
			                            y: this.height + graph.yaxis.max });

		var min = graph.toScreenCoords({ x: 0, y: this.min + graph.yaxis.max });
		var lowerQuartile = graph.toScreenCoords({ x: 0, y: this.lowerQuartile + graph.yaxis.max });
		var median = graph.toScreenCoords({ x: 0, y: this.median + graph.yaxis.max });
		var upperQuartile = graph.toScreenCoords({ x: 0, y: this.upperQuartile + graph.yaxis.max });
		var max = graph.toScreenCoords({ x: 0, y: this.max + graph.yaxis.max });

		ctx.beginPath();
		this.drawHorizLine(ctx, graph, min.y, 0, p2.x);
		this.drawVertLine(ctx, graph, p2.x/2, min.y, lowerQuartile.y);
		this.drawHorizLine(ctx, graph, median.y, 0, p2.x);
		this.drawVertLine(ctx, graph, p2.x/2, upperQuartile.y, max.y);
		this.drawHorizLine(ctx, graph, max.y, 0, p2.x);
		ctx.stroke();
		this.drawBox(ctx, graph, 0, lowerQuartile.y, p2.x, upperQuartile.y);

		ctx.fillStyle = this.color;
		var measure = ctx.measureText(this.label);
		ctx.fillText(this.label, p2.x/2 - measure.width/2, 15);

		ctx.restore();
	},
}

xtag.register('x-bargraph', {
	extends: "div",
	lifecycle: {
		created: function() {
			var options = this.getBaseOptions(this);
			this.resolveStyles(this, options);
			window.BarGraph.call(this, options);
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
	methods: window.BarGraph.prototype,
});
xtag.register('x-bar', {
	extends: "div",
	lifecycle: {
		created: function() {
			var options = this.getBaseOptions(this);
			this.resolveStyles(this, options);
			window.Bar.call(this, options);
		},

		inserted: function() {
		},
		removed: function(){ },
		attributeChanged: function(){ },
	},
	events: { },
	accessors: { },
	methods: window.Bar.prototype,
});
xtag.register('x-boxAndWhiskers', {
	extends: "div",
	lifecycle: {
		created: function() {
			var options = this.getBaseOptions(this);
			this.resolveStyles(this, options);
			window.BoxAndWhiskers.call(this, options);
		},

		inserted: function() {
			this.min = this.getFloat("min", this);
			this.max = this.getFloat("max", this);
			this.lowerQuartile = this.getFloat("lowerQuartile", this);
			this.upperQuartile = this.getFloat("upperQuartile", this);
			this.median = this.getFloat("median", this);
		},
		removed: function(){ },
		attributeChanged: function(){ },
	},
	events: { },
	accessors: { },
	methods: window.BoxAndWhiskers.prototype,
});

})();