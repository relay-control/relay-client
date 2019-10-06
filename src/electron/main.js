const {app, BrowserWindow} = require('electron')
const path = require('path')

let win

app.on("ready", () => {
	win = new BrowserWindow({
		width: 1280,
		height: 720,
		show: false,
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
		},
	})
	
	win.loadFile('web/index.html')
	
	win.on("page-title-updated", (e) => {
		e.preventDefault()
	})
	
	win.once('ready-to-show', () => {
		win.show()
	})
	
	win.on("closed", () => {
		win = null
	})
})
