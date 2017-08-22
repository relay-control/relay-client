var ControlTypes = {}

function buttonActivated(element) {
	if (element.dataset.button) RelaySocket.send(element.dataset.button, 1)
	console.log("activated  ", element.id)
}

function buttonDeactivated(element) {
	if (element.dataset.button) RelaySocket.send(element.dataset.button, 0)
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

let events = {
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
}

ControlTypes['Button'] = {
	tag: "button",
	events: events,
	onCreate: (element) => {
	},
}

ControlTypes['Slider'] = {
	tag: "input",
	attributes: {
		type: "range",
	},
	events: {
		input: e => {
			// console.dir(e)
			// console.log(e.currentTarget.value)
			// buttonReleased(e.currentTarget)
			if (e.currentTarget.dataset.axis) RelaySocket.send("axis", e.currentTarget.dataset.axis, e.currentTarget.value)
		},
	},
	onCreate: (element) => {
	},
}

ControlTypes['Text'] = {
	tag: "span",
	events: events,
	onCreate: (element) => {
	},
}