(function() {

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

	this.invalidate = true;
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

function Graph(options) {
	Graphic.call(this, options);
	this.majorDivision = 5;
	this.minorDivision = 1;

	this.squareAxis = this.getBool("squareAxis", this, false);
	this.panning = Graphic.prototype.getBool("allowPan", this, true);
	this.zooming = Graphic.prototype.getBool("allowZoom", this, true);

	this.setupAxis.call(this, "x");
	this.setupAxis.call(this, "y");
	this.setupAxis.call(this, "z");

	for (var j in this.children) {
		var child = this.children[j];
	}
	this.width = this.scrollWidth;
	this.height = this.scrollHeight;
}

Graph.prototype = {
	__proto__: Graphic.prototype,
	layers: [],

	addCanvas: function(width, height) {
		return new CanvasRenderer(width, height);
	},

	mouseZoom: function(event) {
		var box = event.target.getBoundingClientRect();
		this.zoom(event.deltaY, event.clientX - box.left, event.clientY - box.top);
	},

	zoom: function(delta, x, y) {
		if (this.startDrag) {
			clearTimeout(this.startDrag);
		}

		if (this.xaxis) {
			this.xaxis.zoom(delta, x/this.scrollWidth);
		}

		if (this.yaxis) {
			this.yaxis.zoom(delta, 1-y/this.scrollHeight);
		}
	},

	startMouseDrag: function(event) {
		this.startDrag(event.clientX, event.clientY);
	},

	mouseDrag:      function(event) { this.drag(event.clientX,      event.clientY); },

	endMouseDrag:   function(event) {
		this.endDrag(event.clientX,   event.clientY);
	},

	startDrag: function(x,y) {
		this.startDragPoint = {x:x, y:y};
	},

	drag: function(x,y) {
		if (!this.startDragPoint) {
			return;
		}

		var dx = x - this.startDragPoint.x;
		var dy = y - this.startDragPoint.y;
		if (this.xaxis) {
			var dx = (this.startDragPoint.x-x)*(this.xaxis.max-this.xaxis.min)/this.scrollWidth;
			this.xaxis.shift(dx);
		}

		if (this.yaxis) {
			var dy = (y-this.startDragPoint.y)*(this.yaxis.max-this.yaxis.min)/this.scrollHeight;
			this.yaxis.shift(dy);
		}

		this.startDragPoint = {x:x, y:y};
	},

	endDrag: function(x,y) {
		this.startDragPoint = null;
		this.invalidate = true;
		setTimeout(this.draw.bind(this), 0);
	},

	setupAxis: function(axisName, node, graph) {
		if (!this.hasAttribute(axisName + "1") || !this.hasAttribute(axisName + "2")) {
			this[axisName + "axis"] = null;
			return;
		}

		this[axisName + "axis"] = this.querySelector("x-graph-axis[axis=" + axisName + "]")
		if (this[axisName + "axis"]) {
			return;
		}

		var axis = document.createElement("x-graph-axis");
		axis.setAttribute("axis", axisName);
		axis.setAttribute("grid", Graphic.prototype.getBool("showGrid", this, true));
		axis.setAttribute("ticks", Graphic.prototype.getBool("showTicks", this, true));
		axis.setAttribute("min", Graphic.prototype.getFloat(axisName + "1", this, -10));
		axis.setAttribute("max", Graphic.prototype.getFloat(axisName + "2", this, 10));
		axis.setAttribute("divisions", this.majorDivision + "," + this.minorDivision);
		axis.setAttribute("width", this.scrollWidth);
		axis.setAttribute("height", this.scrollHeight);
		this[axisName + "axis"] = axis;
		this.insertBefore(axis, this.firstChild);
	},

	drawAxis: function(ctx) {
		var changed = false;
		if (this.yaxis && this.scrollWidth > this.scrollHeight) {
			var range = (this.yaxis.max - this.yaxis.min)*this.scrollWidth/this.scrollHeight;
			var min = this.xaxis.min;
			var max = this.xaxis.max;

			this.xaxis.min = this.xaxis.min + (this.xaxis.max - this.xaxis.min)/2 - range/2;
			this.xaxis.max = this.xaxis.min + (this.xaxis.max - this.xaxis.min)/2 + range/2;

			changed = (min != this.xaxis.min) || (max != this.xaxis.max);

			this.xaxis.cache = {};
			this.xaxis.range = this.xaxis.max - this.xaxis.min;
		} else if (this.scrollHeight > this.scrollWidth) {
			var range = (this.xaxis.max - this.xaxis.min)*this.scrollHeight/this.scrollWidth;
			var min = this.yaxis.min;
			var max = this.yaxis.max;

			this.yaxis.min = this.yaxis.min + (this.yaxis.max - this.yaxis.min)/2 - range/2;
			this.yaxis.max = this.yaxis.min + (this.yaxis.max - this.yaxis.min)/2 + range/2;

			changed = (min != this.yaxis.min) || (max != this.yaxis.max);

			this.yaxis.cache = {};
			this.yaxis.range = this.yaxis.max - this.yaxis.min;
		}

		return changed;
	},

	getYOffset: function() {
		var offset = this.scrollWidth/2;
		if (this.yaxis) {
			offset = this.xaxis.toScreenCoords(this, Math.min(this.xaxis.max, Math.max(this.xaxis.min,0)));
		}
		return offset;
	},

	getXOffset: function() {
		var offset = this.scrollHeight/2;
		if (this.xaxis) {
			offset = this.yaxis.toScreenCoords(this, Math.min(this.yaxis.max, Math.max(this.yaxis.min,0)));
		}
		return offset;
	},

	draw: function() {
		if (this.invalidate) {
			while (this.squareAxis && this.drawAxis()) {
				// do nothing
			}
		}

		var redraw = 0;
		var index = 0;

		for (var i in this.childNodes) {
			var child = this.childNodes[i];
			if (child.draw && (this.invalidate || child.shouldInvalidate())) {
				// Do this before we draw because drawing might re-invalidate the Graphic
				child.setInvalidate(false);
				child.draw(this);
				redraw = redraw || child.shouldInvalidate();
			}

			index++;
		}

		this.invalidate = false;

		if (redraw) {
			requestAnimationFrame(this.draw.bind(this));
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
			p.x = this.scrollWidth/2;
		}

		var y = point.y;
		if (y !== undefined && this.yaxis) {
			p.y = this.yaxis.toScreenCoords(this, y);
		} else {
			p.y = this.scrollHeight/2;
		}

		return p;
	},
}

xtag.register('x-graph', {
	extends: "div",
	lifecycle: {
		created: function() {
			Graph.call(this);
		},

		inserted: function() {
			this.invalidate = true;
			setTimeout(this.draw.bind(this), 100);
		},

		removed: function(){ },
		attributeChanged: function(){ },
	},

	events: {
		'mousedown': function(event) {
			if (!this.panning) {
				return;
			}
			this.startMouseDrag.call(this, event);
		},

		'wheel': function(event) {
			if (!this.zooming) {
				return;
			}
			event.preventDefault();
			this.mouseZoom(event);
		},

		"mousemove": function(event) {
			this.mouseDrag.call(this, event);
		},

		"mouseup": function(event) {
			this.endMouseDrag.call(this, event);
		},

		"invalidate": function(event) {
			if (!this.invalidate) {
				this.invalidate = true;
				setTimeout(this.draw.bind(this), 0);
			}
		}

	},

	accessors: {
	},

	methods: Graph.prototype
});
})();
