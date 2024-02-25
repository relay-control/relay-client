import Stylesheet from 'stylesheet'
import Colors from 'colors'

const FlexPositions = {
	top: 'flex-start',
	left: 'flex-start',
	bottom: 'flex-end',
	right: 'flex-end',
}

function mixin(base, ...extend) {
	return base(extend.length > 0 ? mixin(...extend) : Object)
}

function parseLength(length) {
	if (length && (typeof length == "number" || !length.endsWith('%'))) {
		length += 'px'
	}
	return length
}

function toRgbColor(args) {
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
			var [r, g, b] = toRgbColor(color)
		} else {
			var [r, g, b] = Colors[color]
		}
		color = `rgba(${r}, ${g}, ${b}, ${alpha})`
	}
	return color
}

const Stylable = (base = Object) => class extends base {
	styleProperties = [
		'anchor',
		'size',
		'width',
		'height',
		'inset',
		'background',
		'border',
		'shadows',
	]

	setStyle(style) {
		for (let property of this.styleProperties) {
			if (property in style) this[property] = style[property]
		}
	}

	setStyleProperty(property, value) {
		if (value) this.style.setProperty('--' + property, value)
	}

	removeStyleProperty(property) {
		this.style.removeProperty('--' + property)
	}

	set anchor(anchor) {
		if (anchor.point) {
			let [vertical, horizontal] = anchor.point.split(/\s+/)
			if (vertical && horizontal) {
				this.setStyleProperty('vertical-alignment', FlexPositions[vertical])
				this.setStyleProperty('horizontal-alignment', FlexPositions[horizontal])
			} else if (anchor.point === 'center') {
				this.setStyleProperty('vertical-alignment', 'center')
				this.setStyleProperty('horizontal-alignment', 'center')
			} else {
				switch (anchor.point) {
					case 'top':
					case 'bottom':
						this.setStyleProperty('vertical-alignment', FlexPositions[anchor.point])
						break
					case 'left':
					case 'right':
						this.setStyleProperty('horizontal-alignment', FlexPositions[anchor.point])
						break
				}
			}
		}
		this.setStyleProperty('offset-x', parseLength(anchor.offsetX))
		this.setStyleProperty('offset-y', parseLength(anchor.offsetY))
	}

	set size(size) {
		this.width = size
		this.height = size
	}

	set width(width) {
		this.setStyleProperty('width', parseLength(width))
	}

	set height(height) {
		this.setStyleProperty('height', parseLength(height))
	}

	set inset(inset) {
		this.setStyleProperty('inset', parseLength(inset))
	}

	set background(background) {
		if (background.color) {
			this.setStyleProperty('background-color', parseColor(background.color, background.alpha))
			this.removeStyleProperty('background-image')
		}
		if (background.image) {
			this.setStyleProperty('background-image', `url(${getAssetUrl(background.image)})`)
			this.setStyleProperty('background-size', 'cover')
		}
		if (background.gradient) {
			let gradient = []
			for (let point of background.gradient) {
				let colorStop = point.color
				if (point.stop)
					colorStop += ' ' +point.stop
				gradient.push(colorStop)
			}
			gradient = gradient.join(', ')
			if (background.gradient.type === 'radial') {
				if (background.gradient.position)
					gradient = 'circle at ' + background.gradient.position + ', ' + gradient
				this.setStyleProperty('background-image', `radial-gradient(${gradient})`)
			} else {
				let direction = background.gradient.direction
				if (direction && !direction.match(/\d+deg/))
					direction = 'to ' + direction
				if (direction)
					gradient = direction + ', ' + gradient
				this.setStyleProperty('background-image', `linear-gradient(${gradient})`)
			}
		}
	}

	set border(border) {
		this.setStyleProperty('border-style', border.style)
		this.setStyleProperty('border-width', parseLength(border.width))
		this.setStyleProperty('border-color', border.color)
		this.setStyleProperty('border-radius', parseLength(border.radius))
	}

	set shadows(shadows) {
		let boxShadows = []
		for (let shadow of shadows) {
			let boxShadow = []
			if (shadow.inset) boxShadow.push('inset')
			boxShadow.push(parseLength(shadow.offsetX || 0), parseLength(shadow.offsetY || 0))
			if (typeof shadow.blurRadius !== 'undefined') boxShadow.push(parseLength(shadow.blurRadius))
			if (typeof shadow.spreadRadius !== 'undefined') boxShadow.push(parseLength(shadow.spreadRadius))
			if (shadow.color) boxShadow.push(parseColor(shadow.color, shadow.alpha))
			boxShadows.push(boxShadow.join(' '))
		}
		this.setStyleProperty('box-shadow', boxShadows.join(', '))
	}
}

