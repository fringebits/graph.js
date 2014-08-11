function renderer() {
}

renderer.prototype = {
	beginPath: function() { },
	moveTo: function(x, y) { },
	lineTo: function(x, y) { },
	drawText: function(text, x, y) { },
}

function CanvasRenderer(width, height) {
	renderer.call(this);
	this.element = document.createElement("canvas");
	this.ctx = this.element.getContext('2d');

	this.element.setAttribute("width", width);
	this.element.setAttribute("height", height);
	this.element.width = width;
	this.element.height = height;
}

CanvasRenderer.prototype = {
	__proto__: renderer.prototype,
	set strokeStyle(val) { this.ctx.strokeStyle = val; },
	set fillStyle(val) { this.ctx.fillStyle = val; },
	set lineWidth(val) { this.ctx.lineWidth = val; },

	get width() { return this.element.width; },
	get height() { return this.element.height; },

	beginPath: function() { this.ctx.beginPath(); },
	moveTo: function(x, y) { this.ctx.moveTo(x, y); },
	lineTo: function(x, y) { this.ctx.lineTo(x, y); },
	stroke: function() { this.ctx.stroke(); },
	fill: function() { this.ctx.fill(); },
	clearRect: function(x,y,w,h) { this.ctx.clearRect(x,y,w,h); },
	save: function() { this.ctx.save(); },
	restore: function() { this.ctx.restore(); },
	translate: function(x, y) { this.ctx.translate(x,y); },
	rotate: function(angle) { this.ctx.rotate(angle); },
	strokeRect: function(x,y,w,h) { this.ctx.strokeRect(x,y,w,h); },
	fillRect: function(x,y,w,h) { this.ctx.fillRect(x,y,w,h); },
	measureText: function(label) { return this.ctx.measureText(label); },
	fillText: function(label, x, y) { this.ctx.fillText(label, x, y); },
	arc: function(x, y, r, start, end, flags) { this.ctx.arc(x,y,r,start,end,flags); },
}

