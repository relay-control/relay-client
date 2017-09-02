class socket {
	connect(address, port) {
		if (this.isConnected())
			this.ws.close(4001)
		let url = new URL(`http://${address}:${port}`)
		let ws = new WebSocket('ws://' + address + ':' + port)
		ws.onmessage = (e) => this.onmessage(e)
		ws.onopen = (e) => this.onopen(e)
		ws.onclose = (e) => this.onclose(e)
		ws.onerror = (err) => this.onerror(err)
		this.ws = ws
		this.address = address
		this.port = port
		this.server = url.origin
	}
	
	sendInput(data) {
		this.ws.send(data)
	}
	
	close(code, reason) {
		this.ws.close(code, reason)
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
		document.getElementById('panel-list2').style.visibility = 'visible'
		document.getElementById('loading').style.visibility = 'hidden'
		document.getElementById('connectDialog').close()
	}
	
	onclose(e) {
		let status = document.getElementById('connection-status')
		status.textContent = "Not connected"
		document.getElementById('loading').style.visibility = 'hidden'
		if (e.code !== 4001)
			document.getElementById('connectDialog').close()
		console.log(e)
		console.log('connection to Relay server closed')
	}
	
	onerror(err) {
		modal.show("Unable to connect to Relay server")
		console.dir(err)
	}
}
