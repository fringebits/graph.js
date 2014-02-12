function GraphFunction(options) {
	this.mixin(this, options);

	this.valCache = {};
	this.time = 0;

	if (this.checkVars([])) {
	} else if (this.checkVars(["x"])) {
		console.log(this.val + " = x");

	} else if (this.checkVars(["y"])) {
		console.log(this.val + " = y");

	} else if (this.checkVars(["y", "t"])) {
		console.log(this.val + " = yt");
		this.useTime = true;
	} else if (this.checkVars(["x", "t"])) {
		console.log(this.val + " = xy");
		this.useTime = true;
	} else if (this.checkVars(["r"])) {
		console.log(this.val + " = r");
		this.polar = true;
	} else if (this.checkVars(["theta"])) {
		console.log(this.val + " = theta");
		this.polar = true;
	} else if (this.checkVars(["r", "t"])) {
		console.log(this.val + " = rt");
		this.polar = true;
		this.useTime = true;
	} else if (this.checkVars(["theta", "t"])) {
		console.log(this.val + " = thetat");
		this.polar = true;
		this.useTime = true;
	}

	if (this.val.startsWith("x")) this.iterate = "y";
	else if (this.val.startsWith("y")) this.iterate = "x";
	else if (this.val.startsWith("r")) {
		this.polar = true;
		this.iterate = "theta";
	} else if (this.val.startsWith("theta")) {
		this.polar = true;
		this.iterate = "r";
	}

	console.log("Found " + this.iterate + " for " + this.val);
}

GraphFunction.prototype = {
	__proto__: Graphic.prototype,
	val: "y = x",
	step: 0.1,
	useTime: false,

	preBind: function(name, val) {
		return name + " = " + val + "; ";
	},

	checkVars: function(vars, assign) {
		var prev = "";
		for (var i in vars) prev += this.preBind(vars[i], 0);

		var pass = false;
		try {
			eval(prev + this.val);
			console.log("PASS " + prev + this.val);
			pass = true;
		} catch(ex) {
			console.log("EX: " + ex);
		}

		return pass;
	},

	fromNode: function(node, base) {
		try {
			var options = this.getBaseOptions(node);
			this.mixin(options, {
				step: this.getFloat("step", node),
			});
			p = new GraphFunction(options);
			p.resolveStyles(node, options);
		} catch(ex) {
			console.log("Ex: " + ex);
		}

		p = Graphic.prototype.fromNode(node, p);

		return p;
	},

 	animate: function(dt) {
 		if (!this.useTime)
 			return false;
 		this.time = dt;
 		return true;
 	},

	draw: function(ctx, graph) {
		var y = 0,
		    t = this.time,
		    r = 0,
		    x = 0,
		    theta = 0;

		ctx.beginPath();
		this.setupDrawing(ctx);

		var step = this.polar ? Math.PI*2/800 : (graph.xaxis.max - graph.xaxis.min)/graph.width;

		// Animating or dragging, we reduce the resolution
		if (graph.startDragPoint) step = step*10;
		else if (this.useTime) step = step*3;

		var start = this.polar ? 0          : graph.xaxis.min;
		var end   = this.polar ? Math.PI*2  : graph.xaxis.max;

		var p;
		var s = true;
		for (var a = start; a < end; a += step) {

			//if (this.iterate == "theta")
				//console.log(this.polar + " " + this.iterate + "=" + a + ";" + this.val);
			eval(this.iterate + "=" + a + ";" + this.val);

			if (this.polar) {
				p = graph.toScreenCoords(graph.polarToXY({r: r, theta: theta}));
			} else {
				p = graph.toScreenCoords({ x: x, y: y });
			}

			if (s) {
				ctx.moveTo(p.x, p.y);
				s = false;
			} else {
				ctx.lineTo(p.x,p.y);
			}

		}
		ctx.stroke();

		if (this.fill) {
			if (!this.polar) {
				var x = this.iterate == "x" ? graph.xaxis.max : 0;
				var y  = this.iterate == "y" ? graph.yaxis.max : 0;
				var p = graph.toScreenCoords({ x: x, y: y });
				ctx.lineTo(p.x, p.y);

				x = this.iterate == "x" ? graph.xaxis.min : 0;
				y  = this.iterate == "y" ? graph.yaxis.min : 0;
				var p = graph.toScreenCoords({ x: x, y: y });
				ctx.lineTo(p.x, p.y);
			}

			ctx.fill();
		}

		if (/Math\.sqrt/.test(this.val) && !this.old) {
			this.old = this.val;
			this.val = this.val.replace(/Math\.sqrt/g, "-1*Math.sqrt");
			this.draw(ctx, graph);
			this.val = this.old;
			delete this.old;
		}
	}
}

graph.prototype.register("function", GraphFunction);
