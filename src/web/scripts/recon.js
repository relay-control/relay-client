class EventEmitter {
	constructor() {
		this.events = {}
	}

	on(event, listener) {
		if (typeof this.events[event] !== 'object') {
			this.events[event] = []
		}

		this.events[event].push(listener)
	}

	removeListener(event, listener) {
		if (typeof this.events[event] === 'object') {
			let idx = this.events[event].indexOf(listener)

			if (idx > -1) {
				this.events[event].splice(idx, 1)
			}
		}
	}

	emit(event, ...args) {
		if (typeof this.events[event] === 'object') {
			let listeners = this.events[event].slice()

			for (let i = 0; i < listeners.length; i++) {
				listeners[i](...args)
			}
		}
	}

	once(event, listener) {
		let g = (...args) => {
			this.removeListener(event, g)
			listener(...args)
		}
		this.on(event, g)
	}
}

class FileNotFoundError extends Error { }

class Recon extends EventEmitter {
	constructor(address, port) {
		super()
		
		this.address = address
		this.port = port
		
		this.url = new URL(`http://${address}:${port}`)
	}
	
	async getPanels() {
		let url = new URL('api/panels', this.url.origin)
		let response = await fetch(url.href, {cache: 'no-store'})
		if (!response.ok)
			throw new FileNotFoundError()
		return response.json()
	}
	
	async getPanel(panel) {
		let response = await fetch(`${this.url.origin}/panels/${panel}/panel.xml`, {cache: 'no-store'})
		if (!response.ok)
			throw new FileNotFoundError()
		let str = await response.text()
		let domParser = new window.DOMParser()
		return domParser.parseFromString(str, 'text/xml')
	}
	
	getAssetPath(file) {
		// return encodeURI(new URL(`panels/${this.currentPanel}/assets/${file}`, this.url.origin).href)
		return new URL(`panels/${this.currentPanel}/assets/${file}`, this.url.origin).href
	}
	
	connect(devices) {
		this.ws = new Socket(this.address, this.port, devices)
		
		this.ws.on('close', (e, previousState) => this.emit('close', e, previousState))
		
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

class Socket extends EventEmitter {
	constructor(address, port, devices) {
		super()
		
		this.address = address
		this.port = port
		let url = `ws://${address}:${port}`
		if (devices.length > 0)
			url += '?' + devices.map(e => 'devices=' + e).join('&')
		this.ws = new WebSocket(url)
		this.ws.onmessage = (e) => this.onmessage(e)
		this.ws.onopen = (e) => this.onopen(e)
		this.ws.onclose = (e) => this.onclose(e)
		this.ws.onerror = (err) => this.onerror(err)
		this.previousState = this.ws.readyState
		console.log("Opening WebSocket connection")
		console.log('readyState:', this.ws.readyState)
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
		console.log('readyState:', this.ws.readyState)
		this.previousState = this.ws.readyState
		// unbind events?
	}
	
	isConnected() {
		return this.ws && this.ws.readyState === WebSocket.OPEN
	}
	
	onmessage(e) {
		let message = JSON.parse(e.data)
		console.log(message)
		this.emit(message.eventType, message)
	}
	
	onopen(e) {
		// this.emit('open')
		console.log('WebSocket connection opened')
		console.log('readyState:', this.ws.readyState)
		this.previousState = this.ws.readyState
	}
	
	onclose(e) {
		this.emit('close', e, this.previousState)
		let previousState = this.previousState
		this.previousState = this.ws.readyState
		console.log('WebSocket connection closed')
		console.log('readyState:', e.target.readyState)
		console.log('code:', e.code)
	}
	
	onerror(err) {
		// modal.show("Unable to connect to Relay server")
		// console.dir(err)
		// console.log('readyState:', err.target.readyState)
	}
}
