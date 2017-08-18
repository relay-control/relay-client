let socket = new RelayAgent("192.168.0.202", 58005)

const inputType = {
	keyboard: 1,
	joystick: 1,
	macro: 1,
}

socket.on("message", (data) => {
	
})

function socket.sendInput(input) {
	let message = input.type
	switch (input.type) {
		case (inputType.keyboard):
			message = message & input.key
			message = message & input.state
			break
		case (inputType.joystick):
			message = message & input.joyID
			// buttonType? button|axis
			message = message & input.button
			message = message & input.state
			break
		case (inputType.macro):
			// input.body
			break
	}
	socket.send(message)
}
