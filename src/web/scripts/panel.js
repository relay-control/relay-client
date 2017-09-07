const collections = [
	"Assets",
	"Templates",
	"Controls",
	"Gradient",
	"Shadows",
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
	if (!hasChildren && !hasAttributes) { return body }

	// if it doesn't have children but _does_ have body content, we'll use that
	if (!hasChildren && body.length) { data.text = body }

	// if it's an element with attributes, add them to data.attributes
	if (isElement && hasAttributes) {
		for (attribute of xml.attributes) {
			data[attribute.name] = parseNumber(attribute.value)
		}
	}

	// recursively call #parse over children, adding results to data
	for (child of xml.children) {
		if (collections.includes(xml.nodeName)) {
			// certain predetermined tags gets their children populated in an array
			data.push([child.nodeName, parse(child)])
		} else {
			// the rest gets added as properties
			data[firstCharLowerCase(child.nodeName)] = parse(child)
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


let currentPanel

function getAssetPath(file) {
	return `${ws.server}/${currentPanel}/${file}`
}

function loadImage(url) {
	return new Promise((resolve, reject) => {
		let img = new Image()
		img.src = url
		img.onload = () => resolve()
	})
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

async function loadFont(url) {
	let font = new FontFace('Euro Caps', `url(${url})`)
	document.fonts.add(font)
	await font.load()
}

function redraw() {
	// force a redraw of square elements since they get borked if dialog was shown prior to loading a panel
	let squares = document.querySelectorAll('.cell.square img, .cell.circle img')
	for (let square of squares) {
		// square.style.display = 'none'
		// setTimeout(() => {square.style.display = 'inline-block'}, 0)
		
		square.style.height = 'auto'
		setTimeout(() => {square.style.height = '100%'}, 0)
	}
}

class Panel {
	constructor() {
		this.element = document.getElementById('panel')
		this.id = 1
		this.assets = []
	}
	
	show() {
		Promise.all(this.assets)
		 .then(() => {
			this.element.style.display = 'grid'
			redraw()
		 })
	}
	
	loadImage(image) {
		this.assets.push(loadImage(getAssetPath(image)))
	}
	
	loadFont(file) {
		this.assets.push(loadFont(getAssetPath(file)))
	}
	
	addControl(control) {
		this.element.appendChild(control.area)
	}
	
	getNextID() {
		return 'control' + this.id++
	}
}

let domparser = new DOMParser()

function loadPanel(panelName) {
	menuViewModel.currentPanel(panelName)
	currentPanel = panelName
	
	let xhr = new XMLHttpRequest()
	xhr.open("GET", `${ws.server}/${panelName}.xml`)
	xhr.responseType = 'document'
	xhr.send()
	xhr.onload = function() {
		console.dir(this.response)
		
		// let {panel} = parse(domparser.parseFromString(this.responseText, "text/xml"))
		let {panel} = parse(this.response)
		
		// create a separate stylesheet for dynamic style rules
		let link = document.createElement('style')
		document.head.appendChild(link)
		stylesheet = link.sheet
		
		let p = new Panel()
		let panelElement = p.element
		if (panel.background) {
			panelElement.style.backgroundColor = panel.background.color
			if (panel.background.image) {
				panelElement.style.backgroundImage = `url(${getAssetPath(panel.background.image)})`
				panelElement.style.backgroundSize = 'cover'
				panelElement.style.backgroundPosition = 'center'
			}
		}
		panelElement.style.gridTemplateColumns = `repeat(${panel.grid.columns}, 1fr)`
		panelElement.style.gridTemplateRows = `repeat(${panel.grid.rows}, 1fr)`
		
		/* validate grid size and control placement */
		
		if (panel.assets) {
			for (let [type, asset] of panel.assets) {
				switch (type) {
					case 'Image':
						p.loadImage(asset.file)
						break
					case 'Font':
						p.loadFont(asset.file)
						break
				}
			}
		}
		
		if (panel.templates) {
			for (let [tag, template] of panel.templates) {
				// map each template to a CSS class
				let selector = template.name
				if (tag !== 'Control') selector += '.' + tag.toLowerCase()
				if (template.padding) {
					let style = getStyleRule(selector)
					style.padding = `${template.padding.y} ${template.padding.x}`
				}
				let style = new TemplateStyle(selector)
				style.apply(template)
				if (template.label) {
					style.applyLabel(template.label)
				}
				if (template.active) {
					style.applyActive(template.active)
					if (template.active.label) {
						style.applyActiveLabel(template.active.label)
					}
				}
			}
		}
		
		let devices = []
		
		for (let [tag, control] of panel.controls) {
			control.tag = tag // temporarily for substyles
			let controlType = ControlTypes[tag]
			switch (tag) {
				case 'Button':
					var c = new Button(p)
					c.control.dataset.mode = control.mode
					break
				case 'Slider':
					var c = new Slider(p)
					break
			}
			
			let {area, container, control: element} = c
			
			element.classList.add('control')
			
			c.setColumn(control.position.x)
			c.setRow(control.position.y)
			c.setColumnSpan(control.width || 1)
			c.setRowSpan(control.height || 1)
			
			c.addClass(tag.toLowerCase())
			
			container.appendChild(element)
			
			if ('inherits' in control)
				c.addClass(control.inherits)
			else
				c.addClass('default')
			
			if (control.square) c.addClass('square')
			if (control.circle) c.addClass('circle')
			if (control.square || control.circle) {
				c.addClass('adjust-' + (control.adjustSize || 'height'))
				let img = container.appendChild(document.createElement('img'))
				// img.src = "square.png"
				img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs="
			}
			
			let style = new ControlStyle(c)
			style.apply(control)
			if (control.label) {
				style.applyLabel(control.label)
			}
			if (control.active) {
				style.applyActive(control.active)
				if (control.active.label) {
					style.applyActiveLabel(control.active.label)
				}
			}
			
			if (control.heightw) {
				let style = getStyleRule(`#${area.id} .container`)
				style.height = control.heightw
			}
			
			let label = control.label
			if (label) {
				if (label.text) {
					let textLabel = new TextLabel(c)
					textLabel.setText(label.text)
					textLabel.setPosition(label['text-position'] || label.position)
					textLabel.setAnchor(label['text-anchor'] || label.anchor)
				}
				if (label.icon) {
					let iconLabel = new IconLabel(c)
					iconLabel.setIcon(label.icon)
					iconLabel.setPosition(label['icon-position'] || label.position)
					iconLabel.setAnchor(label['icon-anchor'] || label.anchor)
				}
			}
			
			if (control.action) {
				if (!devices.includes(control.action.device)) devices.push(control.action.device)
				element.action = control.action
			}
			
			if (tag === 'Slider') {
				// c.setSnapValue(control.snap)
				c.setSnapValue(50)
				
				if (control.value) {
					let valueLabel = new ValueLabel(c)
					valueLabel.setPosition(control.value.position)
					valueLabel.setAnchor('container')
					valueLabel.setText("50%")
					element.valueLabel = valueLabel
				}
			}
			
			if (controlType.events) {
				for (let [event, callback] of Object.entries(controlType.events)) {
					element.addEventListener(event, callback)
				}
			}
			
			// PNG - data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=
			// GIF - data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==
			// GIF - data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=
			
			// redraw??
			// sel.style.display = 'run-in'; setTimeout(function () { sel.style.display = 'block'; }, 0);
		}
		
		let menu = document.getElementById('menu')
		menu.style.display = 'none'
		
		p.show()
		
		// request devices
	}
}
