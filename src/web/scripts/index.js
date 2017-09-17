let socket = new Socket()


var modal = {}

modal.show = function(text, returnValue) {
	this.text.textContent = text
	this.button1.textContent = "OK"
	this.dialog.connectionStatus = returnValue
	this.dialog.showModal()
}

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


function MenuViewModel() {
    this.connected = ko.observable(true)
	this.currentPanel = ko.observable()
    this.panels = ko.observableArray()
	this.connect = function() {
		let connectDialog = document.getElementById("connect-dialog")
		connectDialog.showModal()
	}
	this.refresh = function() {
		updatePanels()
	}
}

var menuViewModel = new MenuViewModel()

document.addEventListener('DOMContentLoaded', () => {
	ko.applyBindings(menuViewModel, document.getElementById('menu'))
	
	document.addEventListener('keydown', e => {
		if (e.code === 'Escape' || e.code === 'Backspace') {
			goBack()
		}
	})
	
	modal.dialog = document.body.appendChild(document.createElement('dialog'))
	modal.text = modal.dialog.appendChild(document.createElement('header'))
	modal.buttons = modal.dialog.appendChild(document.createElement('div'))
	modal.buttons.classList.add('buttons')
	modal.button1 = modal.buttons.appendChild(document.createElement('button'))
	modal.button1.addEventListener('click', () => modal.dialog.close())
	
	let connectDialog = document.getElementById('connect-dialog')
	
	let connectForm = document.getElementById('connect-form')
	connectForm.addEventListener('submit', e => {
		e.preventDefault()
		saveSetting('address', e.target.elements.address.value)
		saveSetting('port', e.target.elements.port.value)
		socket.connect(e.target.elements.address.value, e.target.elements.port.value)
		document.getElementById('loading').style.visibility = 'visible'
	})
	let cancel = document.getElementById('connect-cancel')
	cancel.addEventListener('click', e => {
		connectDialog.close()
	})
	connectForm.elements.port.value = '32155'
	
	modal.dialog.addEventListener('close', e => {
		if (e.target.connectionStatus === WebSocket.CONNECTING)
			connectDialog.showModal()
		delete e.target.connectionStatus
	})
})

var RelaySocket = {}

RelaySocket.sendInput = function(input) {
	socket.sendInput(JSON.stringify(input))
}

function getPanels() {
	return fetch(`${socket.server}/api/getpanels`, {cache: 'no-store'})
	 .then(response => response.json())
}

function updatePanels() {
	getPanels().then(panels => {
		menuViewModel.panels(panels)
	})
	if (!settings.rememberPanel && settings.lastPanel) {
		loadPanel(settings.lastPanel)
	}
}
