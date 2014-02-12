function Point(options) {
	this.mixin(this, options);
}

Point.prototype = {
	__proto__: Graphic.prototype,

	fromNode: function(node) {
		var options = this.getBaseOptions(node);
		p = new Point(options);
		p.resolveStyles(node, options);
		p = Graphic.prototype.fromNode(node, p);
		return p;
	},

	draw: function(ctx, graph) {
		var p = graph.toScreenCoords({ x: this.x, y: this.y });

		this.setupDrawing(ctx);
		ctx.beginPath();
		ctx.arc(p.x, p.y, this.radius, 0, Math.PI*2, true);
		ctx.stroke();
		ctx.fill();
 	}
}