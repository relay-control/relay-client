let recon


function isAndroid() {
	return typeof Android !== 'undefined'
}

function isElectron() {
	return typeof Electron !== 'undefined'
}

function goBack() {
	recon.ws.close()
	closePanel()
}

function closePanel() {
	let panel = document.getElementById('panel')
	let style = window.getComputedStyle(panel)
	if (style.display === 'block') {
		panel.style.display = 'none'
		menuViewModel.currentPanel(null)
		let menu = document.getElementById('menu')
		menu.style.display = 'flex'
	}
}


ko.bindingHandlers.modal = {
	init: (element, valueAccessor, allBindings, viewModel, bindingContext) => {
		allBindings.get('with').element = element
		bindingContext.$data.modals.push(allBindings.get('with'))
	}
}

// recon.on('open', () => console.log('open'))

function connect(address, port) {
	try {
		recon = new Recon(address, port)
	} catch (err) {
		menuViewModel.modalDialog.show("Invalid URL")
		return
	}
	
	recon.getPanels()
	 .then(panels => {
		menuViewModel.panels(panels)
		menuViewModel.connected(true)
		menuViewModel.currentServer(recon.address)
		menuViewModel.connectDialog.connecting(false)
		if (menuViewModel.connectDialog.isOpen())
			menuViewModel.connectDialog.close()
		
		menuViewModel.loadLastPanel()
	})
	 .catch(err => {
		switch (err.constructor) {
			case FileNotFoundError:
				if (menuViewModel.connectDialog.isOpen())
					menuViewModel.connectDialog.close()
				menuViewModel.connectDialog.connecting(false)
				menuViewModel.modalDialog.show("Failed to retrieve panel list")
				break
			case TypeError:
				if (menuViewModel.connectDialog.isOpen())
					menuViewModel.connectDialog.close()
				menuViewModel.connectDialog.connecting(false)
				menuViewModel.modalDialog.show("Unable to connect to Recon server")
				break
			default:
				throw err
		}
	 })

	recon.on('close', (e, previousState) => {
		// menuViewModel.connected(false)
		// menuViewModel.currentServer(null)
		// closing existing websocket before opening new
		if (e.code === 4001) {
			this.connect2(this.address, this.port)
			return
		}
		if (previousState === WebSocket.CONNECTING) {
			// if (menuViewModel.connectDialog.isOpen())
				// menuViewModel.connectDialog.close()
			menuViewModel.connectDialog.connecting(false)
			// menuViewModel.modalDialog.show("Unable to connect to Recon server", previousState)
		}
		if (previousState === WebSocket.OPEN) {
			// try to reconnect?
			closePanel()
			menuViewModel.modalDialog.show("Disconnected from Recon server")
		}
	})
}

function MenuViewModel() {
    this.connected = ko.observable(false)
	this.currentServer = ko.observable()
	this.currentPanel = ko.observable()
	this.panels = ko.observableArray()
	this.connect = () => {
		this.connectDialog.show()
	}
	this.updatePanels = async () => {
		try {
			let panels = await recon.getPanels()
			this.panels(panels)
		} catch (err) {
			switch (err.constructor) {
				case FileNotFoundError:
					console.log("not found")
					break
				case TypeError:
					if (menuViewModel.connectDialog.isOpen())
						menuViewModel.connectDialog.close()
					menuViewModel.connectDialog.connecting(false)
					menuViewModel.modalDialog.show("Unable to connect to Recon server")
					break
				default:
					throw err
			}
		}
	}
	this.loadLastPanel = function() {
		if (!settings.rememberPanel && settings.lastPanel) {
			loadPanel(settings.lastPanel)
		}
	}
	
	this.modals = []
	
	this.isModalShown = () => {
		return this.modals.some(e => e.isOpen())
	}
	
	this.connectDialog = {
		address: ko.observable(),
		port: ko.observable('32155'),
		connecting: ko.observable(false),
		submit: (form) => {
			saveSetting('address', form.elements.address.value)
			saveSetting('port', form.elements.port.value)
			this.connectDialog.connecting(true)
			connect(form.elements.address.value, form.elements.port.value)
		},
		show: () => this.connectDialog.element.showModal(),
		close: () => {
			// if (this.connectDialog.connecting())
				// recon.abort()
			this.connectDialog.element.close()
		},
		isOpen: () => this.connectDialog.element.open,
	}
	
	this.deviceInfoDialog = {
		data: ko.observableArray(),
		show: () => this.deviceInfoDialog.element.showModal(),
		close: () => this.deviceInfoDialog.element.close(),
		isOpen: () => this.deviceInfoDialog.element.open,
	}
	
	this.modalDialog = {
		show: (text, returnValue) => {
			this.modalDialog.text(text)
			// this.button1.textContent = "OK"
			this.modalDialog.connectionStatus = returnValue
			this.modalDialog.element.showModal()
		},
		text: ko.observable(),
		close: () => this.modalDialog.element.close(),
		isOpen: () => this.modalDialog.element.open,
		onClose: (a, b) => {
			if (this.modalDialog.connectionStatus === WebSocket.CONNECTING)
				this.connectDialog.show()
			delete this.modalDialog.connectionStatus
		},
	}
}

var menuViewModel = new MenuViewModel()

document.addEventListener('DOMContentLoaded', () => {
	ko.applyBindings(menuViewModel)
	
	document.addEventListener('keydown', e => {
		if (menuViewModel.isModalShown())
			return
		if (e.code === 'Escape' || e.code === 'Backspace') {
			goBack()
		}
	})
	
	if (isElectron()) {
		// var settings2 = require('electron-settings')
		settings = settings2.getAll()
		
		// document.addEventListener('DOMContentLoaded', () => {
			// setup()
		// })
	}
	
	if (settings.address) {
		menuViewModel.connectDialog.address(settings.address)
		menuViewModel.connectDialog.port(settings.port)
		
		connect(settings.address, settings.port)
	} else {
		menuViewModel.connectDialog.show()
	}
})
