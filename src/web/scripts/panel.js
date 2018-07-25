const collections = [
	"Assets",
	"Templates",
	"Views",
	"View",
	"Gradient",
	"Shadows",
	"TextShadow",
]

function firstCharLowerCase(str) {
	return str.charAt(0).toLowerCase() + str.slice(1)
}

  // stripPrefix = function(str) {
    // return str.replace(prefixMatch, '')
  // }

  // parseBooleans = function(str) {
    // if (/^(?:true|false)$/i.test(str)) {
      // str = str.toLowerCase() === 'true'
    // }
    // return str
// }

function parseNumber(str) {
	if (!isNaN(str)) {
		str = str % 1 === 0 ? parseInt(str, 10) : parseFloat(str)
	}
	return str
}

function parse(xml) {
	let data = collections.includes(xml.nodeName) ? [] : {}

	let isText = xml.nodeType === 3,
		isElement = xml.nodeType === 1,
		body = xml.textContent && xml.textContent.trim(),
		hasChildren = xml.children && xml.children.length,
		hasAttributes = xml.attributes && xml.attributes.length

	// if it's text just return it
	if (isText) { return xml.nodeValue.trim() }

	// if it doesn't have any children or attributes, just return the contents
	if (!hasChildren && !hasAttributes) { return { } }

	// if it doesn't have children but _does_ have body content, we'll use that
	if (!hasChildren && body.length) { data.text = body }

	// if it's an element with attributes, add them to data.attributes
	if (isElement && hasAttributes) {
		for (attribute of xml.attributes) {
			data[attribute.name.replace(/-(\w)/, (m, s) => s.toUpperCase())] = parseNumber(attribute.value)
		}
	}

	// recursively call #parse over children, adding results to data
	for (child of xml.children) {
		let nodeName = child.nodeName
		if (collections.includes(xml.nodeName)) {
			// certain predetermined tags gets their children populated in an array
			data.push([parse(child), nodeName])
		} else {
			// the rest gets added as properties
			data[firstCharLowerCase(nodeName)] = parse(child)
		}
	}
	
	return data
}

let stylesheet

let rules = {}

