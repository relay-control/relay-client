import Relay from 'relay'
import { createApp } from 'vue'
import parseXml from 'xml-parser'
import Panel, { AssetError } from 'panel'
import Grid from 'grid'
import View from 'view'
import BaseControl from 'controls/base'
import StateControl from 'controls/state'
import ButtonControl from 'controls/button'
import SliderControl from 'controls/slider'
import { TextLabel, IconLabel, ImageLabel } from 'label'

let relay = new Relay()

customElements.define('panel-grid', Grid)
customElements.define('panel-view', View)
customElements.define('simple-control', BaseControl)
customElements.define('state-control', StateControl)
customElements.define('button-control', ButtonControl)
customElements.define('slider-control', SliderControl)
customElements.define('text-label', TextLabel)
customElements.define('icon-label', IconLabel)
customElements.define('image-label', ImageLabel)

// create dynamically in order to avoid event listener issues with Vue
let panelContainer = document.createElement('div')
panelContainer.id = 'panel-container'

const PanelApp = {
	data: () => ({
		dialogs: {
			alert: {},
			reconnecting: {},
		},
		address: '',
		port: 32155,
		currentServer: '',
		panels: [],
		currentPanel: null,
		connectionState: Relay.ConnectionState.Disconnected,
	}),

	computed: {
		connected() {
			return this.connectionState === Relay.ConnectionState.Connected
		},

		connecting() {
			return this.connectionState === Relay.ConnectionState.Connecting
		},
	},

	methods: {
		async onSubmit() {
			localStorage.setItem('address', this.address)
			localStorage.setItem('port', this.port)

			await this.connect(this.address, this.port)
			this.closeConnectDialog()
		},

		async connect(address, port) {
			try {
				let promiseConnect = relay.connect(address, port)
				this.connectionState = relay.connectionState
				await promiseConnect
			} catch (err) {
				this.showAlertDialog("Connection error", [`Unable to connect to server ${address}:${port}.`, err.message])
				this.dialogs.alert.connectAfterClose = true
				return
			} finally {
				this.connectionState = relay.connectionState
			}
			await this.refreshPanelList()
			this.currentServer = relay.address

			let lastPanel = localStorage.getItem('lastPanel')
			if (lastPanel) {
				if (this.panels.includes(lastPanel)) {
					this.loadPanel(lastPanel)
				} else {
					localStorage.removeItem('lastPanel')
				}
			}
		},

		async refreshPanelList() {
			let panels = await relay.getPanels()
			this.panels = panels
		},

		async loadPanel(panelName) {
			let panel = null
			try {
				let panelUrl = relay.getStaticUrl(`panels/${panelName}/panel.xml`)
				let response = await fetch(panelUrl, {cache: 'no-cache'})
				if (!response.ok) {
					throw new Error(response.statusText)
				}
				let text = await response.text()
				let panelDocument = parseXml(text)
				panel = new Panel(panelName, panelDocument.panel)
			} catch (err) {
				let message = []
				if (err instanceof SyntaxError) {
					message.push("Failed to parse XML")
				}
				message.push(err.message)
				this.showAlertDialog("Failed to load panel", message)
				throw err
			}

			this.currentPanel = panel
			localStorage.setItem('lastPanel', panel.name)

			try {
				await panel.build()
			} catch (err) {
				let errors = []
				errors.push(err.message)
				if (err instanceof AssetError) {
					errors = errors.concat(err.errors)
				}
				this.showAlertDialog("Failed to load panel", errors)
				this.closePanel()
				throw err
			}

			panelContainer.classList.add('shown')

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
			return Promise.allSettled(Object.keys(this.currentPanel.usedDeviceResources).map(e => relay.acquireDevice(parseInt(e))))
		},

		closePanel() {
			try {
				this.currentPanel?.destroy()
			} catch (err) {
				this.showAlertDialog("Error unloading panel", [err.message])
				console.error(err)
			}
			this.currentPanel = null
			localStorage.removeItem('lastPanel')
			panelContainer.classList.remove('shown')
		},

		cancelReconnect() {
			this.closeReconnectingDialog()
			this.dialogs.reconnecting.cancelled = true
			relay.disconnect()
		},

		showConnectDialog() {
			this.$refs.connectDialog.showModal()
		},

		closeConnectDialog() {
			this.$refs.connectDialog.close()
		},

		showReconnectingDialog() {
			this.$refs.reconnectingDialog.showModal()
		},

		closeReconnectingDialog() {
			this.$refs.reconnectingDialog.close()
		},

		showAlertDialog(title, message) {
			this.dialogs.alert.title = title
			this.dialogs.alert.message = message
			this.$refs.alertDialog.showModal()
		},

		closeAlertDialog(event) {
			this.$refs.alertDialog.close()
			if (this.dialogs.alert.connectAfterClose) {
				this.showConnectDialog()
			}
			this.dialogs.alert.connectAfterClose = false
		},

		async sendInput(input) {
			let res = await relay.sendInput(input)
			if (!res.ok) {
				this.showAlertDialog("Input error", ["Error sending input.", res.message])
			}
		},

		onButtonChange(e) {
			let action = e.detail
			switch (action.type) {
				case Relay.InputType.macro:
				case Relay.InputType.command:
					if (action.isPressed) {
						return
					}
					break
				case Relay.InputType.view:
					if (!action.isPressed) {
						try {
							this.currentPanel.grid.setView(action.view)
						} catch (e) {
							this.showAlertDialog('Failed to switch view', [e.message])
						}
					}
					return
			}
			this.sendInput(action)
		},

		onSliderChange(e) {
			this.sendInput(e.detail)
		},
	},

	async mounted() {
		if (localStorage.getItem('address')) {
			this.address = localStorage.getItem('address')
			this.port = localStorage.getItem('port')

			this.connect(this.address, this.port)
		} else {
			this.showConnectDialog()
		}

		window.getAssetUrl = (fileName) => relay.getStaticUrl(`panels/${this.currentPanel.name}/assets/${fileName}`)
		window.closePanel = () => this.closePanel()

		relay.addEventListener('reconnecting', e => {
			this.connectionState = relay.connectionState
			this.showReconnectingDialog()
			this.dialogs.reconnecting.cancelled = false
		})

		relay.addEventListener('reconnected', e => {
			this.connectionState = relay.connectionState
			this.closeReconnectingDialog()
			this.acquireDevices()
		})

		relay.addEventListener('close', e => {
			this.connectionState = relay.connectionState
			this.closePanel()
			this.closeReconnectingDialog()
			if (!this.dialogs.reconnecting.cancelled) {
				this.dialogs.reconnecting.cancelled = false
				this.showAlertDialog("Connection error", ["Server connection lost.", e.detail?.message])
				this.dialogs.alert.connectAfterClose = true
			}
		})

		document.getElementById('app').appendChild(panelContainer)

		panelContainer.addEventListener('button-change', this.onButtonChange)
		panelContainer.addEventListener('slider-change', this.onSliderChange)

		window.addEventListener('keydown', e => {
			if (this.currentPanel && (e.code === 'Escape' || e.code === 'Backspace')) {
				this.closePanel()
			}
		})
	},
}

let app = createApp(PanelApp)

app.mount('#app')
