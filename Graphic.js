function mixin(base, options, functionGetters) {
	for (var option in options) {
		if (options[option] != undefined) {
			if (option.startsWith("on")) {
				base[option] = new Function(["event"], options[option]);
			} else if (functionGetters) {
				createAnimatableProperty(base, option, options[option]);
			} else {
				base[option] = options[option];
			}
		}
	}
}

var Graphic = Object.create(HTMLElement.prototype);

Graphic.createdCallback = function() {
	// mixin(this, options, true);
	// this.canvas = document.createElement("canvas");
	// this.appendChild(this.canvas);
	this.invalidate = true;
}

var currentScript = document._currentScript || document.currentScript;
Graphic.attachedCallback = function() {
	var importDoc = currentScript.ownerDocument;
	var template = importDoc.querySelector();

	// fix styling for polyfill
	if (Platform.ShadowCSS && template) {
		var styles = template.content.querySelectorAll('style');
		for (var i = 0; i < styles.length; i++) {
			var style = styles[i];
			var cssText = Platform.ShadowCSS.shimStyle(style, 'x-graph');
			Platform.ShadowCSS.addCssToDocument(cssText);
			style.remove();
		}
	}

	// create shadowRoot and append template to it.
	var shadowRoot = this.createShadowRoot();
	shadowRoot.appendChild(template.content.cloneNode(true));
	this.canvas = template.content.querySelector("canvas");
}

Graphic.x = 0;
Graphic.y = 0;

Graphic.shouldInvalidate = function() {
	return this.invalidate;
};

Graphic.setInvalidate = function(val) {
	this.invalidate = val;
};

Graphic.getInt = function(name, node, def) {
	var res = this.getString(name, node, def);
	if (res != undefined)
		return parseInt(res);
	return res;
};

Graphic.getFloat = function(name, node, def) {
	var res = this.getString(name, node, def);
	if (res != undefined) {
		var f = parseFloat(res);
		if (isNaN(f) || f.toString() !== res) {
			console.log("Got '" + f.toString() + "' not '" + res + "'");
			return res;
		}
		console.log("Got " + f.toString());
		return f;
	}
	console.log("Got '" + res + "'");

	return res;
};

Graphic.getString = function(name, node, def) {
	if (node.hasAttribute(name))
		return node.getAttribute(name);
	return def;
};

Graphic.getBool = function(name, node, def) {
	if (node.hasAttribute(name))
		return node.getAttribute(name) === "true";
	return def;
};

Graphic.mixin = function(base, options, functionGetters) {
	for (var option in options) {
		if (options[option] != undefined) {
			if (option.startsWith("on")) {
				base[option] = new Function(["event"], options[option]);
			} else if (functionGetters) {
				createAnimatableProperty(base, option, options[option]);
			} else {
				base[option] = options[option];
			}
		}
	}
};

Graphic.getBaseOptions = function(node) {
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

		onmouseover: this.getString("onmouseover", node),
		onmouseout: this.getString("onmouseout", node),
	};
};

Graphic._resolveStyle = function(node, style, options, name, styleName, type) {
	if (!options[name]) {
		var prop = style.getPropertyValue(styleName || name);
		if (prop) {
			if (type === "float") {
				if (prop != "auto") {
					this[name] = parseFloat(prop);
				}
			} else {
				this[name] = prop;
			}
		}
	}
};

Graphic.resolveStyles = function(node, options) {
	var style = window.getComputedStyle(node);
	this._resolveStyle(node, style, options, "color");
	this._resolveStyle(node, style, options, "stroke");
	this._resolveStyle(node, style, options, "fill", "background-color");
	this._resolveStyle(node, style, options, "width", null, "float");
	this._resolveStyle(node, style, options, "height", null, "float");
	this._resolveStyle(node, style, options, "strokeWidth", "stroke-width", "float");
	this._resolveStyle(node, style, options, "paddingLeft", "padding-left", "float");
	this._resolveStyle(node, style, options, "paddingRight", "padding-right", "float");
	this._resolveStyle(node, style, options, "transitionDuration", "transition-duration", "float");

	node.style.color = "";
	node.style.stroke = "";
	node.style.transitionDuration = "";
	node.style.backgroundColor = "";
};

Graphic.setup = function() { };

Graphic.setupDrawing = function(ctx) {
	ctx.strokeStyle = this.stroke || this.color;
	ctx.fillStyle = this.fill;
	ctx.lineWidth = this.lineWidth;
};