function getStyleRule(selector) {
	let rule = rules[selector]
	if (!rule) {
		let index = stylesheet.rules.length
		stylesheet.insertRule(`${selector} {}`, index)
		rule = stylesheet.rules[index].style
		rules[selector] = rule
	}
	return rule
}


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
	constructor() {
		this.element = document.getElementById('panel')
		this.id = 1
		this.views = []
		this.assets = []
	}
	
	show() {
		Promise.all(this.assets)
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

class View {
	constructor(panel) {
		this.element = document.createElement('div')
		this.element.classList.add('view')
		panel.element.appendChild(this.element)
		this.parent = panel
	}
	
	// show() {
		// Promise.all(this.assets)
		 // .then(() => {
			// let menu = document.getElementById('menu')
			// menu.style.display = 'none'
			
			// this.element.style.display = 'grid'
		 // })
	// }
	
	addControl(control) {
		this.element.appendChild(control.area)
	}
	
	createControl(type, data) {
		switch (type) {
			case 'Button':
				var control = new Button(this)
				control.mode = data.mode
				break
			case 'Slider':
				var control = new Slider(this)
				break
		}
		return control
	}
	
	getNextID() {
		return 'control' + this.parent.id++
	}
}

let styleLink

function buildPanel(panel) {
	// create a separate stylesheet for dynamic style rules
	let link = document.createElement('style')
	document.head.appendChild(link)
	stylesheet = link.sheet
	styleLink = link
	
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
		let v = p.createView()
		for (let [control, tag] of view) {
			let c = v.createControl(tag, control)
			
			if (control.row)
				c.setRow(control.row)
			if (control.column)
				c.setColumn(control.column)
			c.setRowSpan(control.rowSpan)
			c.setColumnSpan(control.columnSpan)
			
			c.addClass(tag.toLowerCase())
			
			if ('inherits' in control)
				c.addClass(control.inherits)
			else
				c.addClass('default')
			
			if (control.square) c.addClass('square')
			if (control.circle) c.addClass('circle')
			if (control.square || control.circle) {
				c.addClass('adjust-' + (control.adjustSize || 'height'))
			}
			
			c.apply(control)
			if (control.active) {
				c.applyActive(control.active)
			}
			
			let textLabel2 = control.textLabel
			if (textLabel2) {
				let textLabel = c.createTextLabel()
				textLabel.setText(textLabel2.text)
				// textLabel.setPosition(textLabel2.position)
				// textLabel.setAnchor(textLabel2.anchor)
			}
			
			let iconLabel2 = control.iconLabel
			if (iconLabel2) {
				let iconLabel = c.createIconLabel()
				iconLabel.setIcon(iconLabel2.icon)
				// iconLabel.setPosition(iconLabel2.position)
				// iconLabel.setAnchor(iconLabel2.anchor)
			}
			
			let imageLabel2 = control.imageLabel
			if (imageLabel2) {
				let imageLabel = c.createImageLabel()
				imageLabel.setImage(imageLabel2.image)
				// iconLabel.setPosition(iconLabel2.position)
				// imageLabel.setAnchor(imageLabel2.anchor)
			}
			
			if (control.action) {
				if (control.action.device && !usedVJoyDevices.includes(control.action.device)) {
					usedVJoyDevices.push(control.action.device)
					usedVJoyDeviceButtons[control.action.device] = 0
					usedVJoyDeviceAxes[control.action.device] = []
				}
				if (control.action.type === 'button') {
					usedVJoyDeviceButtons[control.action.device] = Math.max(control.action.button, usedVJoyDeviceButtons[control.action.device])
				}
				if (control.action.type === 'axis' && !usedVJoyDeviceAxes[control.action.device].includes(control.action.axis)) {
					usedVJoyDeviceAxes[control.action.device].push(control.action.axis)
				}
				c.action = control.action
			}
			
			if (tag === 'Slider') {
				// c.setSnapValue(control.snap)
				c.setSnapValue(50)
				
				if (control.valueLabel) {
					let valueLabel = new ValueLabel(c)
					// valueLabel.setPosition(control.valueLabel.position)
					// valueLabel.setAnchor('container')
					valueLabel.setText("50%")
					c.valueLabel = valueLabel
				}
				
				if (panel.templates) {
					for (let [template, tag] of panel.templates) {
						// map each template to a CSS class
						let selector = template.name
						template.tag = tag
						if (tag !== 'Control') selector += '.' + tag.toLowerCase()
						let style = new TemplateStyle2(selector, c)
						style.apply(template)
					}
				}
				
				// c.apply(control)
			}
		}
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
		menuViewModel.modalDialog.show(`Connection refused`)
		menuViewModel.currentPanel(null)
	 })
}

function loadPanel(panelName) {
	// if (panelName !== currentPanel) {
		let panel = document.getElementById('panel')
		while (panel.lastChild)
			panel.lastChild.remove()
		if (stylesheet) {
			// while (stylesheet.cssRules.length > 0)
				// stylesheet.deleteRule(stylesheet.cssRules.length - 1)
			styleLink.remove()
		}
		rules = {}
	// }
	
	menuViewModel.currentPanel(panelName)
	recon.currentPanel = panelName
	saveSetting('lastPanel', panelName)
	
	recon.getPanel(panelName)
	 .then(response => {
		if (response.firstChild.nodeName === 'html') {
			menuViewModel.modalDialog.show("Unable to parse panel XML")
			menuViewModel.currentPanel(null)
			return
		}
		
		let {panel} = parse(response)
		
		// console.log(panel)
		buildPanel(panel)
	 })
	 .catch(err => {
		if (err instanceof FileNotFoundError) {
			menuViewModel.modalDialog.show(`Unable to load panel ${panelName}.`)
			menuViewModel.currentPanel(null)
		} else {
			console.log("connection refused")
		}
	 })
}
