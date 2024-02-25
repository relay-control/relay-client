export default class Relay extends EventTarget {
	static InputType = {
		key: 1,
		button: 2,
		axis: 3,
		command: 4,
		macro: 5,
		delay: 6,
		view: 7,
	}
	static Modifiers = {}
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

		connection.onreconnecting(error => this.onReconnecting(error))
		connection.onreconnected(connectionId => this.onReconnected(connectionId))
		connection.onclose(error => this.onClose(error))
		connection.on('RecieveMessage', this.onMessage)

		this.connection = connection

		return this.connection.start()
	}

	disconnect() {
		return this.connection.stop()
	}

	get connectionState() {
		return this.connection?.state
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

	getPanels() {
		return this.connection.invoke('GetPanels')
	}

	getStaticUrl(path) {
		let url = new URL(path, this.url.origin)
		return url.href
	}

	sendInput(input) {
		return this.connection.invoke("SendInput", input)
	}

	acquireDevice(deviceId) {
		return this.connection.invoke("AcquireDevice", deviceId)
	}

	onMessage(message) {
		let event = new CustomEvent('close', { detail: message })
		this.dispatchEvent(event)
	}
}
