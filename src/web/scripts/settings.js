let settings = {}

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
	
	if (settings.address) {
		menuViewModel.connectDialog.address(settings.address)
		menuViewModel.connectDialog.port(settings.port)
		
		recon.con(settings.address, settings.port)
		
		menuViewModel.updatePanels()
		menuViewModel.loadLastPanel()
	} else {
		menuViewModel.connectDialog.show()
	}
}

if (isElectron()) {
	var settings2 = require('electron-settings')
	settings = settings2.getAll()
	
	document.addEventListener('DOMContentLoaded', () => {
		setup()
	})
}
