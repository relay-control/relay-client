class Control {
	constructor(panel) {
		this.id = panel.getNextID()
		
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
	
	setRowSpan(span) {
		this.area.style.gridRowEnd = this.row + span
	}
	
	setColumnSpan(span) {
		this.area.style.gridColumnEnd = this.column + span
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
		this.frame = iframe
		
		this.container.appendChild(iframe)
		
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
	
	applyStyle(selector, control) {
		let element = this.control
		let style = this.getStyleRule(selector)
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
						this.applyStyle(selector + selector2, control[child], element, control)
						if (handler) handler(this.getStyleRule(selector + selector2), control[child], element, control)
					}
				}
			}
		}
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
	if (element.action)
		RelaySocket.sendInput({
			type: element.action.type,
			button: element.action.button,
			state: true,
		})
	console.log("activated  ", element.id)
}

function buttonDeactivated(element) {
	if (element.action)
		RelaySocket.sendInput({
			type: element.action.type,
			button: element.action.button,
			state: false,
		})
	console.log("deactivated", element.id)
}

function buttonPressed(element) {
	if (element.dataset.mode === "toggle") {
		if (!element.classList.contains("active")) {
			buttonActivated(element)
		}
	} else {
		buttonActivated(element)
	}
	element.dataset.pressed = true
	element.classList.add("pressed")
	// console.log("pressed ", element.id)
}

function buttonReleased(element) {
	if (element.dataset.mode === "toggle") {
		element.classList.toggle("active")
		if (!element.classList.contains("active"))
			buttonDeactivated(element)
	} else {
		buttonDeactivated(element)
	}
	delete element.dataset.pressed
	element.classList.remove("pressed")
	// console.log("released", element.id)
}

ControlTypes['Button'] = {
	tag: 'button',
	events: {
		mousedown: e => {
			buttonPressed(e.currentTarget)
		},
		mouseup: e => {
			buttonReleased(e.currentTarget)
		},
		mouseout: e => {
			if (e.currentTarget.dataset.pressed) {
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
	tag: 'input',
	events: {
		input: e => {
			// console.dir(e)
			// console.log(e.currentTarget.value)
			// buttonReleased(e.currentTarget)
			e.currentTarget.valueLabel.setText(e.currentTarget.value + '%')
			if (e.currentTarget.action)
				RelaySocket.sendInput({
					type: 'axis',
					axis: e.currentTarget.action.axis,
					value: e.currentTarget.value,
				})
		},
	},
	onCreate: (element) => {
		// element.setAttribute("list", "datalist-" + element.id)
		// let datalist = element.appendChild(document.createElement("datalist"))
		// datalist.id = "datalist-" + element.id
		// let option = datalist.appendChild(document.createElement("option"))
		// option.value = 50
		// let trackStyle = createStyleRule(`#${element.id}::-webkit-slider-runnable-track`)
		// applyStyle(trackStyle, element.track)
		// let thumbStyle = createStyleRule(`#${element.id}::-webkit-slider-thumb`)
		// applyStyle(thumbStyle, control.thumb)
		// thumbStyle.marginTop = `${-parseInt(control.thumb.height) / 2 + parseInt(control.track.height) / 2 - 1}px`
	},
}

ControlTypes['Text'] = {
	tag: 'span',
	events: {},
}