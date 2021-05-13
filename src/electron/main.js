const { app, BrowserWindow, protocol } = require('electron')
const path = require('path')
const url = require('url')

const WEB_FOLDER = 'web'
const PROTOCOL = 'file'

init()

async function init() {
	await app.whenReady()

	protocol.interceptFileProtocol(PROTOCOL, (request, callback) => {
		let { pathname } = url.parse(request.url)
		request.path = path.join(__dirname, WEB_FOLDER, pathname)
		callback(request)
	})

	createWindow()

	app.on('window-all-closed', () => {
		app.quit()
	})
}

function createWindow() {
	let win = new BrowserWindow({
		width: 1280,
		height: 720,
		show: false,
	})

	win.removeMenu()

	win.loadURL(url.format({
		protocol: PROTOCOL,
		pathname: 'index.html',
		slashes: true,
	}))

	win.once('ready-to-show', () => {
		win.show()
	})
}
