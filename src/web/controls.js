var ControlTypes = {}

function buttonActivated(element) {
	if (element.dataset.button)
		RelaySocket.sendInput({
			type2: 'button',
			button: element.dataset.button,
			state: 1,
		})
	console.log("activated  ", element.id)
}

function buttonDeactivated(element) {
	if (element.dataset.button)
		RelaySocket.sendInput({
			type2: 'button',
			button: element.dataset.button,
			state: 0,
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
	console.log("pressed ", element.id)
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
	console.log("released", element.id)
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
	onCreate: (element, control) => {
		element.dataset.mode = control.mode
	},
}

ControlTypes['Slider'] = {
	tag: 'input',
	attributes: {
		type: 'range',
	},
	events: {
		input: e => {
			// console.dir(e)
			// console.log(e.currentTarget.value)
			// buttonReleased(e.currentTarget)
			if (e.currentTarget.dataset.axis)
				RelaySocket.sendInput({
					type2: 'axis',
					axis: e.currentTarget.dataset.axis,
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
	onCreate: (element) => {
	},
}