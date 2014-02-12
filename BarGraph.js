function BarGraph() {
}

BarGraph.prototype = {
	__proto__: Graphic.prototype,
	bars: null,
	id: 0,

	addChild: function(node, base) {
		if (!base.children)
			base.children = {};

		var child;
		switch(node.nodeName) {
			case "BAR":
				child = (Bar.prototype.fromNode(node));
				break;
			default:
				Graphic.prototype.addChild(node, base);
				return;
		}

		if (child) {
			base.children[child.id || base.id++] = child;
		}
	},

	fromNode: function(node, base) {
		var p;
		try {
			p = new BarGraph();
		} catch(ex) {
			console.log("Ex: " + ex);
		}

		p.color = this.getString("color", node, "blue");
		p.fill = this.getString("fill", node);
		p.label = this.getString("label", node);
		p.id = this.getString("id", node, this.id);

		for (var i = 0; i < node.childNodes.length; i++) {
			this.addChild(node.childNodes[i], p);
		}

		return p;
	},

	draw: function(ctx, graph) {
		var x = 0;
		for (var childId in this.children) {
			var child = this.children[childId];

			if (child instanceof Bar) {
				x += child.paddingLeft;
				var p = graph.toScreenCoords({ x: x, y: 0 });
				ctx.save();
				ctx.translate(p.x, p.y);
				child.draw(ctx, graph);
				ctx.restore();
				x += child.width + child.paddingRight;
			}
		}
	},
}

function Bar(options) {
	this.mixin(this, options);
}
Bar.prototype = {
	width: 1,
	height: 0,
	paddingLeft: 0.1,
	paddingRight: 0.1,
	__proto__: Graphic.prototype,

	fromNode: function(node, base) {
		var p;
		try {
			var options = this.getBaseOptions(node);
			this.mixin(options, {
				paddingLeft: Graphic.prototype.getFloat("paddingLeft", node),
				paddingRight: Graphic.prototype.getFloat("paddingRight", node),
				label: node.textContent,
			});
			p = new Bar(options);
			p.resolveStyles(node, options);
		} catch(ex) {
			console.log("Ex: " + ex);
		}
		p = Graphic.prototype.fromNode(node, p);

		return p;
	},

	draw: function(ctx, graph) {
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

graph.prototype.register("bargraph", BarGraph);
graph.prototype.register("bar", Bar);
