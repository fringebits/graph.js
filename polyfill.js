(function() {

var elements = {};

InitPolyfill();

var style;
function updateStyle(name) {
	if (!style) {
		style = document.createElement("style");
		style.setAttribute("type", "text/css");
		style.textContent = "x-nothing { animation-duration: 0.001s; animation-name: nodeInserted; } @keyframes nodeInserted { from { opacity: 0.99; } to { opacity: 1; } }";
		document.head.appendChild(style);
		document.addEventListener("animationstart", insertListener, false);
	}

	style.textContent = name + ", " + style.textContent;
}

var insertListener = function(event) {
	if (event.animationName == "nodeInserted") {
		appendToNode(event.target);

		var name = event.target.nodeName.toLowerCase();
		var elt = elements[name];
		Object.defineProperty(document, "currentScript", { configurable: true, value: elt.__currentScript });
		elt.__proto.attachedCallback.call(event.target);
		delete document.currentScript;
	}
}

function registerElement(name, data) {
	elements[name] = {};
	elements[name].__currentScript = document.currentScript;
	elements[name].__proto = data.prototype;
	updateStyle(name);
}

function InitPolyfill() {
	document.registerElement = registerElement;
	document.addEventListener("DOMLinkAdded", function(event) {
		parseLink(event.taret);
	});

	document.addEventListener("DOMNodeRemoved", function(event) {
		var node = event.target;
		var name = node.nodeName;
		var elt = elements[name.toLowerCase()];
		if (!elt) {
			return;
		}

		elt.__proto.detachedCallback.call(node);
	});

	var imports = document.querySelectorAll('link[rel="import"]');
	for (var i = 0; i < imports.length; i++) {
		parseLink(imports[0]);
	}
}

function parseLink(link) {
	if (link.import) {
		addDoc(link.import);
	} else {
		getDocument(link.href).then(function(doc) {
			var throwFun = function() { throw new InvalidStateError(); };
			doc.open = throwFun;
			doc.write = throwFun;
			doc.close = throwFun;
			link.import = doc;

			// TODO: Fire an onload handler for the import?
			addDoc(doc);
		}).catch(function() {
			// TODO: Fire an onerror handler for the import
		});
	}
}

function addDoc(doc) {
	for (var i = 0; i < doc.head.childNodes.length; i++) {
		var child = doc.head.childNodes[i];

		if (!child.nodeName) {
			continue;
		}

		switch(child.nodeName) {
			case "SCRIPT":
				parseScript(child);
				break;
		}
	}
}

function HTMLElementFromType(type) {
	switch(type) {
		case "table": return HTMLTableElement;
		default: return HTMLElement;
	}
}

function lifecycle(obj) {
	this._lifecycle = obj;
}

function reflectAttribute(node) {
	var name = node.nodeName.toLowerCase();
	var element = elements[name];
	var oldSet = node.setAttribute;

	return function(attr, value) {
		var oldValue = this.getAttribute(attr);
		oldSet.call(this, attr, value);

		if (element) {
			element.__proto.attributeChangedCallback(attr, oldValue, value);
		}
	}
}

function setupEvent(type) {
}

function createShadowNode(base, name) {
	var node = base.ownerDocument.createElement(name);
	node.setAttribute("__shadow__", true);
	base.appendChild(node);
	return node;
}

function appendToNode(node) {
	var shadowRoot = node.shadowRoot || node.querySelector("shadow-root[__shadow__]:last-of-type");
	if (shadowRoot) {
		shadowRoot.style.display = "none";
	}

	if (!node.createShadowRoot) {
		node.createShadowRoot = function() {
			var oldShadowRoot = this.shadowRoot;
			if (oldShadowRoot)
				oldShadowRoot.style.display = "none";
			var newShadowRoot = createShadowNode(node, "shadow-root");
			newShadowRoot.oldShadowRoot = oldShadowRoot;
			node.shadowRoot = newShadowRoot;
			return newShadowRoot;
		};

		node.setAttribute = reflectAttribute(node);

		node.getDestinationInsertionPoints = function() { return null; };
	}

	var name = node.nodeName.toLowerCase();
	var elt = elements[name];
	node.__proto__ = elt.__proto;

	Object.defineProperty(document,"currentScript", { configurable: true, value: elt.__currentScript });
	elt.__proto.createdCallback.call(node);
	delete document.currentScript;
}

function parseScript(element, info) {
	var s = "";
	for (var i = 0; i < element.childNodes.length; i++) {
		s += element.childNodes[i].textContent;
	}

	s = s.replace("<![CDATA[", "");
	s = s.replace(/\]\]>$/, "");

	Object.defineProperty(document, "currentScript", { configurable: true, value: element });
	document.currentScript.ownerDocument = element.ownerDocument;
	var f = new Function(s);
	f();
	delete document.currentScript;
}

function getDocument(url) {
	return new Promise(function(resolve, reject) {
		var httpRequest = new XMLHttpRequest();
		httpRequest.onload = function() {
			if (httpRequest.readyState === 4) {
				if (httpRequest.status === 200 || httpRequest.status === 0) {
					try {
						var parser = new DOMParser();
						var htmlDoc = parser.parseFromString(httpRequest.responseText, "text/html");
						resolve(htmlDoc);
					} catch(ex) {
						console.log(ex);
					}
				} else {
					reject();
				}
			}
		};

		httpRequest.open("GET", url, true);
		// httpRequest.responseType = "document";
		httpRequest.send(null);
	});
}

})();