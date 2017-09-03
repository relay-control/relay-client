function applyStyle(selector, control, element, mainControl) {
	let style = getStyleRule(selector)
	let data = control
	style.color = data.color
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
		['label', (style, data, element) => {
			// style.color = data.color
		}],
		// ['padding', (style, data, element, control) => {
			// style.padding = `${data.y} ${data.x}`
		// }],
		['border', (style, data, element, control) => {
			style.borderStyle = data.style
			style.borderWidth = data.width
			style.borderColor = data.color
			if (!control.circle) style.borderRadius = data.radius
		}],
		['background', (style, data) => {
			style.backgroundColor = data.color
			style.backgroundImage = data.image || "initial"
			if (data.gradient) {
				let gradient = []
				for (point of data.gradient) {
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
			for (shadow of data) {
				let boxShadow = []
				if (shadow.inset) boxShadow.push("inset")
				boxShadow.push(shadow.offsetX, shadow.offsetY)
				if (typeof shadow.blurRadius !== 'undefined') boxShadow.push(shadow.blurRadius)
				if (typeof shadow.spreadRadius !== 'undefined') boxShadow.push(shadow.spreadRadius)
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
