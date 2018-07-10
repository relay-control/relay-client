class Recon {
	constructor(address, port, devices) {
	}
	
	con(address, port) {
		this.address = address
		this.port = port
		
		this.url = new URL(`http://${address}:${port}`)
	}
	
	connect(devices, cb) {
		let port = this.port
		if (devices)
			port += '?' + devices.map(e => 'devices=' + e).join('&')
		
		let socket = new Socket()
		
		socket.connect(this.address, this.port)
		
		this.socket = socket
		
		socket.ws.onmessage = (e) => {
			let status = JSON.parse(e.data)
			console.log(status)
			cb(status.devices)
		}
	}
	
	getPanel(panel, cb) {
		let xhr = new XMLHttpRequest()
		xhr.open("GET", encodeURI(`${this.url.origin}/panels/${panel}/${panel}.xml`))
		xhr.responseType = 'document'
		xhr.send()
		xhr.onload = cb
	}
	
	get panels() {
		return new URL('api/panels', this.url.origin).href
	}
	
	get asset() {
		return encodeURI(new URL(`panels/${this.currentPanel}/assets`, this.url.origin).href)
	}
	
	sendInput(input) {
		this.socket.ws.send(JSON.stringify(input))
	}
}
