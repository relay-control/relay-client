import Recon from '/scripts/recon.js'
import { createApp } from '/scripts/vue.esm-browser.js'

let recon = new Recon()

window.getAssetPath = (file) => recon.getAssetPath(file)

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

const Modal = {
	data: () => ({
		show: false,
		title: '',
		message: [],
	}),
	template: `
		<div class="modal-mask" v-if="show">
			<div class="modal-content">
				<header> {{ title }} </header>
				<div class="content">
					<p v-for="line in message"> {{ line }} </p>
				</div>
				<div class="buttons">
					<button class="primary" @click="show = false">OK</button>
				</div>
			</div>
		</div>
	`,
}

const PanelApp = {
	data: () => ({
		showModal: false,
		address: '',
		port: 32155,
		currentServer: '',
		panels: [],
		currentPanel: null,
	}),

	methods: {
		async submit(e) {
			let address = e.target.elements.address.value
			let port = e.target.elements.port.value

			setCookie('address', address)
			setCookie('port', port)

			await recon.connect(address, port)
			await this.updatePanels()
			this.currentServer = recon.address
			this.showModal = false
			
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
				this.showModalDialog(`Unable to load panel ${panelName}`, message)
				return
			}
			
			this.currentPanel = panelName
			recon.currentPanel = panelName
			setCookie('lastPanel', panelName)

			panel.build(panelData)

			// request devices
			let devices = await Promise.allSettled(Object.keys(panel.usedDeviceResources).map(e => recon.acquireDevice(parseInt(e))))
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
				this.showModalDialog("Device info", warnings)
			}
		},

		closePanel() {
			this.currentPanel = null
			eraseCookie('lastPanel')
			panel.style.display = 'none'
		},
		
		connected() {
			return recon.connectionState === Recon.ConnectionState.Connected
		},

		connecting() {
			return recon.connectionState === Recon.ConnectionState.Connecting
		},

		showModalDialog(title, message) {
			let modal = this.$refs.modal
			modal.title = title
			modal.message = message
			modal.show = true
		},

		onButtonActivate(e) {
			let action = e.detail
			let input = { }
			switch (action.type) {
				case 'button':
					input.type = action.type
					input.deviceId = action.device
					input.button = action.button
					input.isPressed = true
					break
				case 'key':
					input.key = action.key
					input.isPressed = true
					break
				case 'macro':
					input.actions = action.action
					break
				default:
					input.command = action.command
					input.args = action.args
					break
			}
			recon.sendInput(input)
		},

		onButtonDeactivate(e) {
			let action = e.detail
			let input = { }
			switch (action.type) {
				case 'button':
					input.type = action.type
					input.deviceId = action.device
					input.button = action.button
					input.isPressed = true
					break
				case 'key':
					input.key = action.key
					input.isPressed = true
					break
				case 'macro':
					input.actions = action.action
					break
				case 'command':
					input.command = action.command
					input.args = action.args
					break
			}
			recon.sendInput(input)
			if (action.type === 'view') {
				panel.setView(action.view)
			}
		},

		onSliderChange(e) {
			let action = e.detail
			recon.sendInput({
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
			
			await recon.connect(this.address, this.port)
			await this.updatePanels()
			this.currentServer = recon.address
			
			let lastPanel = getCookie('lastPanel')
			if (lastPanel) {
				this.loadPanel(lastPanel)
			}
		} else {
			this.showModal = true
		}
		
		document.getElementById('app').appendChild(panel)

		panel.addEventListener('button-activate', this.onButtonActivate)
		panel.addEventListener('button-deactivate', this.onButtonDeactivate)
		panel.addEventListener('slider-change', this.onSliderChange)

		window.addEventListener('keydown', e => {
			if (e.code === 'Escape' || e.code === 'Backspace') {
				this.closePanel()
			}
		})
	},
}

let app = createApp(PanelApp)

app.component('modal', Modal)

app.mount('#app')
