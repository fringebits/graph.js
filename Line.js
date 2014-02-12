function Line(x1, x2, y1, y2) {
	this.x1 = x1;
	this.x2 = x2;
	this.y1 = y1;
	this.y2 = y2;
}

Line.prototype = {
	__proto__: Graphic.prototype,
	_x1: 0,
	_y1: 0,
	_x2: 1,
	_y2: 1,
	graph: null,

	set x1(val) { this._x1 = val; },
	get x1() { return this._x1; },

	set y1(val) { this._y1 = val; },
	get y1() { return this._y1; },

	set z1(val) { this._z1 = val; },
	get z1() { return this._z1; },

	showPoint: false,
	scale: 1,

	fromNode: function(node, base) {
		var p = base;
		if (!p) {
			var options = this.getBaseOptions(node);
			this.mixin(options, {
				x1: this.getFloat("x1", node),
				x2: this.getFloat("x2", node),
				y1: this.getFloat("y1", node),
				y2: this.getFloat("y2", node),
				showPoint: this.getBool("showPoint", node),
				from: this.getNode("from", node),
				to: this.getNode("to", node),
				scale: this.getFloat("scale", node)
			});
			p = new Line(options);
			p.resolveStyles(node, options);
		}

		p = Graphic.prototype.fromNode(node, p);

		return p;
	},

	setupPoints: function(graph) {
		if (this.copy && !this.copy.setup) {
			var copy = graph.children[this.copy.name];
			this.x2 = this.x1 + copy.x2 - copy.x1;
			this.y2 = this.y1 + copy.y2 - copy.y1;
			this.copy.setup = true;
		}

		if (this.offset && !this.offset.setup) {
			var offset = graph.children[this.offset.name];
			this.x2 = (this.x2 - this.x1) + offset.x2;
			this.y2 = (this.y2 - this.y1) + offset.y2;
			this.x1 = offset.x2;
			this.y1 = offset.y2;
			this.offset.setup = true;
		}

		if (this.from && !this.from.setup) {
			var from = graph.children[this.from.name];
			this.x1 = from.x2;
			this.y1 = from.y2;
			this.from.setup = true;
		}

		if (this.to && !this.to.setup) {
			var to = graph.children[this.to.name];
			if (this.to.type == "normal") {
				this.y2 = this.y1 - 1/to.slope;
				this.x2 = this.x1 + 1;

				var i = this.findIntersect(to);
				this.y2 = Math.round(i.y*10)/10;
				this.x2 = Math.round(i.x*10)/10;
			} else {
				this.x2 = to.x2;
				this.y2 = to.y2;
			}
			this.to.setup = true;
		}
	},

	draw: function(ctx, graph) {
		var p1 = graph.toScreenCoords({ x: this.x1, y: this.y1 });
		var p2 = graph.toScreenCoords({ x: this.x2*this.scale, y: this.y2*this.scale });

		this.setupDrawing(ctx);
		ctx.beginPath();
		ctx.moveTo(p1.x, p1.y);
		ctx.lineTo(p2.x, p2.y);
		ctx.stroke();

		if (this.showPoint) {
			if (this.label)
				ctx.fillText(this.label, p2.x + 4, p2.y + 8);
			else 
				ctx.fillText("(" + Math.round(this.x2*this.scale*10)/10 + "," +
					               Math.round(this.y2*this.scale*10)/10 + ")", p2.x + 4, p2.y + 8);
		}
 	},

 	findIntersect: function(line) {
 		if (this.slope == line.slope) {
 			return null;
 		}

 		var obj = {};
 		var m = this.slope;
 		var b = this.intercept;
 		obj.x = (line.intercept - b) / (m - line.slope);
 		obj.y = m*obj.x + b;
 		return obj
 	},

 	get intercept() {
 		delete this.intercept;
 		return this.intercept = this.y2*this.scale - this.slope * this.x2*this.scale;
 	},

 	get slope() {
 		delete this.slope;
 		return this.slope = (this.y2*this.scale - this.y1) / (this.x2*this.scale - this.x1);
 	},

 	get angle() {
 		delete this.angle;
 		return this.angle = Math.atan(this.slope);
 	},

 	angleTo: function(line) {
 		return line.angle - this.angle;
 	},
}
