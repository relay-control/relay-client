let ws = new socket()


var modal = {}

modal.show = function(text) {
	this.text.textContent = text
	this.button1.textContent = "OK"
	this.dialog.showModal()
}


document.addEventListener('DOMContentLoaded', () => {
	modal.dialog = document.body.appendChild(document.createElement('dialog'))
	modal.text = modal.dialog.appendChild(document.createElement('p'))
	modal.button1 = modal.dialog.appendChild(document.createElement('button'))
	modal.button1.addEventListener('click', () => modal.dialog.close())
	
	let connectDialog = document.getElementById('connectDialog')
	
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
	connectDialog.showModal()
	
	connectForm.elements.address.value = '192.168.0.202'
	connectForm.elements.port.value = '57882'
	// ws.connect(connectForm.elements.address.value, connectForm.elements.port.value)
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
		let panelList = document.getElementById('panel-list')
		panelList.innerHTML = ''
		for (let panel of panels) {
			let item = document.createElement('li')
			let button = document.createElement('li')
			item.textContent = panel
			item.addEventListener('click', e => loadPanel(panel))
			panelList.appendChild(item)
		}
	})
}

document.addEventListener("DOMContentLoaded", () => {
	let connect = document.getElementById('menu-connect')
	connect.addEventListener('click', e => {
		let connectDialog = document.getElementById("connectDialog")
		connectDialog.showModal()
	})
	
	let refresh = document.getElementById('menu-refresh')
	refresh.addEventListener('click', e => {
		updatePanels()
	})
})
