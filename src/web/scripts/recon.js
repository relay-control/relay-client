class Recon {
	constructor(address, port, devices) {
	}
	
	con(address, port) {
		this.address = address
		this.port = port
	}
	
	connect(address, port, devices, cb) {
		if (devices)
			port += '?' + devices.map(e => 'devices=' + e).join('&')
		let socket = new Socket()
		
		socket.connect(address, port)
		
		this.socket = socket
		
		socket.ws.onmessage = (e) => {
			let status = JSON.parse(e.data)
			console.log(status)
			cb(status.devices)
		}
	}
	
	sendInput(data) {
		this.socket.ws.send(data)
	}
}
