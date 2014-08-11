(function() {
window.Point = function(options) {
	createAnimatableProperty(this, "radius");
	Graphic.call(this, options);
}

window.Point.prototype = {
	__proto__: Graphic.prototype,
	name: "Point",

	fromNode: function(node) {
		var options = this.getBaseOptions(node);
		p = new Point(options);
		p.resolveStyles(node, options);
		p = Graphic.prototype.fromNode(node, p);
		return p;
	},

	draw: function(graph) {
		this.ctx.clearRect(0,0,this.canvas.width, this.canvas.height);
		this.ctx.save();

		var p = graph.toScreenCoords({ x: this.x, y: this.y });

		this.setupDrawing(this.ctx);
		this.ctx.beginPath();
		this.ctx.arc(p.x, p.y, this.radius, 0, Math.PI*2, true);
		this.ctx.stroke();
		this.ctx.fill();

		this.ctx.restore();
	}
}

xtag.register('x-point', {
	extends: "div",
	lifecycle: {
		created: function() {
			var options = this.getBaseOptions(this);
			this.resolveStyles(this, options);
			window.Point.call(this, options);
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

	events: {
		'mouseover': function(event) {
			this.onmouseover(event);
		},
		'mouseout': function(event) {
			this.onmouseout(event);
		}
	},
	accessors: { },
	methods: window.Point.prototype,
});

})();