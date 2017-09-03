const collections = [
	"Templates",
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

let stylesheet

let rules = {}

function getStyleRule(selector) {
	let rule = rules[selector]
	if (!rule) {
		let index = stylesheet.rules.length
		stylesheet.insertRule(`${selector} {}`, index)
		rule = stylesheet.rules[index].style
		rules[selector] = rule
	}
	return rule
}

const flexPositions = {
	top: 'flex-start',
	left: 'flex-start',
	bottom: 'flex-end',
	right: 'flex-end',
}

function setFlexPosition(style, position) {
	let [vertical, horizontal] = position.split(/\s+/)
	if (vertical && horizontal) {
		style.alignItems = flexPositions[vertical]
		style.justifyContent = flexPositions[horizontal]
	} else if (position === 'center') {
		style.alignItems = 'center'
		style.justifyContent = 'center'
	} else {
		switch (position) {
			case 'top':
			case 'bottom':
				style.alignItems = flexPositions[position]
				break
			case 'left':
			case 'right':
				style.justifyContent = flexPositions[position]
				break
		}
	}
}

function applyStyle(selector, control, element, mainControl) {
	let style = getStyleRule(selector)
	let data = control
	if (data.width) style.width = data.width
	if (data.height) style.height = data.height
	for (let [property, handler] of Styles.global) {
		if (property in data) handler(style, data[property], element, control)
	}
	if (Styles.controls[control.tag]) {
		// for (let [property, handler] of Styles.global) {
			// if (property in data) handler(style, data[property])
		// }
		if (Styles.controls[control.tag].children) {
			for (let [child, selector2, handler] of Styles.controls[control.tag].children) {
				if (child in control) {
					applyStyle(selector + selector2, control[child], element, control)
					if (handler) handler(style, control[child], element, control)
				}
			}
		}
	}
}


let currentPanel

function getAssetPath(file) {
	return `${ws.server}/${currentPanel}/${file}`
}

class Label {
	constructor() {
		let label = document.createElement('div')
		label.classList.add('label')
		this.element = label
	}
	
	setPosition(position) {
		if (position) setFlexPosition(this.element.style, position)
	}
}

class TextLabel extends Label {
	constructor() {
		super()
		this.element.classList.add('text')
	}
	
	setText(text) {
		this.element.textContent = text
	}
}

class IconLabel extends Label {
	constructor() {
		super()
		this.element.classList.add('icon')
		let icon = document.createElement('i')
		icon.classList.add('fa', 'fa-fw', 'fa-2x')
		this.element.appendChild(icon)
		this.icon = icon
	}
	
	setIcon(icon) {
		this.icon.classList.add('fa-' + icon)
	}
}

class Panel {
	constructor() {
		this.element = document.getElementById('panel')
	}
	
	addControl(control) {
		this.element.appendChild(control.area)
	}
}

let domparser = new DOMParser()

function loadPanel(panelName) {
	let panel = document.getElementById('panel')
	let menu = document.getElementById('menu')
	menu.style.display = 'none'
	panel.style.display = 'grid'
	
	currentPanel = panelName
	
	let xhr = new XMLHttpRequest()
	xhr.open("GET", `${ws.server}/${panelName}.xml`)
	xhr.send()
	xhr.onload = function() {
		let {panel} = parse(domparser.parseFromString(this.responseText, "text/xml"))
		
		// create a separate stylesheet for dynamic style rules
		let link = document.createElement('style')
		document.head.appendChild(link)
		stylesheet = link.sheet
		
		let p = new Panel()
		let panelElement = p.element
		if (panel.background) {
			panelElement.style.backgroundColor = panel.background.color
			if (panel.background.image) {
				panelElement.style.backgroundImage = `url(${getAssetPath(panel.background.image)})`
				panelElement.style.backgroundSize = 'cover'
				panelElement.style.backgroundPosition = 'center'
			}
		}
		panelElement.style.gridTemplateColumns = `repeat(${panel.grid.columns}, 1fr)`
		panelElement.style.gridTemplateRows = `repeat(${panel.grid.rows}, 1fr)`
		
		/* validate grid size and control placement */
		
		if (panel.templates) {
			for (let template of panel.templates) {
				// map each template to a CSS class
				let selector = '.' + template.name
				if (template.tag !== 'Control') selector += '.' + template.tag.toLowerCase()
				if (template.padding) {
					let style = getStyleRule(selector)
					style.padding = `${template.padding.y} ${template.padding.x}`
				}
				if (template.label) {
					let style = getStyleRule(selector + ' .label')
					style.color = template.label.color
					// applyStyle(selector + ' .label', template.label)
				}
				if (template.active) {
					applyStyle(selector + ' .control.pressed,' + selector + ' .control.active', template.active)
				}
				applyStyle(selector + ' .control', template)
			}
		}
		
		let n = 1
		
		for (let control of panel.controls) {
			let controlType = ControlTypes[control.tag]
			switch (control.tag) {
				case 'Button':
					var c = new Button()
					break
				case 'Slider':
					var c = new Slider()
					break
			}
			
			let {area: cell, control: element, container} = c
			
			element.classList.add('control')
			
			c.setColumn(control.position.x)
			c.setRow(control.position.y)
			cell.style.gridColumnEnd = control.position.x + (control.width || 1)
			cell.style.gridRowEnd = control.position.y + (control.height || 1)
			
			// assign a dynamic ID that we can use as a selector to apply individual styling
			cell.id = 'control' + n++
			
			cell.classList.add(control.tag.toLowerCase())
			
			if (control.square) cell.classList.add('square')
			if (control.circle) cell.classList.add('circle')
			if (control.square || control.circle) {
				cell.classList.add('adjust-' + (control.adjustSize || 'height'))
				let img = container.appendChild(document.createElement('img'))
				// img.src = "square.png"
				img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="
			}
			
			if ('inherits' in control)
				cell.classList.add(control.inherits)
			else
				cell.classList.add('default')
			
			applyStyle(`#${cell.id} .control`, control, element)
			if (control.active) {
				applyStyle(`#${cell.id} .control.pressed, #${cell.id} .control.active`, control.active, element)
			}
			controlType.onCreate(element, control)
			
			if (control.heightw) {
				let style = getStyleRule(`#${cell.id} .container`)
				style.height = control.heightw
			}
			if (control.label) {
				if (control.label.text) {
					let textLabel = new TextLabel()
					textLabel.setText(control.label.text)
					textLabel.setPosition(control.label['text-position'] || control.label.position)
					
					if ((control.label['text-anchor'] || control.label.anchor) === 'container') {
						cell.appendChild(textLabel.element)
					} else {
						element.appendChild(textLabel.element)
					}
				}
				if (control.label.icon) {
					let iconLabel = new IconLabel()
					iconLabel.setIcon(control.label.icon)
					iconLabel.setPosition(control.label['icon-position'] || control.label.position)
					
					if ((control.label['icon-anchor'] || control.label.anchor) === 'container') {
						cell.appendChild(iconLabel.element)
					} else {
						element.appendChild(iconLabel.element)
					}
				}
			}
			if (control.value) {
				let valueContainer = cell.appendChild(document.createElement('div'))
				valueContainer.classList.add('label', 'value')
				// let value = valueContainer.appendChild(document.createElement("span"))
				value = valueContainer
				value.textContent = "50%"
				element.valueLabel = value
				// element.step = 0.1
				if (control.value.position) {
					setFlexPosition(valueContainer.style, control.value.position)
				}
			}
			if (control.action) {
				if (control.action.type === 'joy')
				element.dataset.button = parseInt(control.action.btn)
			}
			if (control.tag === 'Slider') {
				element.setAttribute('list', 'datalist-' + cell.id)
				let datalist = container.appendChild(document.createElement('datalist'))
				datalist.id = 'datalist-' + cell.id
				let option = datalist.appendChild(document.createElement('option'))
				option.value = 50
			}
			
			container.appendChild(element)
			p.addControl(c)
			
			if (controlType.events) {
				for (let [event, callback] of Object.entries(controlType.events)) {
					element.addEventListener(event, callback)
				}
			}
			
			// PNG - data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=
			// PNG - data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABBJREFUeNpi+P//PwNAgAEACPwC/tuiTRYAAAAASUVORK5CYII=
			// GIF - data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==
			// GIF - data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=
			
			// redraw??
			// sel.style.display = 'run-in'; setTimeout(function () { sel.style.display = 'block'; }, 0);
		}
		// force a redraw of square elements since they get borked if dialog was shown prior to loading a panel
		let squares = document.querySelectorAll('.cell.square > .container, .cell.circle > .container')
		for (let square of squares) {
			square.style.display = 'none'
			setTimeout(() => {square.style.display = 'inline-block'}, 0)
		}
	}
}
