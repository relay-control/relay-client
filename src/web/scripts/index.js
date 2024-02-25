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

const ModalDialog = {
	template: '#modal-dialog',
}

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
			this.dialogs.connect.show = false
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
				this.loadPanel(lastPanel)
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
					message.push(`Failed to parse XML`)
				}
				message.push(err.message)
				this.showAlertDialog('Failed to load panel', message)
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
				this.showAlertDialog(`Failed to load panel`, errors)
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
				this.showAlertDialog(`Error unloading panel`, [err.message])
				console.error(err)
			}
			this.currentPanel = null
			localStorage.removeItem('lastPanel')
			panelContainer.classList.remove('shown')
		},

		reconnectingDialogClose() {
			this.dialogs.reconnecting.show = false
			this.dialogs.reconnecting.cancelled = true
			relay.disconnect()
		},

		showAlertDialog(title, message) {
			this.dialogs.alert.title = title
			this.dialogs.alert.message = message
			this.dialogs.alert.show = true
		},

		alertDialogClose(event) {
			this.dialogs.alert.show = false
			if (this.dialogs.alert.connectAfterClose) {
				this.dialogs.connect.show = true
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
						this.currentPanel.grid.setView(action.view)
					}
					return
			}
			this.sendInput(action)
		},

		onSliderChange(e) {
			this.sendInput(e.detail)
		},
	},

	async created() {
		if (localStorage.getItem('address')) {
			this.address = localStorage.getItem('address')
			this.port = localStorage.getItem('port')

			this.connect(this.address, this.port)
		} else {
			this.showConnectDialog = true
		}

		window.getAssetUrl = (fileName) => relay.getStaticUrl(`panels/${this.currentPanel.name}/assets/${fileName}`)
		window.closePanel = () => this.closePanel()

		relay.addEventListener('reconnecting', e => {
			this.connectionState = relay.connectionState
			this.dialogs.reconnecting.show = true
			this.dialogs.reconnecting.cancelled = false
		})

		relay.addEventListener('reconnected', e => {
			this.connectionState = relay.connectionState
			this.dialogs.reconnecting.show = false
			this.acquireDevices()
		})

		relay.addEventListener('close', e => {
			this.connectionState = relay.connectionState
			this.closePanel()
			this.dialogs.reconnecting.show = false
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

	components: {
		ModalDialog,
	},
}

let app = createApp(PanelApp)

app.mount('#app')
