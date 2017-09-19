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
	constructor(selector) {
		this.selector = selector
	}
	
	apply(style) {
		for (let property of this.styleProperties) {
			if (property in style) this[property] = style[property]
		}
	}
	
	applyLabel(style) {
		let labelStyle = new LabelStyle(this)
		labelStyle.apply(style)
	}
	
	applyActive(style) {
		let activeStyle = new ActiveStyle(this)
		activeStyle.apply(style)
	}
	
	applyActiveLabel(style) {
		let activeLabelStyle = new ActiveLabelStyle(this)
		activeLabelStyle.apply(style)
	}
	
	get styleProperties() {
		return [
			'size',
			'width',
			'height',
			'inset',
			'background',
			'border',
			'shadows',
		]
	}
	
	getStyleRule(selector) {
		return getStyleRule(selector)
	}
	
	getContainerStyle() {
		return this.getStyleRule(`${this.selector} .container`)
	}
	
	getControlStyle() {
		return this.getStyleRule(`${this.selector} .control`)
	}
	
	setAreaStyle(property, value) {
		let style = getStyleRule(this.selector)
		style.setProperty(property, value)
	}
	
	setContainerStyle(property, value) {
		let style = this.getContainerStyle()
		style.setProperty(property, value)
	}
	
	setControlStyle(property, value) {
		let style = this.getControlStyle()
		style.setProperty(property, value)
	}
	
	setRowSpan(span) {
		this.area.style.gridRowEnd = this.row + span
	}
	
	setColumnSpan(span) {
		this.area.style.gridColumnEnd = this.column + span
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
		this.setControlStyle('background-color', parseColor(background.color, background.alpha))
		if (background.image) {
			this.setControlStyle('background-image', `url(${getAssetPath(background.image)})`)
			this.setControlStyle('background-size', 'cover')
		} else {
			this.setControlStyle('background-image', 'unset')
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
					gradient = background.gradient.position + ', ' + gradient
				this.setControlStyle('background-image', `-webkit-radial-gradient(${gradient})`)
			} else {
				let direction = background.gradient.direction
				if (direction && !direction.match(/\d+deg/))
					direction = 'to ' + direction
				if (direction)
					gradient = background.gradient.direction + ', ' + gradient
				this.setControlStyle('background-image', `-webkit-linear-gradient(${gradient})`)
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
			boxShadow.push(parseLength(shadow.offsetX), parseLength(shadow.offsetY))
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

class TemplateStyle2 extends TemplateStyle {
	constructor(template, parent) {
		super(template)
		this.parent = parent
	}
	
	apply(style) {
		super.apply(style)
		
		if (style.thumb) {
			let ThumbStyle = new SliderThumbStyle(this.parent)
			ThumbStyle.apply(style.thumb)
		}
		
		if (style.track) {
			let TrackStyle = new SliderTrackStyle(this.parent)
			TrackStyle.apply(style.track)
		}
	}
	
	getContainerStyle() {
		return this.parent.getStyleRule(`${this.selector} .container`)
	}
	
	getControlStyle() {
		return this.parent.getStyleRule(`${this.selector} .control`)
	}
}
