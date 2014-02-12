function Graphic() { }
Graphic.prototype = {
	x: 0,
	y: 0,
	color: "blue",
	fill: undefined,
	radius: 5,

	getInt: function(name, node, def) {
		var res = this.getString(name, node, def);
		if (res != undefined)
			return parseInt(res);
		return res;
	},

	getFloat: function(name, node, def) {
		var res = this.getString(name, node, def);
		if (res != undefined)
			return parseFloat(res);
		return res;
	},

	getString: function(name, node, def) {
		if (node.hasAttribute(name))
			return node.getAttribute(name);
		return def;
	},

	getBool: function(name, node, def) {
		if (node.hasAttribute(name))
			return node.getAttribute(name) === "true";
		return def;
	},

	mixin: function(base, options) {
		for (var option in options) {
			if (options[option] != undefined) {
				base[option] = options[option];
			}
		}
	},

	getBaseOptions: function(node) {
		return {
			x: this.getFloat("x", node),
			y: this.getFloat("y", node),
			radius: this.getFloat("radius", node),
			height: this.getFloat("height", node),
			width: this.getFloat("width", node),
			val: node.textContent,

			color: this.getString("color", node),
			stroke: this.getString("stroke", node),
			fill: this.getString("fill", node),
			label: this.getString("label", node, node.textContent),
			id: this.getString("id", node),
        };
    },

    _resolveStyle: function(node, style, options, name, styleName, type) {
		if (!options[name]) {
			var prop = style.getPropertyValue(styleName || name);
			if (prop) {
				if (type === "float") {
					if (prop != "auto")
						this[name] = parseFloat(prop);
				} else {
					this[name] = prop;
				}
			}
		}    	
    },

	resolveStyles: function(node, options) {
		var style = window.getComputedStyle(node);
		this._resolveStyle(node, style, options, "color");
		this._resolveStyle(node, style, options, "stroke");
		this._resolveStyle(node, style, options, "fill", "background-color");
		this._resolveStyle(node, style, options, "width", null, "float");
		this._resolveStyle(node, style, options, "height", null, "float");
		this._resolveStyle(node, style, options, "stroke-width", "lineWidth", "float");
		this._resolveStyle(node, style, options, "padding-left", "paddingLeft", "float");
		this._resolveStyle(node, style, options, "padding-right", "paddingRight", "float");
	},

	setupDrawing: function(ctx) {
		ctx.strokeStyle = this.stroke || this.color;
		ctx.fillStyle = this.fill;
		ctx.lineWidth = this.lineWidth;
	},

	getNode: function(name, node, def) {
		var text = this.getString(name, node, def);
		if (!text) return undefined;

		if (text.startsWith("normal-"))
			return { type: "normal", name: text.replace("normal-", "") };
		else if (text.startsWith("inside-"))
			return { type: "inside", name: text.replace("inside-", "") };
		else
			return { type: "end", name: text };
	},

 	animate: function(dt) {
 		if (!this.children)
 			return false;

 		var invalidate = false;
 		for (var i in this.children) {
 			invalidate |= this.children[i].animate(dt, this);
 		}
 		return invalidate;
 	},

	fromNode: function(node, base) {
		if (!base) return null;
		for (var i = 0; i < node.children.length; i++) {
			this.addChild(node.children[i], base);
		}
		return base;
	},

	id: 0,
	addChild: function(node, base) {
		if (!base.children)
			base.children = {};

		var child;
		switch(node.nodeName) {
			case "ANIMATE":
				child = (Animate.prototype.fromNode(node));
				break;
			default:
				console.log("Can't add " + node.nodeName);
				break;
		}

		if (child)
			base.children[child.id || base.id++] = child;
	},
}