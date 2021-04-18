function loadAudio(url) {
	return new Promise((resolve, reject) => {
		let audio = new Audio()
		audio.src = url
		audio.canplaythrough = () => resolve()
		audio.canplaythrough = console.log
		audio.canplay = console.log
		audio.load = console.log
	})
}

class Panel {
	id = 1
	views = []
	assets = []
	
	constructor() {
		this.element = document.getElementById('panel')
	}
	
	show() {
		Promise.allSettled(this.assets)
		 .then(() => {
			let menu = document.getElementById('menu')
			menu.style.display = 'none'
			
			this.element.style.display = 'block'
		 })
	}
	
	createView() {
		let view = new View(this)
		this.views.push(view)
		return view
	}
	
	setView(view) {
		// decrement to translate human index to 0 index
		view--
		for (let i = 0; i < this.views.length; i++) {
			if (i == view) {
				this.views[i].element.classList.add('active')
			} else {
				this.views[i].element.classList.remove('active')
			}
		}
	}
	
	loadImage(image) {
		this.assets.push(new Promise((resolve, reject) => {
			let img = new Image()
			img.src = image
			img.onload = () => resolve()
			img.onerror = () => reject()
		}))
	}
	
	loadFont(family, file) {
		let font = new FontFace(family, `url(${file})`)
		document.fonts.add(font)
		this.assets.push(font.load())
	}
	
	loadScript(file) {
		this.assets.push(new Promise((resolve, reject) => {
			let script = document.createElement('script')
			script.src = file
			script.onload = () => resolve()
			this.element.appendChild(script)
		}))
	}
	
	set rows(rows) {
		this.element.style.setProperty('--grid-rows', rows)
	}
	
	set columns(columns) {
		this.element.style.setProperty('--grid-columns', columns)
	}
	
	set background(background) {
		this.element.style.backgroundColor = background.color
		if (background.image) {
			this.element.style.backgroundImage = `url(${recon.getAssetPath(background.image)})`
			this.element.style.backgroundSize = 'cover'
			this.element.style.backgroundPosition = 'center'
		}
	}
}

class Stylesheet {
	static create() {
		Stylesheet.sheet = new CSSStyleSheet()
		document.adoptedStyleSheets = [Stylesheet.sheet]
		Stylesheet.rules = {}
	}
	
	static getRule(selector) {
		let rule = Stylesheet.rules[selector]
		if (!rule) {
			let index = Stylesheet.sheet.rules.length
			Stylesheet.sheet.insertRule(`${selector} {}`, index)
			rule = Stylesheet.sheet.rules[index].style
			Stylesheet.rules[selector] = rule
		}
		return rule
	}
}

function buildPanel(panel) {
	// create a separate stylesheet for dynamic style rules
	Stylesheet.create()
	
	let p = new Panel()
	p.element.style = null
	p.element.style.display = 'none'
	if (panel.background)
		p.background = panel.background
	p.rows = panel.grid.rows
	p.columns = panel.grid.columns
	
	/* validate grid size and control placement */
	
	if (panel.assets) {
		for (let [asset, type] of panel.assets) {
			let file = recon.getAssetPath(asset.file)
			switch (type) {
				case 'Image':
					p.loadImage(file)
					break
				case 'Font':
					p.loadFont(asset.family, file)
					break
				case 'Script':
					p.loadScript(file)
					break
			}
		}
	}
	
	if (panel.templates) {
		for (let [template, tag] of panel.templates) {
			// map each template to a CSS class
			let selector = template.name
			if (tag !== 'Control') selector += '.' + tag.toLowerCase()
			let style = new TemplateStyle(selector)
			style.apply(template)
			if (template.active) {
				style.applyActive(template.active)
			}
		}
	}
	
	let usedVJoyDevices = []
	let usedVJoyDeviceButtons = {}
	let usedVJoyDeviceAxes = {}
	
	for (let [view] of panel.views) {
		let v = p.createView(view)
		v.build()
	}
	
	// request devices
	recon.connect(usedVJoyDevices)
	 .then(devices => {
		p.setView(1)
		
		p.show()
		
		let warnings = []
		for (let device of devices) {
			if (!device.acquired) {
				warnings.push(`Unable to acquire device ${device.id}`)
			} else {
				if (usedVJoyDeviceButtons[device.id] > device.numButtons) {
					warnings.push(`Device ${device.id} has ${device.numButtons} buttons but this panel uses ${usedVJoyDeviceButtons[device.id]}`)
				}
				if (usedVJoyDeviceAxes[device.id]) {
					for (let axis of usedVJoyDeviceAxes[device.id]) {
						if (!device.axes[axis]) {
							warnings.push(`Requested axis ${axis} not enabled on device ${device.id}`)
						}
					}
				}
			}
		}
		if (warnings.length > 0) {
			menuViewModel.deviceInfoDialog.data(warnings)
			menuViewModel.deviceInfoDialog.show()
		}
	 })
	 .catch(err => {
		console.error(err)
		menuViewModel.modalDialog.show(`Connection refused`)
		menuViewModel.currentPanel(null)
	 })
}

function loadPanel(panelName) {
	// if (panelName !== currentPanel) {
		let panel = document.getElementById('panel')
		while (panel.lastChild)
			panel.lastChild.remove()
		// if (stylesheet) {
			// document.adoptedStyleSheets = []
		// }
		// rules = {}
	// }
	
	menuViewModel.currentPanel(panelName)
	recon.currentPanel = panelName
	saveSetting('lastPanel', panelName)
	
	recon.getPanel(panelName)
	 .then(panel => {
		// console.log(panel)
		buildPanel(panel)
	 })
	 .catch(err => {
		if (err instanceof FileNotFoundError) {
			menuViewModel.modalDialog.show(`Unable to load panel ${panelName}.`)
			menuViewModel.currentPanel(null)
		} else {
			console.error(err)
			menuViewModel.modalDialog.show(`Connection refused`)
			menuViewModel.currentPanel(null)
		}
	 })
}
