// const fs = require("fs")

const collections = [
	"Controls",
	"Shadows",
	"Gradient",
]

  // firstCharLowerCase = function(str) {
    // return str.charAt(0).toLowerCase() + str.slice(1)
  // }

  // stripPrefix = function(str) {
    // return str.replace(prefixMatch, '')
  // }

  // parseBooleans = function(str) {
    // if (/^(?:true|false)$/i.test(str)) {
      // str = str.toLowerCase() === 'true'
    // }
    // return str
// }

function parseNumber(str) {
	if (!isNaN(str)) {
		str = str % 1 === 0 ? parseInt(str, 10) : parseFloat(str)
	}
	return str
}

function parse(xml, isCollection) {
	var data = collections.includes(xml.nodeName) ? [] : {}

	var isText = xml.nodeType === 3,
		isElement = xml.nodeType === 1,
		body = xml.textContent && xml.textContent.trim(),
		hasChildren = xml.children && xml.children.length,
		hasAttributes = xml.attributes && xml.attributes.length

	// if it's text just return it
	if (isText) { return xml.nodeValue.trim() }

	// if it doesn't have any children or attributes, just return the contents
	if (!hasChildren && !hasAttributes) { return body }

	// if it doesn't have children but _does_ have body content, we'll use that
	if (!hasChildren && body.length) { data.text = body }

	// if it's an element with attributes, add them to data.attributes
	if (isElement && hasAttributes) {
		for (attribute of xml.attributes) {
			data[attribute.name] = parseNumber(attribute.value)
		}
	}

	// recursively call #parse over children, adding results to data
	for (child of xml.children) {
		var name = child.nodeName

		if (collections.includes(xml.nodeName)) {
			// if we've encountered a second instance of the same nodeType, make our
			// representation of it an array
			// if (!data[name]) data[name] = []

			// and finally, append the new child
			data.push(parse(child, true))
		} else {
			// if we've not come across a child with this nodeType, add it as an object
			// and return here
			// if (!_.has(data, name)) {
				// data[name] = parse(child)
				data[name.charAt(0).toLowerCase() + name.slice(1)] = parse(child)
			// }
		}
	}
	
	if (isCollection) {
		data.tag = xml.nodeName
	}

	return data
}

// convert.rgb.hex = function (args) {
	// var integer = ((Math.round(args[0]) & 0xFF) << 16)
		// + ((Math.round(args[1]) & 0xFF) << 8)
		// + (Math.round(args[2]) & 0xFF);

	// var string = integer.toString(16).toUpperCase();
	// return '000000'.substring(string.length) + string;
// }

function toRGBColor(args) {
	let match = args.toString(16).match(/[a-f0-9]{6}|[a-f0-9]{3}/i)
	if (!match) {
		return [0, 0, 0]
	}

	let colorString = match[0]

	if (match[0].length === 3) {
		colorString = colorString.split('').map(char => char + char).join('')
	}

	let integer = parseInt(colorString, 16)
	let r = (integer >> 16) & 0xFF
	let g = (integer >> 8) & 0xFF
	let b = integer & 0xFF

	return [r, g, b]
}

function parseColor(color, alpha) {
	if (alpha) {
		if (color.charAt(0) === '#') {
			var [r, g, b] = toRGBColor(color)
		} else {
			var [r, g, b] = colors[color]
		}
		color = `rgba(${r}, ${g}, ${b}, ${alpha})`
	}
	return color
}

function createControl(type) {
	switch (type) {
		case "Button":
			var element = document.createElement("button")
			break
		case "Slider":
			var element = document.createElement("input")
			element.type = "range"
			break
		case "Text":
			var element = document.createElement("span")
			break
	}
	return element
}

function createStyleRule(selector) {
	let css = document.styleSheets[0]
	let index = 0
	css.insertRule(`${selector} {}`, index)
	return css.rules[index].style
}

function applyStyle(element, data) {
	let style = element
	style.width = data.width
	style.height = data.height
	if (data.text) {
		style.color = data.text.color
	}
	if (data.background) {
		style.backgroundColor = data.background.color
		style.backgroundImage = data.background.image || "initial"
		if (data.background.gradient) {
			let gradient = []
			for (point of data.background.gradient) {
				let colorStop = point.color
				if (point.stop) colorStop += ' ' +point.stop
				gradient.push(colorStop)
			}
			gradient = gradient.join(", ")
			if (data.background.gradient.type === "radial") {
				if (data.background.gradient.position) gradient = data.background.gradient.position + ', ' + gradient
				style.backgroundImage = `-webkit-radial-gradient(${gradient})`
			} else {
				style.backgroundImage = `-webkit-linear-gradient(${gradient})`
			}
		}
	}
	if (data.border) {
		style.borderStyle = "solid"
		style.borderWidth = data.border.width
		style.borderColor = data.border.color
		style.borderRadius = data.border.radius
	}
	if (data.shadows) {
		let boxShadows = []
		for (shadow of data.shadows) {
			let boxShadow = []
			if (shadow.inset) boxShadow.push("inset")
			boxShadow.push(shadow.offsetX, shadow.offsetY)
			if (typeof shadow.blurRadius !== 'undefined') boxShadow.push(shadow.blurRadius)
			if (typeof shadow.spreadRadius !== 'undefined') boxShadow.push(shadow.spreadRadius)
			if (shadow.color) boxShadow.push(parseColor(shadow.color, shadow.alpha))
			boxShadows.push(boxShadow.join(" "))
		}
		style.boxShadow = boxShadows.join(", ")
	}
}


let domparser = new DOMParser()

