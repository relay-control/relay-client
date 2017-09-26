class Control extends ControlStyle {
	constructor(panel) {
		let id = panel.getNextID()
		super(id)
		this.id = id
		
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
		this.row = row
		this.area.style.gridRowStart = row
	}
	
	setColumn(column) {
		this.column = column
		this.area.style.gridColumnStart = column
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
			RelaySocket.sendInput({
				type: this.action.type,
				device: this.action.device,
				button: this.action.button,
				state: true,
			})
		}
	}
	
	deactivate() {
		this.removeClass('active')
		if (this.action) {
			RelaySocket.sendInput({
				type: this.action.type,
				device: this.action.device,
				button: this.action.button,
				state: false,
			})
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
		
		this.rules = {}
		
		let iframe = document.createElement('iframe')
		iframe.classList.add('control')
		
		this.container.appendChild(iframe)
		
		iframe.contentDocument.body.addEventListener('keydown', e => {
			if (menuViewModel.isModalShown())
				return
			if (e.code === 'Escape' || e.code === 'Backspace') {
				goBack()
			}
		})
		
		let cssLink = document.createElement('link')
		cssLink.href = 'styles/slider.css'
		cssLink.rel = 'stylesheet'
		cssLink.type = 'text/css'
		iframe.contentDocument.head.appendChild(cssLink)
		
		let link = document.createElement('style')
		iframe.contentDocument.head.appendChild(link)
		this.stylesheet = link.sheet
		
		// slider.style['will-change'] = 'transform'
		this.control = document.createElement('input')
		this.control.type = 'range'
		this.control.id = this.id
		this.control.classList.add('control')
		iframe.contentDocument.body.appendChild(this.control)
		iframe.contentDocument.body.classList.add('default', 'slider')
		
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
	
	getStyleRule(selector) {
		let rule = this.rules[selector]
		if (!rule) {
			let index = this.stylesheet.rules.length
			this.stylesheet.insertRule(`${selector} {}`, index)
			rule = this.stylesheet.rules[index].style
			this.rules[selector] = rule
		}
		return rule
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
	
	getControlStyle() {
		return this.getStyleRule(`${this.selector}`)
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
					RelaySocket.sendInput({
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
		])
	}
	
	getContainerStyle() {
		return this.getStyleRule(`${this.selector}`)
	}
	
	getControlStyle() {
		return this.getStyleRule(`${this.selector} span`)
	}
	
	set color(color) {
		this.setControlStyle('color', color)
	}
	
	set font(font) {
		// this.setControlStyle('color', parseColor(font.color, font.alpha))
		if (font.family) this.setControlStyle('font-family', font.family)
		this.setControlStyle('font-size', parseLength(font.size))
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
	
	setPosition(position) {
		if (position) setFlexPosition(this.element.style, position)
	}
	
	setAnchor(anchor) {
		if (anchor === 'container') {
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
	}
	
	setIcon(icon) {
		this.icon.classList.add('fa-' + icon)
	}
}
