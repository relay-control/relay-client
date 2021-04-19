import parseXml from '/scripts/xml-parser.js'

export default class Recon extends EventTarget {
	static modifiers = {}
	static ConnectionState = signalR.HubConnectionState

	connect(address, port) {
		this.address = address
		this.port = port
		this.url = new URL(`http://${address}:${port}`)

		let connection = new signalR.HubConnectionBuilder()
			.withUrl(`${this.url.origin}/inputhub`, {
				skipNegotiation: true,
				transport: signalR.HttpTransportType.WebSockets,
			})
			.withAutomaticReconnect()
			.configureLogging(signalR.LogLevel.Information)
			.build()

		connection.onreconnecting(this.onReconnecting)
		connection.onreconnected(this.onReconnected)
		connection.onclose(this.onClose)
		connection.on('RecieveMessage', this.onMessage)

		this.connection = connection

		return this.connection.start()
	}

	get connectionState() {
		return this.connection?.state
	}

	on(event, eventHandler) {
		this.addEventListener(event, e => {
			eventHandler(e.detail)
		})
	}

	onReconnecting(error) {
		console.assert(this.connection.state === signalR.HubConnectionState.Reconnecting)
		let event = new CustomEvent('reconnecting', { detail: error })
		this.dispatchEvent(event)
	}

	onReconnected(connectionId) {
		console.assert(this.connection.state === signalR.HubConnectionState.Connected)
		let event = new CustomEvent('reconnected', { detail: connectionId })
		this.dispatchEvent(event)
	}
	
	onClose(error) {
		console.assert(this.connection.state === signalR.HubConnectionState.Disconnected)
		let event = new CustomEvent('close', { detail: error })
		this.dispatchEvent(event)
	}

	async getPanels() {
		let res = await fetch(`http://${this.address}:${this.port}/api/panels`)
		return res.json()
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

	async sendInput(input) {
		this.connection.invoke("SendInput", input)
	}

	async acquireDevice(deviceId) {
		this.connection.invoke("AcquireDevice", deviceId)
	}

	onMessage(message) {
		let event = new CustomEvent('close', { detail: message })
		this.dispatchEvent(event)
	}
}
