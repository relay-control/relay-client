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

class Style {
	get styleProperties() {
		return [
			'anchor',
			'size',
			'width',
			'height',
			'inset',
			'background',
			'border',
			'shadows',
		]
	}
	
	constructor(selector) {
		this.selector = selector
		this.controlSelector = `${this.selector} .control`
	}
	
	apply(style) {
		for (let property of this.styleProperties) {
			if (property in style) this[property] = style[property]
		}
		
		if (style.textLabel) {
			let labelStyle = new TextLabelStyle(this)
			labelStyle.apply(style.textLabel)
		}
		
		if (style.iconLabel) {
			let labelStyle = new IconLabelStyle(this)
			labelStyle.apply(style.iconLabel)
		}
	}
	
	applyActive(style) {
		let activeStyle = new ActiveStyle(this)
		activeStyle.apply(style)
	}
	
	getStyleRule(selector) {
		return Stylesheet.getRule(selector)
	}
	
	get areaStyle() {
		return this.getStyleRule(`${this.selector}`)
	}
	
	get containerStyle() {
		return this.getStyleRule(`${this.selector} .container`)
	}
	
	get controlStyle() {
		return this.getStyleRule(this.controlSelector)
	}
	
	setAreaStyle(property, value) {
		this.areaStyle.setProperty(property, value)
	}
	
	setContainerStyle(property, value) {
		this.containerStyle.setProperty(property, value)
	}
	
	setControlStyle(property, value) {
		this.controlStyle.setProperty(property, value)
	}
	
	set rowSpan(span) {
		this.setAreaStyle('--row-span', span)
	}
	
	set columnSpan(span) {
		this.setAreaStyle('--column-span', span)
	}
	
	set anchor(anchor) {
		if (anchor.point) {
			let style = this.areaStyle
			let [vertical, horizontal] = anchor.point.split(/\s+/)
			if (vertical && horizontal) {
				style.alignItems = flexPositions[vertical]
				style.justifyContent = flexPositions[horizontal]
			} else if (anchor.point === 'center') {
				style.alignItems = 'center'
				style.justifyContent = 'center'
			} else {
				switch (anchor.point) {
					case 'top':
					case 'bottom':
						style.alignItems = flexPositions[anchor.point]
						break
					case 'left':
					case 'right':
						style.justifyContent = flexPositions[anchor.point]
						break
				}
			}
		}
		this.setContainerStyle('--offset-x', parseLength(anchor.offsetX))
		this.setContainerStyle('--offset-y', parseLength(anchor.offsetY))
	}
	
	set size(size) {
		this.setContainerStyle('width', parseLength(size))
		this.setContainerStyle('height', parseLength(size))
	}
	
	set width(width) {
		this.setContainerStyle('width', parseLength(width))
	}
	
	set height(height) {
		this.setContainerStyle('height', parseLength(height))
	}
	
	set inset(inset) {
		this.setAreaStyle('--inset', parseLength(inset))
	}
	
	set background(background) {
		if (background.color) {
			this.setControlStyle('background-color', parseColor(background.color, background.alpha))
			this.setControlStyle('background-image', 'unset')
		}
		if (background.image) {
			this.setControlStyle('background-image', `url(${recon.getAssetPath(background.image)})`)
			this.setControlStyle('background-size', 'cover')
		}
		if (background.gradient) {
			let gradient = []
			for (let [point] of background.gradient) {
				let colorStop = point.color
				if (point.stop)
					colorStop += ' ' +point.stop
				gradient.push(colorStop)
			}
			gradient = gradient.join(', ')
			if (background.gradient.type === 'radial') {
				if (background.gradient.position)
					gradient = 'circle at ' + background.gradient.position + ', ' + gradient
				this.setControlStyle('background-image', `radial-gradient(${gradient})`)
			} else {
				let direction = background.gradient.direction
				if (direction && !direction.match(/\d+deg/))
					direction = 'to ' + direction
				if (direction)
					gradient = direction + ', ' + gradient
				this.setControlStyle('background-image', `linear-gradient(${gradient})`)
			}
		}
	}
	
	set border(border) {
		this.setControlStyle('border-style', border.style)
		this.setControlStyle('border-width', parseLength(border.width))
		this.setControlStyle('border-color', border.color)
		// if (!control.circle) style.borderRadius = parseLength(border.radius)
		this.setControlStyle('border-radius', parseLength(border.radius))
	}
	
	set shadows(shadows) {
		let boxShadows = []
		for (let [shadow] of shadows) {
			let boxShadow = []
			if (shadow.inset) boxShadow.push('inset')
			boxShadow.push(parseLength(shadow.offsetX || 0), parseLength(shadow.offsetY || 0))
			if (typeof shadow.blurRadius !== 'undefined') boxShadow.push(parseLength(shadow.blurRadius))
			if (typeof shadow.spreadRadius !== 'undefined') boxShadow.push(parseLength(shadow.spreadRadius))
			if (shadow.color) boxShadow.push(parseColor(shadow.color, shadow.alpha))
			boxShadows.push(boxShadow.join(' '))
		}
		this.setControlStyle('box-shadow', boxShadows.join(', '))
	}
}

class TemplateStyle extends Style {
	constructor(template) {
		super('.' + template)
	}
}

class ControlStyle extends Style {
	constructor(control) {
		super('#' + control)
		// this.control = control.control
	}
}
