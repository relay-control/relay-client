let socket = new Socket()


function isAndroid() {
	return typeof Android !== 'undefined'
}

function isElectron() {
	return typeof process !== 'undefined' && process.versions && process.versions['electron']
}

function goBack() {
	let panel = document.getElementById('panel')
	let style = window.getComputedStyle(panel)
	if (style.display === 'grid') {
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

function MenuViewModel() {
    this.connected = ko.observable(false)
	this.currentServer = ko.observable()
	this.currentPanel = ko.observable()
    this.panels = ko.observableArray()
	this.connect = () => {
		this.connectDialog.show()
	}
	this.updatePanels = () => {
		fetch(`${socket.server}/api/panels`, {cache: 'no-store'})
		 .then(response => response.json())
		 .then(panels => {
			this.panels(panels)
		})
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
			socket.connect(form.elements.address.value, form.elements.port.value)
			this.connectDialog.connecting(true)
		},
		show: () => this.connectDialog.element.showModal(),
		close: () => this.connectDialog.element.close(),
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
})

var RelaySocket = {}

RelaySocket.sendInput = function(input) {
	socket.sendInput(JSON.stringify(input))
}
