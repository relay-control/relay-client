function parseLength(length) {
	if (length && (typeof length == "number" || !length.endsWith('%'))) {
		length += 'px'
	}
	return length
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
	if (color && alpha) {
		if (color.charAt(0) === '#') {
			var [r, g, b] = toRGBColor(color)
		} else {
			var [r, g, b] = colors[color]
		}
		color = `rgba(${r}, ${g}, ${b}, ${alpha})`
	}
	return color
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
	// if (data.width) style.width = data.width
	// if (data.height) style.height = data.height
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

class Style {
	constructor(selector) {
		this.selector = selector
	}
	
	apply(style) {
		applyStyle(`${this.selector} .control`, style, this.control)
	}
	
	applyLabel(style) {
		applyStyle(`${this.selector} .label`, style, this.control)
	}
	
	applyActive(style) {
		applyStyle(`${this.selector} .control.pressed, ${this.selector} .control.active`, style, this.control)
	}
	
	applyActiveLabel(style) {
		applyStyle(`${this.selector} .control.pressed .label, ${this.selector} .control.active .label`, style, this.control)
	}
}

class TemplateStyle extends Style {
	constructor(template) {
		super('.' + template)
	}
}

class ControlStyle extends Style{
	constructor(control) {
		super('#' + control.id)
		this.control = control.control
	}
}

var Styles = {
	global: [
		['border', (style, data, element, control) => {
			style.borderStyle = data.style
			style.borderWidth = parseLength(data.width)
			style.borderColor = data.color
			if (!control.circle) style.borderRadius = parseLength(data.radius)
		}],
		['font', (style, data, element, control) => {
			style.color = parseColor(data.color, data.alpha)
			if (data.family) style.fontFamily = data.family
			style.fontSize = parseLength(data.size)
		}],
		['background', (style, data) => {
			style.backgroundColor = parseColor(data.color, data.alpha)
			if (data.image) {
				style.backgroundImage = `url(${getAssetPath(data.image)})`
				style.backgroundSize = 'cover'
			} else {
				style.backgroundImage = 'unset'
			}
			if (data.gradient) {
				let gradient = []
				for (let [, point] of data.gradient) {
					let colorStop = point.color
					if (point.stop) colorStop += ' ' +point.stop
					gradient.push(colorStop)
				}
				gradient = gradient.join(', ')
				if (data.gradient.type === 'radial') {
					if (data.gradient.position) gradient = data.gradient.position + ', ' + gradient
					style.backgroundImage = `-webkit-radial-gradient(${gradient})`
				} else {
					let direction = data.gradient.direction
					if (direction && !direction.match(/\d+deg/)) direction = "to " + direction
					if (direction) gradient = data.gradient.direction + ', ' + gradient
					style.backgroundImage = `-webkit-linear-gradient(${gradient})`
				}
			}
		}],
		['shadows', (style, data) => {
			let boxShadows = []
			for (let [, shadow] of data) {
				let boxShadow = []
				if (shadow.inset) boxShadow.push("inset")
				boxShadow.push(parseLength(shadow.offsetX), parseLength(shadow.offsetY))
				if (typeof shadow.blurRadius !== 'undefined') boxShadow.push(parseLength(shadow.blurRadius))
				if (typeof shadow.spreadRadius !== 'undefined') boxShadow.push(parseLength(shadow.spreadRadius))
				if (shadow.color) boxShadow.push(parseColor(shadow.color, shadow.alpha))
				boxShadows.push(boxShadow.join(" "))
			}
			style.boxShadow = boxShadows.join(", ")
		}],
	],
	controls: {
		Slider: {
			children: [
				['thumb', '::-webkit-slider-thumb', (style, data, element, control) => {
					style.marginTop = `${-parseInt(data.height) / 2 + parseInt(control.track.height) / 2}px`
				}],
				['track', '::-webkit-slider-runnable-track'],
			],
		},
	},
}
