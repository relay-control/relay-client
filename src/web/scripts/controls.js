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
	
	setRow(row) {
		this.area.style.setProperty('--row', row)
	}
	
	setColumn(column) {
		this.area.style.setProperty('--column', column)
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

class Button extends Control {
	constructor(panel) {
		super(panel)
		this.control = document.createElement('button')
		this.control.classList.add('control')
		this.container.appendChild(this.control)
		
		for (let [event, callback] of Object.entries(this.events)) {
			this.control.addEventListener(event, callback)
		}
	}
	
	activate() {
		this.addClass('active')
		if (this.action) {
			if (this.action.type === 'key' || this.action.type === 'button' || this.action.type === 'macro' || this.action.type === 'command') {
				recon.sendInput({
					type: this.action.type,
					deviceID: this.action.device,
					key: this.action.key,
					button: this.action.button,
					state: true,
					actions: this.action.action,
					command: this.action.command,
					args: this.action.args,
				})
			}
		}
	}
	
	deactivate() {
		this.removeClass('active')
		if (this.action) {
			if (this.action.type === 'key' || this.action.type === 'button') {
				recon.sendInput({
					type: this.action.type,
					deviceID: this.action.device,
					key: this.action.key,
					button: this.action.button,
					state: false,
					actions: this.action.action,
				})
			}
			if (this.action.type === 'view') {
				this.panel.setView(this.action.view)
			}
		}
	}
	
	press() {
		if (this.mode === 'toggle') {
			if (!this.wasActive) {
				this.activate()
			}
		} else {
			this.activate()
		}
		this.pressed = true
	}
	
	release() {
		if (this.mode === 'toggle') {
			if (this.wasActive)
				this.deactivate()
			this.wasActive = !this.wasActive
		} else {
			this.deactivate()
		}
		this.pressed = false
	}
	
	get events() {
		return {
			mousedown: e => {
				this.press()
			},
			mouseup: e => {
				this.release()
			},
			mouseout: e => {
				if (this.pressed) {
					this.release()
				}
			},
			touchstart: e => {
				// e.preventDefault()
				this.press()
			},
			touchend: e => {
				e.preventDefault()
				this.release()
			},
		}
	}
}

class Slider extends Control {
	constructor(panel) {
		super(panel)
		
		this.control = document.createElement('input')
		this.control.type = 'range'
		this.control.id = this.id
		this.control.classList.add('control')
		this.container.appendChild(this.control)
		
		for (let [event, callback] of Object.entries(this.events)) {
			this.control.addEventListener(event, callback)
		}
	}
	
	setSnapValue(value) {
		let listID = 'datalist-' + this.id
		this.control.setAttribute('list', listID)
		let datalist = document.createElement('datalist')
		datalist.id = listID
		this.container.appendChild(datalist)
		let option = document.createElement('option')
		option.value = value
		datalist.appendChild(option)
	}
	
	apply(style) {
		super.apply(style)
		
		if (style.valueLabel) {
			let valueLabelStyle = new ValueLabelStyle(this)
			valueLabelStyle.apply(style.valueLabel)
		}
		
		if (style.thumb) {
			let thumbStyle = new SliderThumbStyle(this)
			thumbStyle.apply(style.thumb)
		}
		
		if (style.track) {
			let trackStyle = new SliderTrackStyle(this)
			trackStyle.apply(style.track)
		}
	}
	
	get events() {
		return {
			input: e => {
				if (45 < e.currentTarget.value && e.currentTarget.value < 55)
					e.currentTarget.value = 50
				
				// avoid sending input if value is unchanged
				if (e.currentTarget.value === this.previousValue) return
				this.previousValue = e.currentTarget.value
				
				if (this.valueLabel)
					this.valueLabel.setText(e.currentTarget.value + '%')
				
				if (this.action) {
					recon.sendInput({
						type: 'axis',
						device: this.action.device,
						axis: this.action.axis,
						value: e.currentTarget.value,
					})
				}
			},
		}
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
	
	getContainerStyle() {
		return this.getStyleRule(`${this.selector}`)
	}
	
	getControlStyle() {
		return this.getStyleRule(`${this.selector} span`)
	}
	
	set anchor(anchor) {
		super.anchor = anchor
		this.areaStyle.setProperty('--parent', anchor.parent)
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
	}
	
	get styleProperties() {
		return super.styleProperties.concat([
			'font',
		])
	}
	
	// getContainerStyle() {
		// return getStyleRule(`${this.selector}`)
	// }
	
	getControlStyle() {
		return getStyleRule(`${this.selector}`)
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
	
	getContainerStyle() {
		return this.parent.getStyleRule(`${this.selector}`)
	}
	
	getControlStyle() {
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
	
	getContainerStyle() {
		return this.parent.getStyleRule(`${this.selector}`)
	}
	
	getControlStyle() {
		return this.parent.getStyleRule(`${this.selector}`)
	}
	
	set height(height) {
		this.parent.setControlStyle('--track-height', parseLength(height))
	}
}

class Label {
	constructor(parent) {
		this.element = document.createElement('div')
		this.element.classList.add('label')
		this.parent = parent
	}
	
	setParent() {
		// first append the label to the area so that selectors such as control ID and templates are accounted for
		this.parent.area.appendChild(this.element)
		let computedStyle = window.getComputedStyle(this.element)
		let parent = computedStyle.getPropertyValue('--parent')
		if (parent === 'container') {
			this.parent.area.appendChild(this.element)
		} else {
			this.parent.control.appendChild(this.element)
		}
	}
}

class ValueLabel extends Label {
	constructor(parent) {
		super(parent)
		this.element.classList.add('value')
		this.span = document.createElement('span')
		this.element.appendChild(this.span)
		this.setParent()
		parent.value = this
	}
	
	setText(text) {
		this.span.textContent = text
	}
}

class TextLabel extends Label {
	constructor(parent) {
		super(parent)
		this.element.classList.add('text')
		this.span = document.createElement('span')
		this.element.appendChild(this.span)
		this.setParent()
	}
	
	setText(text) {
		this.span.textContent = text
	}
}

class IconLabel extends Label {
	constructor(parent) {
		super(parent)
		this.element.classList.add('icon')
		this.icon = document.createElement('span')
		this.icon.classList.add('fa', 'fa-fw', 'fa-2x')
		this.element.appendChild(this.icon)
		this.setParent()
	}
	
	setIcon(icon) {
		this.icon.classList.add('fa-' + icon)
	}
}

class ImageLabel extends Label {
	constructor(parent) {
		super(parent)
		this.element.classList.add('image')
		this.image = document.createElement('img')
		this.element.appendChild(this.image)
		this.setParent()
	}
	
	setImage(image) {
		this.image.src = recon.getAssetPath(image)
	}
}
