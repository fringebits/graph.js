function Angle(deg) {
	this.angle = deg;
}

Angle.prototype = {
	__proto__: Graphic.prototype,
	startAngle: 0,
	angle: Math.PI/4,

	fromNode: function(node, base) {
		p = new Angle(this.getFloat("angle", node, this.angle));

		p.radius = this.getFloat("radius", node, this.radius);
		p.startAngle = this.getFloat("startAngle", node, this.startAngle);
		p.color = this.getString("color", node, "blue");
		p.label = this.getString("label", node);
		p.id = this.getString("id", node, p.label);

		p.from = this.getNode("from", node);
		p.to   = this.getNode("to", node);

		return p;
	},

	draw: function(ctx, graph) {
		if (this.from && !this.from.setup) {
			var from = graph.children[this.from.name];
			this.x = from.x1;
			this.y = from.y1;
			this.startAngle = from.angle;

			if (this.from.type == "inside")
				this.startAngle += Math.PI/2;
			this.from.setup = true;
		}

		if (this.to && !this.to.setup) {
			var to = graph.children[this.to.name];
			if (this.from) {
				var from = graph.children[this.from.name];
				this.angle = to.angleTo(from);
				var i = to.findIntersect(from);
				this.x = i.x;
				this.y = i.y;
			} else {
				this.angle = to.angle;
			}

			if (this.to.type == "inside") {
				this.startAngle += Math.PI;
				this.angle -= Math.PI;
			}
			this.to.setup = true;
		}

		var p = graph.toScreenCoords({ x: this.x, y: this.y });
		var r = graph.toScreenCoords({ x: this.x + this.radius });

		this.setupDrawing(ctx);
		if (Math.abs(Math.abs(this.angle) - Math.PI/2) < 0.005) {
			r.x -= p.x;
			ctx.beginPath();

			var x1 = p.x - r.x*Math.sin(this.startAngle);
			var y1 = p.y - r.x*Math.cos(this.startAngle);

			ctx.moveTo(x1, y1);
			ctx.lineTo(x1  + r.x*Math.sin(this.startAngle + Math.PI/2),
				       y1  + r.x*Math.cos(this.startAngle + Math.PI/2));
			ctx.lineTo(p.x + r.x*Math.sin(this.startAngle + this.angle),
				       p.y + r.x*Math.cos(this.startAngle + this.angle));

			ctx.stroke();
			return;
		}

		ctx.beginPath();
		ctx.arc(p.x, p.y, r.x - p.x, -1*this.startAngle, -1*this.startAngle+this.angle, this.angle < 0);
		ctx.stroke();
	}
}

graph.prototype.register("angle", Angle);
