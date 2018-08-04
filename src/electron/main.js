const {app, BrowserWindow} = require('electron')
const url = require('url')
const path = require('path')

let win

app.on("ready", () => {
	win = new BrowserWindow({
		width: 1280,
		height: 720,
		show: false,
		webPreferences: {
			nodeIntegration: false,
			preload: path.join(__dirname, 'preload.js'),
		},
	})
	
	win.loadURL(url.format({
		protocol: 'file:',
		pathname: path.join(__dirname, 'web/index.html'),
	}))
	
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
