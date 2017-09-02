const net = require('net')

var modal = {}

modal.show = function(text) {
	this.text.textContent = text
	this.button1.textContent = "OK"
	this.dialog.showModal()
}


var host = "192.168.0.202:57882"

class socket {
	connect(address, port) {
		let ws = new WebSocket('ws://' + address + ':' + port)
		ws.onmessage = (e) => this.onmessage(e)
		ws.onopen = (e) => this.onopen(e)
		ws.onclose = (e) => this.onclose(e)
		ws.onerror = (err) => this.onerror(err)
		this.ws = ws
		this.address = address
		this.port = port
	}
	
	send(data) {
		this.ws.send(data)
	}
	
	isConnected() {
		return this.ws && this.ws.readyState === WebSocket.OPEN
	}
	
	onmessage(e) {
		console.log(e.data)
	}
	
	onopen(e) {
		console.log('connected to Relay server!')
		console.log(this.isConnected())
		
		updatePanels()
		
		let status = document.getElementById('connection-status')
		status.textContent = "Connected to " + this.address
	}
	
	onclose() {
		console.log('connection to Relay server closed')
	}
	
	onerror(err) {
		// if (err.code === "ECONNREFUSED") console.log("Unable to connect to Relay server")
		if (err.code === "ECONNREFUSED") modal.show("Unable to connect to Relay server")
		console.dir(err)
	}
}

let ws = new socket()


document.addEventListener("DOMContentLoaded", () => {
	modal.dialog = document.body.appendChild(document.createElement("dialog"))
	modal.text = modal.dialog.appendChild(document.createElement("p"))
	modal.button1 = modal.dialog.appendChild(document.createElement("button"))
	modal.button1.addEventListener("click", () => modal.dialog.close())
	
	let connectDialog = document.getElementById("connectDialog")
	
	let connectForm = document.getElementById("connectForm")
	connectForm.addEventListener("submit", e => {
		e.preventDefault()
		ws.connect(e.target.elements.address.value, e.target.elements.port.value)
		connectDialog.close()
	})
	let cancel = document.getElementById("connect-cancel")
	cancel.addEventListener('click', e => {
		connectDialog.close()
	})
	connectForm.elements.address.value = "192.168.0.202"
	connectForm.elements.port.value = "57882"
})

var RelaySocket = {}

RelaySocket.sendInput = function(input) {
	input.type = 'joy'
	let message = 0
	// message = message | input.type
	switch (input.type) {
		case 'key':
			message = message & input.key
			message = message & input.state
			break
		case 'joy':
			// message = message & input.joyID
			// buttonType? button|axis
			
			message = message & input.button
			message = message & input.state
			break
		case 'macro':
			// input.body
			break
	}
	ws.send(JSON.stringify(input))
}
