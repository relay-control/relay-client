const net = require('net')

var modal = {}

modal.show = function(text) {
	this.text.textContent = text
	this.button1.textContent = "OK"
	this.dialog.showModal()
}


const client = new net.Socket()

client.on('connect', () => {
	//'connect' listener
	console.log('connected to Relay server!')
})

client.on('data', (data) => {
	console.log(data.toString())
	client.end()
})

client.on('error', (err) => {
	// if (err.code === "ECONNREFUSED") console.log("Unable to connect to Relay server")
	if (err.code === "ECONNREFUSED") modal.show("Unable to connect to Relay server")
	console.dir(err)
})

client.on('close', () => {
	console.log('connection to Relay server closed')
})

client.on('end', () => {
	console.log('disconnected from Relay server')
})

document.addEventListener("DOMContentLoaded", () => {
	modal.dialog = document.body.appendChild(document.createElement("dialog"))
	modal.text = modal.dialog.appendChild(document.createElement("p"))
	modal.button1 = modal.dialog.appendChild(document.createElement("button"))
	modal.button1.addEventListener("click", () => modal.dialog.close())
	
	let connectForm = document.getElementById("connectForm")
	connectForm.addEventListener("submit", e => {
		e.preventDefault()
		console.log(e.target.elements.address.value, e.target.elements.port.value)
	})
	// connectForm.elements.port.value = "o_o"
	
	let connectDialog = document.getElementById("connectDialog")
	connectDialog.showModal()
	// client.connect(8098, "192.168.0.202")
})

var RelaySocket = {}

RelaySocket.send = function(button, state) {
	client.write(Buffer.from([button | (state << 7)]))
}
