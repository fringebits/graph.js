function graph(options) {
	this.mixin(this, options);
}

graph.prototype = {
	__proto__: Graphic.prototype,
	grid: true,
	majorDivision: 5,
	minorDivision: 5,
	allowPan: true,
	allowZoom: true,

	addCanvas: function(width, height) {
		var canvas = document.createElement("canvas");
		canvas.setAttribute("width", width);
		canvas.setAttribute("height", height);
		canvas.width = width;
		canvas.height = height;
		return canvas;
	},

	start: function() {
		try {
			var graphs = document.getElementsByTagName("graph");
			for (var i = 0; i < graphs.length; i++) {
				var node = graphs[i];
				var g = graph.prototype.fromNode(node);
				g.axisCanvas = g.addCanvas(node.scrollWidth, node.scrollHeight);

				node.appendChild(g.axisCanvas);
				g.drawAxis(g.axisCanvas.getContext('2d'));

				g.plotCanvas = [];
				for (var j in g.children) {
					var c = g.addCanvas(node.scrollWidth, node.scrollHeight);
					g.plotCanvas.push(c);
				}

				for (var j in g.plotCanvas) {
					node.appendChild(g.plotCanvas[j]);
				}

				g.draw();
			}
		} catch(ex) {
			console.log("err: " + ex);
		}
	},

	fromNode: function(node) {
		var options = this.getBaseOptions(node);
		this.mixin(options, {
			majorDivision: this.getFloat("majordivision", node),
			minorDivision: this.getFloat("minordivision", node),
			grid: this.getBool("grid", node),
			allowPan: this.getBool("allowpan", node),
			allowZoom: this.getBool("allowzoom", node),
		})
		var g = new graph(options);
		this.setupAxis("x", node, g);
		this.setupAxis("y", node, g);
		this.setupAxis("z", node, g);

		var keys = Object.keys(node.children);
		for (var i = 0; i < keys.length; i++) {
			g.addNode(node.children[keys[i]]);
		}

		if (g.allowPan)
			node.addEventListener("mousedown", g, false);
		if (g.allowZoom)
			node.addEventListener("wheel", g, false);
		node.addEventListener("mouseover", g, false);
		node.addEventListener("mouseout", g, false);

		return g;
	},

	handleEvent: function(event) {
		switch(event.type) {
			case "wheel":
				event.preventDefault();
				this.mouseZoom(event);
				break;
			case "mousedown":
				this.startMouseDrag(event);
				break;
			case "mousemove":
				this.mouseDrag(event);
				break;
			case "mouseup":
				this.endMouseDrag(event);
				break;
			case "mouseout":
				this.hovering = false;
				break;
			case "mouseover":
				this.hovering = true;
				break;
			default:
		}
	},

	mouseZoom: function(event) {
		var box = event.target.getBoundingClientRect();
		this.zoom(event.deltaY, event.clientX - box.left, event.clientY - box.top);
	},

	zoom: function(delta, x, y) {
		if (this.startDragPoint)
			clearTimeout(this.startDragPoint);

		if (this.xaxis)
			this.xaxis.zoom(delta, x/this.width);
		if (this.yaxis)
			this.yaxis.zoom(delta, 1-y/this.height);

		this.drawAll();
		this.startDragPoint = setTimeout((function() {
			this.startDragPoint = null;
			this.drawAll();
		}).bind(this), 100);
	},

	startMouseDrag: function(event) {
		this.startDrag(event.clientX, event.clientY);
		window.addEventListener("mousemove", this, false);
		window.addEventListener("mouseup", this, false);
	},
	mouseDrag:      function(event) { this.drag(event.clientX,      event.clientY); },
	endMouseDrag:   function(event) {
		this.endDrag(event.clientX,   event.clientY);
		window.removeEventListener("mousemove", this, false);
		window.removeEventListener("mouseup", this, false);
	},

	startDrag: function(x,y) { this.startDragPoint = {x:x, y:y}; },
	drag: function(x,y) {
		if (!this.startDragPoint)
			return;

		var dx = x - this.startDrag.x;
		var dy = y - this.startDrag.y;
		if (this.xaxis) {
			var dx = (this.startDragPoint.x-x)*(this.xaxis.max-this.xaxis.min)/this.width;
			this.xaxis.shift(dx);
		}
		if (this.yaxis) {
			var dy = (y-this.startDragPoint.y)*(this.yaxis.max-this.yaxis.min)/this.height;
			this.yaxis.shift(dy);
		}

		this.drawAll();
		this.startDragPoint = {x:x, y:y};
	},
	endDrag: function(x,y) {
		this.startDragPoint = null;
		this.drawAll();
	},

	setupAxis: function(axisName, node, graph) {
		if (!node.hasAttribute(axisName + "1") || !node.hasAttribute(axisName + "2")) {
			graph[axisName + "axis"] = null;
			return;
		}

		var min = Graphic.prototype.getFloat(axisName + "1", node, -10);
		var max = Graphic.prototype.getFloat(axisName + "2", node, 10);
		graph[axisName + "axis"] = new Axis(Axis.prototype[axisName.toUpperCase()], min, max);
		graph[axisName + "axis"].majorDivision = graph.majorDivision;
		graph[axisName + "axis"].minorDivision = graph.minorDivision;
	},

	xaxis: new Axis(Axis.prototype.X, -10, 10),
	yaxis: new Axis(Axis.prototype.Y, -10, 10),
	zaxis: new Axis(Axis.prototype.Z, -10, 10),

	drawAll: function() {
		this.drawAxis(this.axisCanvas.getContext('2d'));
		this.draw();
	},

	drawAxis: function(ctx) {
		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		this.canvas = ctx.canvas;
		this.width = ctx.canvas.width;
		this.height = ctx.canvas.height;

		if (this.yaxis && this.width > this.height) {
			var range = (this.yaxis.max - this.yaxis.min)*this.width/this.height;
			this.xaxis.min = this.xaxis.min + (this.xaxis.max - this.xaxis.min)/2 - range/2;
			this.xaxis.max = this.xaxis.min + (this.xaxis.max - this.xaxis.min)/2 + range/2;
		} else if (this.height > this.width) {
			var range = (this.xaxis.max - this.xaxis.min)*this.height/this.width;
			this.yaxis.min = this.yaxis.min + (this.yaxis.max - this.yaxis.min)/2 - range/2;
			this.yaxis.max = this.yaxis.min + (this.yaxis.max - this.yaxis.min)/2 + range/2;
		}

		if (this.xaxis) {
			var offset = this.height/2;
			if (this.yaxis) {
				offset = this.yaxis.toScreenCoords(this, Math.min(this.yaxis.max, Math.max(this.yaxis.min,0)));
			}
			this.xaxis.draw(ctx, this, offset);
		}

		if (this.yaxis) {
			var offset = this.width/2;
			if (this.xaxis)
				offset = this.xaxis.toScreenCoords(this, Math.min(this.xaxis.max, Math.max(this.xaxis.min,0)));
			this.yaxis.draw(ctx, this, offset);
		}
	},

	draw: function() {
		for (var i in this.children) {
			if (this.children[i].setupPoints)
				this.children[i].setupPoints(this);
		}

		var index = 0;
		for (var i in this.children) {
			var ctx = this.plotCanvas[index].getContext("2d");
			ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
			this.children[i].draw(ctx, this);
			index++;
		}

		if (this.startTime)
			return;

		var step = (function(timestamp) {
			// Don't animate if we're dragging
			if (!this.hovering || this.startDragPoint) {
				requestAnimationFrame(step);
				return;
			}

			if (this.startTime == 0)
				this.startTime = Date.now();

			var dt = Date.now() - this.startTime;

			var redraw = false;
			var index = 0;
			for (var i in this.children) {
				if (!this.children[i].animate)
					continue;

				if (this.children[i].animate(dt)) {
					var ctx = this.plotCanvas[index].getContext("2d");
					ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
					this.children[i].draw(ctx, this);
					redraw = true;
				}
				index++;
			}

			if (redraw)
				requestAnimationFrame(step);

		}).bind(this);

		requestAnimationFrame(step);
	},
	startTime: 0,

	registeredNodes: { },
	register: function(name, graphic) {
		this.registeredNodes[name.toUpperCase()] = graphic;
	},

	addNode: function(node) {
		if (!this.children)
			this.children = {};

		var child;
		switch(node.nodeName) {
			case "POINT":
				child = (Point.prototype.fromNode(node));
				break;
			case "VECTOR":
				child = (Vector.prototype.fromNode(node));
				break;
			case "LINE":
				child = (Line.prototype.fromNode(node));
				break;
			default:
				break;
		}

		if (!child) {
			var n = this.registeredNodes[node.nodeName.toUpperCase()];
			if (n) child = n.prototype.fromNode(node);
		}

		if (child) {
			this.children[child.id || this.id++] = child;
		}
	},

	id: 0,

	toGraphCoords: function(point) {
		var p = {};
		for (axis of ["x", "y", "z"]) {
			if (point[axis] !== undefined && this[axis + "axis"]) {
				p[axis] = this[axis + "axis"].toGraphCoords(this, point[axis]);
			} else {
				if (axis === "x") p[axis] = 0;
				else if (axis === "y") p[axis] = 0;
			}
		}
		return p;
	},

	polarToXY: function(point) {
		return {
			x: point.r*Math.cos(point.theta),
			y :point.r*Math.sin(point.theta)
		}
	},

	toScreenCoords: function(point) {
		var p = {};

		if (point.x !== undefined && this.xaxis) {
			p.x = this.xaxis.toScreenCoords(this, point.x);
		} else {
			p.x = this.width/2;
		}

		if (point.y !== undefined && this.yaxis) {
			p.y = this.yaxis.toScreenCoords(this, point.y);
		} else {
			p.y = this.height/2;
		}

		return p;
	},
}
document.addEventListener("DOMContentLoaded", graph.prototype.start, false);

