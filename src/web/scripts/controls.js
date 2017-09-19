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
		this.container.appendChild(this.control)
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
			if (document.getElementById('connect-dialog').open ||
				document.getElementById('device-info').open ||
				modal.dialog.open)
				return
			if (e.code === 'Escape' || e.code === 'Backspace') {
				let panel = document.getElementById('panel')
				let style = window.getComputedStyle(panel)
				if (style.display === 'grid') {
					panel.style.display = 'none'
					menuViewModel.currentPanel(null)
					let menu = document.getElementById('menu')
					menu.style.display = 'flex'
				}
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
		iframe.contentDocument.body.appendChild(this.control)
		iframe.contentDocument.body.classList.add('default', 'slider')
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
		for (let property of this.styleProperties) {
			if (property in style) this[property] = style[property]
		}
		
		if (style.thumb) {
			let ThumbStyle = new SliderThumbStyle(this)
			ThumbStyle.apply(style.thumb)
		}
		
		if (style.track) {
			let TrackStyle = new SliderTrackStyle(this)
			TrackStyle.apply(style.track)
		}
	}
	
	getControlStyle() {
		return this.getStyleRule(`${this.selector}`)
	}
}

class SubStyle extends Style {
	constructor(selector, parent) {
		super(parent.selector + selector)
		this.parent = parent
	}
}

class LabelStyle extends SubStyle {
	constructor(parent) {
		super(' .label', parent)
	}
	
	get styleProperties() {
		return [
			'inset',
			'size',
			'width',
			'height',
			'background',
			'shadows',
			'border',
			'font',
		]
	}
	
	getContainerStyle() {
		return this.getStyleRule(`${this.selector}`)
	}
	
	getControlStyle() {
		return this.getStyleRule(`${this.selector}`)
	}
	
	set font(font) {
		this.setControlStyle('color', parseColor(font.color, font.alpha))
		if (font.family) this.setControlStyle('font-family', font.family)
		this.setControlStyle('font-size', parseLength(font.size))
	}
}

class ActiveLabelStyle extends SubStyle {
	constructor(parent) {
		super(' .control.active .label', parent)
	}
	
	get styleProperties() {
		return [
			'inset',
			'size',
			'width',
			'height',
			'background',
			'shadows',
			'border',
			'font',
		]
	}
	
	set font(font) {
		this.setControlStyle('color', parseColor(font.color, font.alpha))
		if (font.family) this.setControlStyle('font-family', font.family)
		this.setControlStyle('font-size', parseLength(font.size))
	}
	
	// getContainerStyle() {
		// return getStyleRule(`${this.selector}`)
	// }
	
	getControlStyle() {
		return getStyleRule(`${this.selector}`)
	}
}

class ActiveStyle extends SubStyle {
	constructor(parent) {
		super(' .control.active', parent)
	}
	
	// getContainerStyle() {
		// return getStyleRule(`${this.selector}`)
	// }
	
	getControlStyle() {
		return getStyleRule(`${this.selector}`)
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
		parent.value = this
	}
	
	setText(text) {
		this.element.textContent = text
	}
}

class TextLabel extends Label {
	constructor(parent) {
		super(parent)
		this.element.classList.add('text')
	}
	
	setText(text) {
		this.element.textContent = text
	}
}

class IconLabel extends Label {
	constructor(parent) {
		super(parent)
		this.element.classList.add('icon')
		this.icon = document.createElement('i')
		this.icon.classList.add('fa', 'fa-fw', 'fa-2x')
		this.element.appendChild(this.icon)
	}
	
	setIcon(icon) {
		this.icon.classList.add('fa-' + icon)
	}
}

var ControlTypes = {}

function buttonActivated(element) {
	element.classList.add('active')
	if (element.action)
		RelaySocket.sendInput({
			type: element.action.type,
			device: element.action.device,
			button: element.action.button,
			state: true,
		})
	// console.log("activated  ", element.id)
}

function buttonDeactivated(element) {
	element.classList.remove('active')
	if (element.action)
		RelaySocket.sendInput({
			type: element.action.type,
			device: element.action.device,
			button: element.action.button,
			state: false,
		})
	// console.log("deactivated", element.id)
}

function buttonPressed(element) {
	if (element.dataset.mode === 'toggle') {
		if (!element.wasActive) {
			buttonActivated(element)
		}
	} else {
		buttonActivated(element)
	}
	element.pressed = true
	// console.log("pressed ", element.id)
}

function buttonReleased(element) {
	if (element.dataset.mode === 'toggle') {
		if (element.wasActive)
			buttonDeactivated(element)
		element.wasActive = !element.wasActive
	} else {
		buttonDeactivated(element)
	}
	element.pressed = false
	// console.log("released", element.id)
}

ControlTypes['Button'] = {
	events: {
		mousedown: e => {
			buttonPressed(e.currentTarget)
		},
		mouseup: e => {
			buttonReleased(e.currentTarget)
		},
		mouseout: e => {
			if (e.currentTarget.pressed) {
				buttonReleased(e.currentTarget)
			}
		},
		touchstart: e => {
			// e.preventDefault()
			buttonPressed(e.currentTarget)
		},
		touchend: e => {
			e.preventDefault()
			buttonReleased(e.currentTarget)
		},
	},
}

ControlTypes['Slider'] = {
	events: {
		input: e => {
			// console.dir(e)
			// console.log(e.currentTarget.value)
			if (e.currentTarget.valueLabel)
				e.currentTarget.valueLabel.setText(e.currentTarget.value + '%')
			if (e.currentTarget.action)
				RelaySocket.sendInput({
					type: 'axis',
					device: e.currentTarget.action.device,
					axis: e.currentTarget.action.axis,
					value: e.currentTarget.value,
				})
		},
	},
}