Graphic.getNode = function(name, node, def) {
	var text = this.getString(name, node, def);
	if (!text) return undefined;

	if (text.startsWith("normal-"))
		return { type: "normal", name: text.replace("normal-", "") };
	else if (text.startsWith("inside-"))
		return { type: "inside", name: text.replace("inside-", "") };
	else
		return { type: "end", name: text };
};

Graphic.fromNode = function(node, base) {
	if (!base) return null;

	// base.resolveStyles(node, options);
	base.node = node;

	for (var i = 0; i < node.children.length; i++) {
		this.addChild(node.children[i], base);
	}

	return base;
};

Graphic.intersects = function(x, y) {
	return true;
};

Graphic.handleEvent = function(event) {
	if (this.children) {
		for (var i in this.children) {
			this.children[i].handleEvent(event);
		}
	}

	if (this["on" + event.type]) {
		this["on" + event.type].call(this, event);
	}
};

Graphic.id = 0,
Graphic.addChild = function(node, base) {
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

	if (child) {
		base.children[child.id || base.id++] = child;
	}
};

FunctionUtils.checkVars = function(val, vars) {
	var pass = false;

	(function() {
		var prev = "";
		for (var i in vars) {
			prev += "var " + vars[i] + " = " + 0 + "; ";
		}

		try {
			eval(prev + val);
			pass = true;
		} catch(ex) {
			// console.log("EX = " + ex);
		}
	}).apply(this);

	return pass;
};

FunctionUtils.getFromString = function(val) {
	var useTime = false;
	var args = [ [], ["x"], ["y"], ["r"], ["theta"] ];

	var build = (function(arg) {
		var iterate = arg[0];
		var crossAxis = undefined;
		var polar = false;

		switch (iterate) {
			case "x": crossAxis = "y"; break;
			case "y": crossAxis = "x"; break;
			case "theta": polar = true; crossAxis = "r"; break;
			case "r": polar = true; crossAxis = "theta"; break;
			default:
				return null;
		}

		return {
			fun: new Function(arg, "return " + val),
			iterate: iterate,
			crossAxis: crossAxis,
			polar: polar,
			useTime: useTime
		}
	}).bind(this)

	for (var i = 0; i < args.length; i++) {
		var arg = args[i];
		if (this.checkVars(val, arg)) {
			return build(arg);
		} else if (this.checkVars(val, arg.concat(["t"]))) {
			useTime = true;
			return build(arg.concat(["t"]));
		}
	}

	return null;
};

function createAnimatableProperty(obj, name, val) {
	var useTime = false;
	var setValue = function(a) {
		useTime = false;
		var foo;

		try {
			foo = new Function([], "return " + a);
			foo(3);
		} catch(ex) {
			try {
				useTime = true;
				foo = new Function(["t"], "return " + a);
				foo(3);
			} catch(ex) {
				useTime = false;
				foo = new Function([], "return '" + a + "'");
			}
		}

		return foo;
	}
	var value = setValue(val);

	var startTime = 0;
	var startVal = null;
	var endVal = null;

	var interpolate = function(t) { return t; }
	var step = function() {
		var now = Date.now();
		var t = now - startTime;

		this.invalidate = true;
		var d = this.transitionDuration*1000;
		if (t >= d) {
			value = endVal;
			startVal = null;
			endVal = null;
			return value(t);
		}

		var dt = interpolate(t/d);
		return startVal + (endVal(t) - startVal)*dt;
	}

	var fireEvent = function() {
		var evt = document.createEvent('CustomEvent');
		evt.initCustomEvent("invalidate", true, true, null);
		this.dispatchEvent(evt);
	};

	Object.defineProperty(obj, name, {
		configurable: true,
		get: function() {
			if (startTime == -1) {
				startTime = Date.now();
			}

			if (endVal != null) {
				return step.call(this);
			}

			if (useTime) {
				this.invalidate = true;
			}

			return value(Date.now() - startTime);
		},

		set: function(val) {
			if (val === value) {
				return;
			}

			this.invalidate = true;

			if (this.transitionDuration && this.transitionDuration > 0) {
				var now = Date.now();
				startVal = value(now - startTime);
				startTime = now;
				endVal = setValue(val);

				if (!this.useTime) {
					fireEvent.call(this);
				}
			} else {
				value = setValue(val);
			}
		}
	});
}