xtag.register('x-accordion', {
  // extend existing elements
  extends: 'div',
  lifecycle: {
    created: function() {
    },

    inserted: function() {
		var options = this.getBaseOptions(node);
		this.mixin(options, {
			majorDivision: this.getFloat("majordivision", node),
			minorDivision: this.getFloat("minordivision", node),
			grid: this.getBool("grid", node),
			allowPan: this.getBool("allowpan", node),
			allowZoom: this.getBool("allowzoom", node),
		});

		this.setupAxis("x", node, g);
		this.setupAxis("y", node, g);
		this.setupAxis("z", node, g);

		var keys = Object.keys(node.children);
		for (var i = 0; i < keys.length; i++) {
			g.addNode(node.children[keys[i]]);
		}

		if (g.allowPan) {
			node.addEventListener("mousedown", g, false);
		}

		if (g.allowZoom) {
			node.addEventListener("wheel", g, false);
		}

		node.addEventListener("mouseover", g, false);
		node.addEventListener("mouseout", g, false);
		node.addEventListener("invalidate", g, false);

		return g;
	},

	removed: function(){
	},

    attributeChanged: function(){
    },

	  events: {
	    'click:delegate(x-toggler)': function(){
	      // activate a clicked toggler
	    }
	  },
	  accessors: {
	    'togglers': {
	      get: function(){
	        // return all toggler children
	      },
	      set: function(value){
	        // set the toggler children
	      }
	    }
	  },
	  methods: {
	    nextToggler: function(){
	      // activate the next toggler
	    },
	    previousToggler: function(){
	      // activate the previous toggler
	    }
	  },
  },

function graph(options) {
	Graphic.call(this, options);
}

graph.prototype = {
	__proto__: Graphic.prototype,
	grid: false,
	majorDivision: 5,
	minorDivision: 5,
	allowPan: true,
	allowZoom: true,
	layers: [],

	addCanvas: function(width, height) {
		return new CanvasRenderer(width, height);
	},

	start: function() {
		var graphs = document.getElementsByTagName("graph");
		for (var i = 0; i < graphs.length; i++) {
			var node = graphs[i];
			var g = graph.prototype.fromNode(node);
			g.axisCanvas = g.addCanvas(node.scrollWidth, node.scrollHeight);

			node.appendChild(g.axisCanvas.element);
			// g.drawAxis(g.axisCanvas);

			g.plotCanvas = [];
			for (var j in g.children) {
				var c = g.addCanvas(node.scrollWidth, node.scrollHeight);
				g.plotCanvas.push(c);
			}

			for (var j in g.plotCanvas) {
				node.appendChild(g.plotCanvas[j].element);
			}

			for (var j in g.children) {
				var child = g.children[j];
				child.setup(g);
			}

			g.draw();
		}
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
			case "invalidate":
				if (!this.animating) {
					this.draw();
				}
				break;
			default:
		}

		for (var i in this.children) {
			if (this.children[i].intersects(event.clientX, event.clientY)) {
				this.children[i].handleEvent(event);
			}
		}

	},

	mouseZoom: function(event) {
		var box = event.target.getBoundingClientRect();
		this.zoom(event.deltaY, event.clientX - box.left, event.clientY - box.top);
	},

	_invalidate: true,
	get invalidate() { return this._invalidate; },
	set invalidate(val) { this._invalidate = val; },

	zoom: function(delta, x, y) {
		if (this.startDragPoint)
			clearTimeout(this.startDragPoint);

		if (this.xaxis) {
			this.xaxis.zoom(delta, x/this.width);
		}

		if (this.yaxis) {
			this.yaxis.zoom(delta, 1-y/this.height);
		}

		this.invalidate = true;
		this.draw();
		this.startDragPoint = setTimeout((function() {
			this.invalidate = true;
			this.startDragPoint = null;
			this.draw();
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

	startDrag: function(x,y) {
		this.startDragPoint = {x:x, y:y};
	},

	drag: function(x,y) {
		if (!this.startDragPoint) {
			return;
		}

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

		this.invalidate = true;
		this.draw();
		this.startDragPoint = {x:x, y:y};
	},

	endDrag: function(x,y) {
		this.startDragPoint = null;
		this.invalidate = true;
		this.draw();
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

	drawAxis: function(ctx) {
		if ((!this.xaxis || !this.xaxis.invalidate) && (!this.yaxis || !this.yaxis.invalidate)) {
			return;
		}

		ctx.clearRect(0, 0, ctx.width, ctx.height);
		this.canvas = ctx.canvas;
		this.width = ctx.width;
		this.height = ctx.height;

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
			this.xaxis.invalidate = false
		}

		if (this.yaxis) {
			var offset = this.width/2;
			if (this.xaxis)
				offset = this.xaxis.toScreenCoords(this, Math.min(this.xaxis.max, Math.max(this.xaxis.min,0)));
			this.yaxis.draw(ctx, this, offset);
			this.yaxis.invalidate = false
		}
	},

	draw: function() {
		this.drawAxis(this.axisCanvas);

		var redraw = 0;
		var index = 0;

		for (var i in this.children) {
			if (this.invalidate || this.children[i].invalidate) {
				// Do this before we draw because drawing might re-invalidate the Graphic
				this.children[i].invalidate = false;
				var ctx = this.plotCanvas[index];
				ctx.clearRect(0, 0, ctx.width, ctx.height);
				this.children[i].draw(ctx, this);
				redraw = redraw || this.children[i].invalidate;
			}

			index++;
		}

		this._invalidate = false;

		if (redraw) {
			this.animating = true;
			requestAnimationFrame(this.draw.bind(this));
		} else {
			this.animating = false;
		}
	},

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

		var x = point.x;
		if (x !== undefined && this.xaxis) {
			p.x = this.xaxis.toScreenCoords(this, x);
		} else {
			p.x = this.width/2;
		}

		var y = point.y;
		if (y !== undefined && this.yaxis) {
			p.y = this.yaxis.toScreenCoords(this, y);
		} else {
			p.y = this.height/2;
		}

		return p;
	},
}

document.addEventListener("DOMContentLoaded", graph.prototype.start, false);
