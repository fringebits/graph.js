(function() {
var GraphElementPrototype = Object.create(Graphic);

GraphElementPrototype.createdCallback = function(root) {
	console.log("Graph");
	Graphic.createdCallback.call(this);
	this.majorDivision = 5;
	this.minorDivision = 1;

	this.squareAxis = this.getBool("squareAxis", this, false);
	this.panning    = this.getBool("allowPan", this, true);
	this.zooming    = this.getBool("allowZoom", this, true);

	this.setupAxis.call(this, "x");
	this.setupAxis.call(this, "y");
	this.setupAxis.call(this, "z");

	for (var j in this.children) {
		var child = this.children[j];
	}
	this.width = this.scrollWidth;
	this.height = this.scrollHeight;
};

GraphElementPrototype.attachedCallback = function() {
	Graphic.attachedCallback.call(this);

	this.ctx = this.canvas.getContext("2d");
	setTimeout(this.draw.bind(this), 100);
	console.log("Graph attached");
};

GraphElementPrototype.attributeChangedCallback = function (attr, oldVal, newVal) {
};

GraphElementPrototype.layers = [];

GraphElementPrototype.addCanvas = function(width, height) {
	return new CanvasRenderer(width, height);
};

GraphElementPrototype.mouseZoom = function(event) {
	var box = event.target.getBoundingClientRect();
	this.zoom(event.deltaY, event.clientX - box.left, event.clientY - box.top);
};

GraphElementPrototype.zoom = function(delta, x, y) {
	if (this.startDrag) {
		clearTimeout(this.startDrag);
	}

	if (this.xaxis) {
		this.xaxis.zoom(delta, x/this.scrollWidth);
	}

	if (this.yaxis) {
		this.yaxis.zoom(delta, 1-y/this.scrollHeight);
	}
};

GraphElementPrototype.startMouseDrag = function(event) {
	this.startDrag(event.clientX, event.clientY);
};

GraphElementPrototype.mouseDrag = function(event) { this.drag(event.clientX,      event.clientY); };

GraphElementPrototype.endMouseDrag = function(event) {
	this.endDrag(event.clientX,   event.clientY);
};

GraphElementPrototype.startDrag = function(x,y) {
	this.startDragPoint = {x:x, y:y};
};

GraphElementPrototype.drag = function(x,y) {
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
};

GraphElementPrototype.endDrag = function(x,y) {
	this.startDragPoint = null;
	this.invalidate = true;
	setTimeout(this.draw.bind(this), 0);
};

GraphElementPrototype.setupAxis = function(axisName, node, graph) {
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
	axis.setAttribute("grid", Graphic.getBool("showGrid", this, true));
	axis.setAttribute("ticks", Graphic.getBool("showTicks", this, true));
	axis.setAttribute("min", Graphic.getFloat(axisName + "1", this, -10));
	axis.setAttribute("max", Graphic.getFloat(axisName + "2", this, 10));
	axis.setAttribute("divisions", this.majorDivision + "," + this.minorDivision);
	axis.setAttribute("width", this.scrollWidth);
	axis.setAttribute("height", this.scrollHeight);
	this[axisName + "axis"] = axis;
	this.insertBefore(axis, this.firstChild);
};

GraphElementPrototype.drawAxis = function(ctx) {
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
};

GraphElementPrototype.getYOffset = function() {
	var offset = this.scrollWidth/2;
	if (this.yaxis) {
		offset = this.xaxis.toScreenCoords(this, Math.min(this.xaxis.max, Math.max(this.xaxis.min,0)));
	}
	return offset;
};

GraphElementPrototype.getXOffset = function() {
	var offset = this.scrollHeight/2;
	if (this.xaxis) {
		offset = this.yaxis.toScreenCoords(this, Math.min(this.yaxis.max, Math.max(this.yaxis.min,0)));
	}
	return offset;
};

GraphElementPrototype.draw = function() {
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
};

GraphElementPrototype.toGraphCoords = function(point) {
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
};

GraphElementPrototype.polarToXY = function(point) {
	return {
		x: point.r*Math.cos(point.theta),
		y :point.r*Math.sin(point.theta)
	}
};

GraphElementPrototype.toScreenCoords = function(point) {
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
};

window.GraphElement = document.registerElement('x-graph', {
	prototype: GraphElementPrototype
});

/*
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
*/
})();