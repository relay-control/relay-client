import { Stylesheet } from '/scripts/panel.js'
import Colors from '/scripts/colors.js'

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
	
	set anchor(anchor) {
		if (anchor.point) {
			let style = this.cellStyle
			let [vertical, horizontal] = anchor.point.split(/\s+/)
			if (vertical && horizontal) {
				style.alignItems = FlexPositions[vertical]
				style.justifyContent = FlexPositions[horizontal]
			} else if (anchor.point === 'center') {
				style.alignItems = 'center'
				style.justifyContent = 'center'
			} else {
				switch (anchor.point) {
					case 'top':
					case 'bottom':
						style.alignItems = FlexPositions[anchor.point]
						break
					case 'left':
					case 'right':
						style.justifyContent = FlexPositions[anchor.point]
						break
				}
			}
		}
		this.containerStyle.setProperty('--offset-x', parseLength(anchor.offsetX))
		this.containerStyle.setProperty('--offset-y', parseLength(anchor.offsetY))
	}
	
	set size(size) {
		this.width = size
		this.height = size
	}
	
	set width(width) {
		this.containerStyle.setProperty('width', parseLength(width))
	}
	
	set height(height) {
		this.containerStyle.setProperty('height', parseLength(height))
	}
	
	set inset(inset) {
		this.cellStyle.setProperty('--inset', parseLength(inset))
	}
	
	set background(background) {
		if (background.color) {
			this.elementStyle.setProperty('background-color', parseColor(background.color, background.alpha))
			this.elementStyle.removeProperty('background-image')
		}
		if (background.image) {
			this.elementStyle.setProperty('background-image', `url(${getAssetPath(background.image)})`)
			this.elementStyle.setProperty('background-size', 'cover')
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
				this.elementStyle.setProperty('background-image', `radial-gradient(${gradient})`)
			} else {
				let direction = background.gradient.direction
				if (direction && !direction.match(/\d+deg/))
					direction = 'to ' + direction
				if (direction)
					gradient = direction + ', ' + gradient
				this.elementStyle.setProperty('background-image', `linear-gradient(${gradient})`)
			}
		}
	}
	
	set border(border) {
		this.elementStyle.setProperty('border-style', border.style)
		this.elementStyle.setProperty('border-width', parseLength(border.width))
		this.elementStyle.setProperty('border-color', border.color)
		// if (!control.circle) style.borderRadius = parseLength(border.radius)
		this.elementStyle.setProperty('border-radius', parseLength(border.radius))
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
		this.elementStyle.setProperty('box-shadow', boxShadows.join(', '))
	}
}

class Style extends Stylable() {
	constructor(selector) {
		super()
		this.selector = selector
	}
	
	createStyleRule(selector = '') {
		return Stylesheet.createRule(this.selector + selector)
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
		this.cellStyle.setProperty('--row-span', span)
	}
	
	set columnSpan(span) {
		this.cellStyle.setProperty('--column-span', span)
	}
}

class ControlStyleTemplate extends ControlStyle(Style) {
	constructor(selector) {
		super(selector)
		this.cellStyle = this.createStyleRule()
		this.containerStyle = this.createStyleRule(' .container')
		this.elementStyle = this.createStyleRule(' .control')
		this.textLabel = this.createTextLabel()
		this.iconLabel = this.createIconLabel()
		this.imageLabel = this.createImageLabel()
	}
	
	setActiveStyle(style) {
		let activeStyle = this.createSubStyle('.active')
		activeStyle.setStyle(style)
	}

	createSubStyle(selector) {
		let style = new Style(this.selector + selector)
		style.parent = this
		style.elementStyle = style.createStyleRule(' .control')
		return style
	}
	
	createTextLabel() {
		let textLabel = new LabelStyle('text-label', this)
		return textLabel
	}
	
	createIconLabel() {
		let iconLabel = new LabelStyle('icon-label', this)
		return iconLabel
	}
	
	createImageLabel() {
		let imageLabel = new LabelStyle('image-label', this)
		imageLabel.elementStyle = this.createStyleRule(' img')
		return imageLabel
	}
}

class SliderStyle extends Style {
	constructor(selector) {
		super(selector)
		this.track = new SliderTrackStyle(this)
	}
	
	setStyle(style) {
		super.setStyle(style)
		
		if (style.track && this.track) {
			// this.track.setStyle(style.track)
		}
	}
}

class StyleElement extends Stylable(HTMLElement) {
	cssProperties = [
		'alignItems',
		'justifyContent',
		'background',
		'box-shadow',
		'color',
		'--offset-x',
		'--offset-y',
	]
	
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
		this.elementStyle.setProperty('color', color)
	}
	
	set font(font) {
		// this.elementStyle.setProperty('color', parseColor(font.color, font.alpha))
		if (font.family) this.elementStyle.setProperty('font-family', font.family)
		this.elementStyle.setProperty('font-size', parseLength(font.size))
	}
	
	set textShadow(shadows) {
		let textShadows = []
		for (let [shadow] of shadows) {
			let textShadow = []
			textShadow.push(parseLength(shadow.offsetX || 0), parseLength(shadow.offsetY || 0))
			if ('blurRadius' in shadow) textShadow.push(parseLength(shadow.blurRadius))
			if (shadow.color) textShadow.push(parseColor(shadow.color, shadow.alpha))
			textShadows.push(textShadow.join(' '))
		}
		this.elementStyle.setProperty('text-shadow', textShadows.join(', '))
	}
}

class LabelStyle extends StylableLabel(Style) {
	constructor(selector, parent) {
		super(parent.selector + ' ' + selector)
		this.parent = parent
		this.containerStyle = this.createStyleRule()
		this.elementStyle = this.createStyleRule(' span')
	}
}

class SliderThumbStyle extends Style {
	constructor(parent) {
		super('panel-slider .control::-webkit-slider-thumb', parent)
		this.containerStyle = this.createStyleRule()
		this.elementStyle = this.createStyleRule()
	}
	
	set height(height) {
		this.elementStyle.setProperty('--thumb-height', parseLength(height))
	}
}

class SliderTrackStyle extends Style {
	constructor(parent) {
		super('panel-slider  .control::-webkit-slider-runnable-track', parent)
		this.containerStyle = this.createStyleRule()
		this.elementStyle = this.createStyleRule()
	}
	
	set height(height) {
		this.elementStyle.setProperty('--track-height', parseLength(height))
	}
}

export { ControlStyle, ControlStyleTemplate, SliderStyle, Stylable, StylableLabel, StyleElement, SliderThumbStyle, SliderTrackStyle }