class Style extends Stylable() {
	constructor(selector) {
		super()
		this.style = Stylesheet.createRule(selector)
		this.selector = selector
	}
}

const ControlStyle = (base = Object) => class extends base {
	styleProperties = [
		'rowSpan',
		'columnSpan',
		'anchor',
		'size',
		'width',
		'height',
		'inset',
		'background',
		'border',
		'shadows',
	]

	setStyle(style) {
		super.setStyle(style)

		if (style.textLabel && this.textLabel) {
			this.textLabel.setStyle(style.textLabel)
		}

		if (style.iconLabel && this.iconLabel) {
			this.iconLabel.setStyle(style.iconLabel)
		}

		if (style.imageLabel && this.imageLabel) {
			this.imageLabel.setStyle(style.imageLabel)
		}

		if (style.valueLabel && this.valueLabel) {
			this.valueLabel.setStyle(style.valueLabel)
		}
	}

	set rowSpan(span) {
		this.setStyleProperty('row-span', span)
	}

	set columnSpan(span) {
		this.setStyleProperty('column-span', span)
	}
}

class ControlStyleTemplate extends ControlStyle(Style) {
	constructor(selector) {
		super(selector)
		this.textLabel = this.createLabel('text')
		this.iconLabel = this.createLabel('icon')
		this.imageLabel = this.createLabel('image')
	}

	setActiveStyle(style) {
		let activeStyle = new ControlStyleTemplate(this.selector + '.active')
		activeStyle.parent = this
		activeStyle.setStyle(style)
	}

	createLabel(labelType) {
		return new LabelStyle(`${this.selector} ${labelType}-label`, this)
	}
}

class SliderStyle extends Style {
	constructor(selector) {
		super(selector)
		this.valueLabel = this.createValueLabel()
		this.thumb = new SliderThumbStyle(this)
		this.track = new SliderTrackStyle(this)
	}

	setStyle(style) {
		super.setStyle(style)

		if (style.valueLabel && this.valueLabel) {
			this.valueLabel.setStyle(style.valueLabel)
		}

		if (style.thumb && this.thumb) {
			this.thumb.setStyle(style.thumb)
		}

		if (style.track && this.track) {
			this.track.setStyle(style.track)
		}
	}

	createValueLabel() {
		return new LabelStyle(this.selector + ' text-label', this)
	}
}

class StyleElement extends Stylable(HTMLElement) {
	cssProperties = [
		'alignItems',
		'justifyContent',
		'background-image',
		'font-color',
		'border-color',
		'box-shadow',
		'offset-x',
		'offset-y',
	]

	resetStyle() {
		for (let property of this.cssProperties) {
			this.removeStyleProperty(property)
		}
	}
}

const StylableLabel = (base = Object) => class extends base {
	styleProperties = [
		'anchor',
		'size',
		'width',
		'height',
		'inset',
		'background',
		'border',
		'shadows',
		'color',
		'font',
		'textShadow',
	]

	set color(color) {
		this.setStyleProperty('font-color', color)
	}

	set font(font) {
		if (font.family) this.setStyleProperty('font-family', font.family)
		this.setStyleProperty('font-size', parseLength(font.size))
		// this.setStyleProperty('font-color', parseColor(font.color, font.alpha))
	}

	set textShadow(shadows) {
		let textShadows = []
		for (let shadow of shadows) {
			let textShadow = []
			textShadow.push(parseLength(shadow.offsetX || 0), parseLength(shadow.offsetY || 0))
			if ('blurRadius' in shadow) textShadow.push(parseLength(shadow.blurRadius))
			if (shadow.color) textShadow.push(parseColor(shadow.color, shadow.alpha))
			textShadows.push(textShadow.join(' '))
		}
		this.setStyleProperty('text-shadow', textShadows.join(', '))
	}
}

class LabelStyle extends StylableLabel(Style) { }

class SliderThumbStyle extends Style {
	constructor() {
		super('slider-control .control')
	}

	setStyleProperty(property, value) {
		this.style.setProperty('--thumb-' + property, value)
	}
}

class SliderTrackStyle extends Style {
	constructor() {
		super('slider-control .control')
	}

	setStyleProperty(property, value) {
		this.style.setProperty('--track-' + property, value)
	}
}

export {
	ControlStyle,
	ControlStyleTemplate,
	SliderStyle,
	Stylable,
	StylableLabel,
	StyleElement,
	SliderThumbStyle,
	SliderTrackStyle,
}
