function Vector(options) {
	Line.call(this, options);
}

Vector.prototype = {
	__proto__: Line.prototype,
	arrowWidth: 10,
	arrowHeight: 15,
	showPoint: false,

	get x2() { return this.x; },
	get y2() { return this.y; },

	fromNode: function(node) {
		var options = this.getBaseOptions(node);
		this.mixin(options, {
			scale: this.getFloat("scale", node),
			x1: this.getFloat("offsetx", node),
			y1: this.getFloat("offsety", node),
			offset: this.getNode("offset", node),
			copy: this.getNode("copy", node),
		});

		var p = new Vector(options);
		this.resolveStyles(node, options);
		// p.x2 += p.x1;
		// p.y2 += p.y1;
		p = Line.prototype.fromNode(node, p);

		return p;
	},

	draw: function(ctx, graph) {
		console.log("draw vector");
		Line.prototype.draw.call(this, ctx, graph);
		var p2 = graph.toScreenCoords({ x: this.x*this.scale, y: this.y*this.scale });

		// Draw an arrow on the end of the vector

		ctx.save();

		this.setupDrawing(ctx);
		ctx.translate(p2.x, p2.y);
		ctx.rotate(-1*this.angle);
		if (this.x2*this.scale < 0) {
			ctx.rotate(Math.PI);
		}

		ctx.beginPath();
		ctx.fillStyle = this.stroke || this.color;
		ctx.moveTo(-this.arrowHeight, -this.arrowWidth/2);
		ctx.lineTo(0, 0);
		ctx.lineTo(-this.arrowHeight, this.arrowWidth/2);
		ctx.fill();

		ctx.restore();
 	},
}

graph.prototype.register("VECTOR", Vector);