function loadPanel(panelName) {
	// fs.readFile(__dirname + `/${panelName}.xml`, function(err, data) {
	
	let xhr = new XMLHttpRequest()
	xhr.open("GET", `${panelName}.xml`)
	xhr.send()
	xhr.onload = (function() {
		data = this.responseText
		
		let panel = parse(domparser.parseFromString(data, "text/xml")).panel
		console.log(panel)
		
		document.body.style.fontFamily = panel.text.font
		document.body.style.fontSize = panel.text.size
		document.body.style.color = panel.text.color
		
		let panelElement = document.getElementById("panel")
		panelElement.style.backgroundColor = panel.background.color
		panelElement.style.backgroundImage = panel.background.image
		panelElement.style.gridTemplateColumns = `repeat(${panel.grid.columns}, 1fr)`
		panelElement.style.gridTemplateRows = `repeat(${panel.grid.rows}, 1fr)`
		
		let style0 = createStyleRule("#panel > div > div")
		style0.padding = `${panel.templates.default.padding.x} ${panel.templates.default.padding.x}`
		
		let style = createStyleRule("button")
		applyStyle(style, panel.templates.default)
		
		style.fontFamily = panel.text.font
		style.fontSize = panel.text.size
		style.color = panel.text.color
		
		// let style2 = createStyleRule("span")
		// style2.fontFamily = "Calibri"
		// style2.fontSize = "14px"
		// style2.fontWeight = "bold"
		// style2.color = "#ccc"
		// style2.position = "absolute"
		// style2.bottom = 0
		
		function buttonActivated(element) {
			if (element.dataset.button) RelaySocket.send(element.dataset.button, 1)
			console.log("activated  ", element.id)
		}
		
		function buttonDeactivated(element) {
			if (element.dataset.button) RelaySocket.send(element.dataset.button, 0)
			console.log("deactivated", element.id)
		}
		
		function buttonPressed(element) {
			if (element.dataset.mode === "toggle") {
				if (!element.classList.contains("active")) {
					buttonActivated(element)
				}
			} else {
				buttonActivated(element)
			}
			element.dataset.pressed = true
			element.classList.add("pressed")
			console.log("pressed ", element.id)
		}
		
		function buttonReleased(element) {
			if (element.dataset.mode === "toggle") {
				element.classList.toggle("active")
				if (!element.classList.contains("active"))
					buttonDeactivated(element)
			} else {
				buttonDeactivated(element)
			}
			delete element.dataset.pressed
			element.classList.remove("pressed")
			console.log("released", element.id)
		}
		
		// let activeElement
		
		function mousedown(e) {
			buttonPressed(e.currentTarget)
			// activeElement = e.currentTarget
		}
		function mouseup(e) {
			buttonReleased(e.currentTarget)
		}
		function mouseout(e) {
			if (e.currentTarget.dataset.pressed) {
				buttonReleased(e.currentTarget)
			}
		}
		function touchstart(e) {
			// e.preventDefault()
			buttonPressed(e.currentTarget)
			// activeElement = e.currentTarget
		}
		function touchend(e) {
			e.preventDefault()
			buttonReleased(e.currentTarget)
		}
		
		let n = 0
		
		for (let control of panel.controls) {
			let cell = document.createElement("div")
			cell.style.gridColumnStart = control.position.x
			cell.style.gridColumnEnd = control.position.x + (control.width || 1)
			cell.style.gridRowStart = control.position.y
			cell.style.gridRowEnd = control.position.y + (control.height || 1)
			panelElement.appendChild(cell)
			if (control.square) cell.classList.add("square")
			if (control.circle) cell.classList.add("circle")
			
			let element = createControl(control.tag)
			element.id = "control" + n
			if (control.icon) {
				let icon = document.createElement("i")
				icon.classList.add("fa", "fa-fw", "fa-2x", "fa-" + control.icon)
				element.appendChild(icon)
			} else {
				element.textContent = control.text
			}
			applyStyle(createStyleRule(`#${element.id}`), control)
			if (control.active) {
				let style = createStyleRule(`#${element.id}.pressed, #${element.id}.active`)
				applyStyle(style, control.active)
			}
			if (control.action && control.action.type === "joy") {
				element.dataset.button = parseInt(control.action.btn)
			}
			element.dataset.mode = control.mode
			if (control.tag === "Slider") {
				element.setAttribute("list", "datalist" + n)
				let datalist = cell.appendChild(document.createElement("datalist"))
				datalist.id = "datalist" + n
				let option = datalist.appendChild(document.createElement("option"))
				option.value = 50
				let trackStyle = createStyleRule(`#${element.id}::-webkit-slider-runnable-track`)
				applyStyle(trackStyle, control.track)
				let thumbStyle = createStyleRule(`#${element.id}::-webkit-slider-thumb`)
				applyStyle(thumbStyle, control.thumb)
				thumbStyle.marginTop = `${-parseInt(control.thumb.height) / 2 + parseInt(control.track.height) / 2 - 1}px`
			}
			if (control.background) createStyleRule(`#${element.id}`).background = control.background.color
			let container = cell.appendChild(document.createElement("div"))
			container.appendChild(element)
			
			element.addEventListener('mousedown', mousedown)
			element.addEventListener('mouseup', mouseup)
			element.addEventListener('mouseout', mouseout)
			element.addEventListener('touchstart', touchstart)
			element.addEventListener('touchend', touchend)
			
			let label = cell.appendChild(document.createElement("span"))
			// label.textContent = "Num " +control.position.x
			n++
		}
	})
}

loadPanel("Elite")
