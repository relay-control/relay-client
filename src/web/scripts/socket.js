class socket {
	connect(address, port) {
		this.address = address
		this.port = port
		if (this.isConnected()) {
			this.close(4001)
			return
		}
		// console.log('readyState:', this.ws.readyState)
		let url = new URL(`http://${address}:${port}`)
		let ws = new WebSocket('ws://' + address + ':' + port)
		this.previousState = ws.readyState
		console.log("Opening WebSocket connection")
		console.log('readyState:', ws.readyState)
		ws.onmessage = (e) => this.onmessage(e)
		ws.onopen = (e) => this.onopen(e)
		ws.onclose = (e) => this.onclose(e)
		ws.onerror = (err) => this.onerror(err)
		this.ws = ws
		this.server = url.origin
	}
	
	sendInput(data) {
		this.ws.send(data)
	}
	
	close(code, reason) {
		this.ws.close(code, reason)
		console.log("Closing WebSocket connection")
		console.log('readyState:', this.ws.readyState)
		this.previousState = this.ws.readyState
		// unbind events?
	}
	
	isConnected() {
		return this.ws && this.ws.readyState === WebSocket.OPEN
	}
	
	onmessage(e) {
		console.log(e.data)
	}
	
	onopen(e) {
		console.log('WebSocket connection opened')
		console.log('readyState:', this.ws.readyState)
		this.previousState = this.ws.readyState
		
		updatePanels()
		
		let status = document.getElementById('connection-status')
		status.textContent = "Connected to " + this.address
		document.getElementById('panel-list2').style.visibility = 'visible'
		document.getElementById('loading').style.visibility = 'hidden'
		document.getElementById('connectDialog').close()
	}
	
	onclose(e) {
		console.log('WebSocket connection closed')
		console.log('readyState:', e.target.readyState)
		console.log('code:', e.code)
		// closing existing websocket before opening new
		if (e.code === 4001) {
			this.connect(this.address, this.port)
		}
		if (this.previousState === WebSocket.CONNECTING) {
			document.getElementById('connectDialog').close()
			let status = document.getElementById('connection-status')
			status.textContent = "Not connected"
			document.getElementById('loading').style.visibility = 'hidden'
			modal.show("Unable to connect to Relay server")
		}
		if (this.previousState === WebSocket.OPEN) {
			modal.show("Disconnected from Relay server")
		}
		this.previousState = this.ws.readyState
	}
	
	onerror(err) {
		// modal.show("Unable to connect to Relay server")
		// console.dir(err)
		// console.log('readyState:', err.target.readyState)
	}
}
