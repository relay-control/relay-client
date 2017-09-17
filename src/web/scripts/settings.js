let settings

function saveSetting(setting, value) {
	if (isAndroid())
		Android.save(setting, value)
	if (isElectron())
		settings2.set(setting, value)
}

function loadSetting(setting) {
	return settings[setting]
}

function setup(storedSettings) {
	if (isAndroid())
		settings = storedSettings
	
	let connectForm = document.getElementById('connect-form')
	if (settings.address) {
		connectForm.elements.address.value = settings.address
		connectForm.elements.port.value = settings.port
		socket.connect(settings.address, settings.port)
	} else {
		let connectDialog = document.getElementById('connect-dialog')
		connectDialog.showModal()
	}
}

if (isElectron()) {
	var settings2 = require('electron-settings')
	settings = settings2.getAll()
	
	document.addEventListener('DOMContentLoaded', () => {
		setup()
	})
}
