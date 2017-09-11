let ws = new socket()


var modal = {}

modal.show = function(text) {
	this.text.textContent = text
	this.button1.textContent = "OK"
	this.dialog.showModal()
}

let settings = {
	address: '192.168.0.202',
	port: '57882',
	rememberPanel: true,
	panel: 'Elite',
}

function isElectron() {
	return process && process.versions && process.versions['electron']
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
		if (e.code === 'Escape') {
			let panel = document.getElementById('panel')
			let style = window.getComputedStyle(panel)
			if (style.display === 'grid') {
				panel.style.visibility = 'hidden'
				menuViewModel.currentPanel(null)
				// let menu = document.getElementById('menu')
				// menu.style.display = 'flex'
			}
		}
	})
	
	modal.dialog = document.body.appendChild(document.createElement('dialog'))
	modal.text = modal.dialog.appendChild(document.createElement('p'))
	modal.button1 = modal.dialog.appendChild(document.createElement('button'))
	modal.button1.addEventListener('click', () => modal.dialog.close())
	
	let connectDialog = document.getElementById('connect-dialog')
	
	let connectForm = document.getElementById('connect-form')
	connectForm.addEventListener('submit', e => {
		e.preventDefault()
		ws.connect(e.target.elements.address.value, e.target.elements.port.value)
		document.getElementById('loading').style.visibility = 'visible'
	})
	let cancel = document.getElementById('connect-cancel')
	cancel.addEventListener('click', e => {
		connectDialog.close()
	})
	
	if (settings.address) {
		connectForm.elements.address.value = settings.address
		connectForm.elements.port.value = settings.port
		ws.connect(settings.address, settings.port)
	} else {
		connectDialog.showModal()
	}
})

var RelaySocket = {}

RelaySocket.sendInput = function(input) {
	ws.sendInput(JSON.stringify(input))
}

function getPanels() {
	return fetch(`${ws.server}/web.json`, {cache: 'no-store'})
	 .then(response => response.json())
}

function updatePanels() {
	getPanels().then(panels => {
		menuViewModel.panels(panels)
	})
	if (settings.rememberPanel && settings.panel) {
		loadPanel(settings.panel)
	}
}
