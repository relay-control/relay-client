class Control extends ControlStyle {
	constructor(panel) {
		let id = panel.getNextID()
		super(id)
		this.id = id
		
		this.panel = panel.parent
		
		this.area = document.createElement('div')
		this.area.classList.add('cell')
		this.area.id = this.id
		panel.addControl(this)
		
		this.container = document.createElement('div')
		this.container.classList.add('container')
		this.area.appendChild(this.container)
	}
	
	addClass(className) {
		this.area.classList.add(className)
	}
	
	removeClass(className) {
		this.area.classList.remove(className)
	}
	
	set row(row) {
		this.setAreaStyle('--row', row)
	}
	
	set column(column) {
		this.setAreaStyle('--column', column)
	}
	
	createTextLabel() {
		let textLabel = new TextLabel(this)
		return textLabel
	}
	
	createIconLabel() {
		let iconLabel = new IconLabel(this)
		return iconLabel
	}
	
	createImageLabel() {
		let imageLabel = new ImageLabel(this)
		return imageLabel
	}
}

class SubStyle extends Style {
	constructor(selector, parent) {
		super(parent.selector + selector)
		this.parent = parent
	}
}

class LabelStyle extends SubStyle {
	constructor(selector, parent) {
		super(' .label' + selector, parent)
	}
	
	get styleProperties() {
		return super.styleProperties.concat([
			'color',
			'font',
			'textShadow',
		])
	}
	
	get containerStyle() {
		return this.getStyleRule(`${this.selector}`)
	}
	
	get controlStyle() {
		return this.getStyleRule(`${this.selector} span`)
	}
	
	set anchor(anchor) {
		super.anchor = anchor
		this.setAreaStyle('--parent', anchor.parent)
	}
	
	set color(color) {
		this.setControlStyle('color', color)
	}
	
	set font(font) {
		// this.setControlStyle('color', parseColor(font.color, font.alpha))
		if (font.family) this.setControlStyle('font-family', font.family)
		this.setControlStyle('font-size', parseLength(font.size))
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
		this.setControlStyle('text-shadow', textShadows.join(', '))
	}
}

class TextLabelStyle extends LabelStyle {
	constructor(parent) {
		super('.text', parent)
	}
}

class IconLabelStyle extends LabelStyle {
	constructor(parent) {
		super('.icon', parent)
	}
}

class ValueLabelStyle extends LabelStyle {
	constructor(parent) {
		super('.value', parent)
	}
}

class ActiveLabelStyle extends SubStyle {
	constructor(parent) {
		super('.active .label', parent)
		// this.containerSelector = `${this.selector}`
		this.controlSelector = `${this.selector}`
	}
	
	get styleProperties() {
		return super.styleProperties.concat([
			'font',
		])
	}
	
	set font(font) {
		this.setControlStyle('color', parseColor(font.color, font.alpha))
		if (font.family) this.setControlStyle('font-family', font.family)
		this.setControlStyle('font-size', parseLength(font.size))
	}
}

class ActiveStyle extends SubStyle {
	constructor(parent) {
		super('.active', parent)
	}
}

class SliderThumbStyle extends SubStyle {
	constructor(parent) {
		super('::-webkit-slider-thumb', parent)
	}
	
	get containerStyle() {
		return this.parent.getStyleRule(`${this.selector}`)
	}
	
	get controlStyle() {
		return this.parent.getStyleRule(`${this.selector}`)
	}
	
	set height(height) {
		this.parent.setControlStyle('--thumb-height', parseLength(height))
	}
}

class SliderTrackStyle extends SubStyle {
	constructor(parent) {
		super('::-webkit-slider-runnable-track', parent)
	}
	
	get containerStyle() {
		return this.parent.getStyleRule(`${this.selector}`)
	}
	
	get controlStyle() {
		return this.parent.getStyleRule(`${this.selector}`)
	}
	
	set height(height) {
		this.parent.setControlStyle('--track-height', parseLength(height))
	}
}
