class FileNotFoundError extends Error { }

class Recon extends EventTarget {
	constructor(address, port) {
		super()
		
		this.address = address
		this.port = port
		
		this.url = new URL(`http://${address}:${port}`)
	}
	
	async getPanels() {
		let controller = {} || new AbortController()
		this.controller = controller
		let url = new URL('api/panels', this.url.origin)
		let response = await fetch(url.href, {cache: 'no-store', signal: controller.signal})
		if (!response.ok)
			throw new FileNotFoundError()
		return response.json()
	}
	
	abort() {
		this.controller.abort()
	}
	
	async getPanel(panel) {
		let response = await fetch(`${this.url.origin}/panels/${panel}/panel.xml`, {cache: 'no-cache'})
		if (!response.ok)
			throw new FileNotFoundError()
		let text = await response.text()
		return parseXml(text).panel
	}
	
	getAssetPath(file) {
		// return encodeURI(new URL(`panels/${this.currentPanel}/assets/${file}`, this.url.origin).href)
		return new URL(`panels/${this.currentPanel}/assets/${file}`, this.url.origin).href
	}
	
	connect(devices) {
		this.ws = new Socket(this.address, this.port, devices)
		
		this.ws.on('close', (e, previousState) => this.dispatchEvent(new CustomEvent('close', { detail: previousState })))
		// this.ws.on('state', (e) => console.log(e))
		
		return new Promise((resolve, reject) => {
			this.ws.on('open', (status) => {
				resolve(status.devices)
			})
			this.ws.on('close', () => {
				reject()
			})
		})
	}
	
	sendInput(input) {
		this.ws.ws.send(JSON.stringify(input))
	}
}

class Socket extends EventTarget {
	constructor(address, port, devices) {
		super()
		
		this.address = address
		this.port = port
		let url = `ws://${address}:${port}/websocket`
		if (devices.length > 0)
			url += '?' + devices.map(e => 'devices=' + e).join('&')
		this.ws = new WebSocket(url)
		this.ws.onmessage = (e) => this.onmessage(e)
		this.ws.onopen = (e) => this.onopen(e)
		this.ws.onclose = (e) => this.onclose(e)
		this.ws.onerror = (err) => this.onerror(err)
		this.previousState = this.ws.readyState
		console.log("Opening WebSocket connection")
		// console.log('readyState:', this.ws.readyState)
	}
	
	connect2() {
		if (this.isConnected()) {
			this.close(4001)
			return
		}
		// console.log('readyState:', this.ws.readyState)
		let url = new URL(`http://${address}:${port}`)
		let ws = new WebSocket('ws://' + address + ':' + port)
		this.ws = ws
		this.server = url.origin
	}
	
	close(code, reason) {
		this.ws.close(code, reason)
		console.log("Closing WebSocket connection")
		// console.log('readyState:', this.ws.readyState)
		this.previousState = this.ws.readyState
		// unbind events?
	}
	
	isConnected() {
		return this.ws && this.ws.readyState === WebSocket.OPEN
	}
	
	onmessage(e) {
		let message = JSON.parse(e.data)
		// console.log(message)
		this.dispatchEvent(new CustomEvent(message.eventType, { detail: message }))
	}
	
	onopen(e) {
		// this.emit('open')
		console.log('WebSocket connection opened')
		// console.log('readyState:', this.ws.readyState)
		this.previousState = this.ws.readyState
	}
	
	onclose(e) {
		this.dispatchEvent(new CustomEvent('close', { detail: this.previousState }))
		let previousState = this.previousState
		this.previousState = this.ws.readyState
		console.log('WebSocket connection closed')
		// console.log('readyState:', e.target.readyState)
		console.log('code:', e.code)
	}
	
	onerror(err) {
		// modal.show("Unable to connect to Relay server")
		// console.dir(err)
		// console.log('readyState:', err.target.readyState)
	}
}
