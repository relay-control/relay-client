class Socket {
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
		
		menuViewModel.connected(true)
		menuViewModel.currentServer(this.address)
		menuViewModel.connectDialog.connecting(false)
		if (menuViewModel.connectDialog.isOpen())
			menuViewModel.connectDialog.close()
	}
	
	onclose(e) {
		let previousState = this.previousState
		this.previousState = this.ws.readyState
		console.log('WebSocket connection closed')
		console.log('readyState:', e.target.readyState)
		console.log('code:', e.code)
		menuViewModel.connected(false)
		menuViewModel.currentServer(null)
		// closing existing websocket before opening new
		if (e.code === 4001) {
			this.connect(this.address, this.port)
			return
		}
		if (previousState === WebSocket.CONNECTING) {
			if (menuViewModel.connectDialog.isOpen())
				menuViewModel.connectDialog.close()
			menuViewModel.connectDialog.connecting(false)
			menuViewModel.modalDialog.show("Unable to connect to Relay server", previousState)
		}
		if (previousState === WebSocket.OPEN) {
			menuViewModel.modalDialog.show("Disconnected from Relay server")
		}
	}
	
	onerror(err) {
		// modal.show("Unable to connect to Relay server")
		// console.dir(err)
		// console.log('readyState:', err.target.readyState)
	}
}
