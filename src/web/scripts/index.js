import Recon from '/scripts/recon.js'
import { createApp } from '/scripts/vue.esm-browser.js'
import { Dialog, DialogButton } from '/scripts/modal.js'

let recon = new Recon()

function setCookie(name, value, maxAge = new Date(8.64e15)) {
	value = encodeURIComponent(value)
	document.cookie = `${name}=${value}; Max-Age=${maxAge.toUTCString()}; SameSite=Strict`
}

function getCookie(name) {
	let cookies = new Map(document.cookie.split('; ').map(e => e.split('=')))
	let cookie = cookies.get(name)
	return cookie ? decodeURIComponent(cookie) : null
}

function eraseCookie(name) {   
	setCookie(name, '', new Date(0))
}

let panel = document.createElement('panel-container')

const PanelApp = {
	data: () => ({
		dialogs: {
			connect: { show: false },
			alert: { show: false },
			reconnecting: { show: false },
		},
		address: '',
		port: 32155,
		currentServer: '',
		panels: [],
		currentPanel: null,
		connectionState: Recon.ConnectionState.Disconnected,
	}),

	computed: {
		connected() {
			return this.connectionState === Recon.ConnectionState.Connected
		},

		connecting() {
			return this.connectionState === Recon.ConnectionState.Connecting
		},
	},

	methods: {
		async submit(e) {
			let address = e.target.elements.address.value
			let port = e.target.elements.port.value

			setCookie('address', address)
			setCookie('port', port)

			await this.connect(address, port)
			this.dialogs.connect.show = false
		},

		async connect(address, port) {
			try {
				let promiseConnect = recon.connect(address, port)
				this.connectionState = recon.connectionState
				await promiseConnect
			} catch (err) {
				this.showAlertDialog("Connection error", [`Unable to connect to server ${address}:${port}.`, err.message])
				this.dialogs.alert.connectAfterClose = true
				return
			} finally {
				this.connectionState = recon.connectionState
			}
			await this.updatePanels()
			this.currentServer = recon.address
			
			let lastPanel = getCookie('lastPanel')
			if (lastPanel) {
				this.loadPanel(lastPanel)
			}
		},

		async updatePanels() {
			let panels = await recon.getPanels()
			this.panels = panels
		},

		async loadPanel(panelName) {
			// if (panelName !== currentPanel) {
				panel.removeViews()
			// }
			
			let panelData = null
			try {
				panelData = await recon.getPanel(panelName)
			} catch (err) {
				let message = []
				if (err instanceof SyntaxError) {
					message.push(`Error on line ${err.lineNumber} at column ${err.columnNumber}:`)
				}
				message.push(err.message)
				this.showAlertDialog(`Unable to load panel ${panelName}`, message)
				return
			}
			
			this.currentPanel = panelName
			setCookie('lastPanel', panelName)

			panel.build(panelData)

			// request devices
			let devices = await this.acquireDevices()
			let warnings = []
			for (let { value: device } of devices) {
				if (!device.isAcquired) {
					warnings.push(`Unable to acquire device ${device.id}`)
				} else {
					let requestedDevice = panel.usedDeviceResources[device.id]
					if (requestedDevice.buttons > device.numButtons) {
						warnings.push(`Device ${device.id} has ${device.numButtons} buttons but this panel uses ${requestedDevice.buttons}`)
					}
					if (requestedDevice.axes) {
						for (let axis of requestedDevice.axes) {
							if (!device.axes[axis]) {
								warnings.push(`Requested axis ${axis} not enabled on device ${device.id}`)
							}
						}
					}
				}
			}
			if (warnings.length > 0) {
				this.showAlertDialog("Device info", warnings)
			}
		},

		acquireDevices() {
			return Promise.allSettled(Object.keys(panel.usedDeviceResources).map(e => recon.acquireDevice(parseInt(e))))
		},

		closePanel() {
			this.currentPanel = null
			eraseCookie('lastPanel')
			panel.style.display = 'none'
		},
		
		reconnectingDialogClose() {
			this.dialogs.reconnecting.show = false
			this.dialogs.reconnecting.cancelled = true
			recon.disconnect()
		},

		showAlertDialog(title, message) {
			this.dialogs.alert.title = title
			this.dialogs.alert.message = message
			this.dialogs.alert.show = true
		},

		alertDialogClose(event) {
			this.dialogs.alert.show = false
			if (this.dialogs.alert.connectAfterClose) this.dialogs.connect.show = true
			this.dialogs.alert.connectAfterClose = false
		},

		async sendInput(input) {
			try {
				await recon.sendInput(input)
			} catch (err) {
				this.showAlertDialog("Input error", ["Error sending input.", err.message])
			}
		},

		onButtonChange(e) {
			let action = e.detail
			switch (action.type) {
				case 'macro':
					if (action.isPressed) return
					action.actions = action.action
					break
				case 'command':
					if (action.isPressed) return
					break
				case 'view':
					if (!action.isPressed) panel.setView(action.view)
					return
			}
			this.sendInput(action)
		},

		onSliderChange(e) {
			let action = e.detail
			this.sendInput({
				type: 'axis',
				device: action.device,
				axis: action.axis,
				value: e.currentTarget.value,
			})
		},
	},

	async created() {
		if (getCookie('address')) {
			this.address = getCookie('address')
			this.port = getCookie('port')
			
			this.connect(this.address, this.port)
		} else {
			this.showConnectDialog = true
		}

		window.getAssetPath = (file) => recon.getAssetPath(this.currentPanel, file)

		recon.addEventListener('reconnecting', e => {
			this.connectionState = recon.connectionState
			this.dialogs.reconnecting.show = true
			this.dialogs.reconnecting.cancelled = false
		})
		
		recon.addEventListener('reconnected', e => {
			this.connectionState = recon.connectionState
			this.dialogs.reconnecting.show = false
			this.acquireDevices()
		})
		
		recon.addEventListener('close', e => {
			this.connectionState = recon.connectionState
			this.closePanel()
			this.dialogs.reconnecting.show = false
			if (!this.dialogs.reconnecting.cancelled) {
				this.dialogs.reconnecting.cancelled = false
				this.showAlertDialog("Connection error", ["Server connection lost.", e.detail?.message])
				this.dialogs.alert.connectAfterClose = true
			}
		})
		
		document.getElementById('app').appendChild(panel)

		panel.addEventListener('button-change', this.onButtonChange)
		panel.addEventListener('slider-change', this.onSliderChange)

		window.addEventListener('keydown', e => {
			if (e.code === 'Escape' || e.code === 'Backspace') {
				this.closePanel()
			}
		})
	},

	components: {
		'modal-dialog': Dialog,
		'dialog-button': DialogButton,
	},
}

let app = createApp(PanelApp)

app.mount('#app')
