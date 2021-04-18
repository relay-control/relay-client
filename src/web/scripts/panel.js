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

	build(panelData) {
		// create a separate stylesheet for dynamic style rules
		Stylesheet.create()
		
		this.element.style = null
		this.element.style.display = 'none'
		if (panel.background)
			this.background = panel.background
		this.rows = panel.grid.rows
		this.columns = panel.grid.columns
		
		/* validate grid size and control placement */
		
		if (panel.assets) {
			for (let [asset, type] of panel.assets) {
				switch (type) {
					case 'Image':
						this.loadImage(asset.file)
						break
					case 'Font':
						this.loadFont(asset.family, asset.file)
						break
					case 'Script':
						this.loadScript(asset.file)
						break
				}
			}
		}
		
		// map each template to a CSS class
		if (panel.templates) {
			for (let [template, tag] of panel.templates) {
				let selector = template.name
				if (tag !== 'Control') selector += '.' + tag.toLowerCase()
				let style = new TemplateStyle(selector)
				style.apply('.' + template)
				if (template.active) {
					style.applyActive(template.active)
				}
			}
		}
		
		for (let [viewProperties] of panel.views) {
			let view = this.createView()
			view.templates = this.templates
			view.build(viewProperties)
			this.usedDeviceResources = view.usedDevices
		}
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
		let view = document.createElement('panel-view')
		this.element.appendChild(view)
		this.views.push(view)
		return view
	}
	
	setView(view) {
		// decrement to translate human index to 0 index
		view--
		for (let i = 0; i < this.views.length; i++) {
			let isViewActive = (i == view)
			this.views[i].element.classList.toggle('active', isViewActive)
		}
	}

	loadImage(file) {
		let url = recon.getAssetPath(file)
		this.assets.push(new Promise((resolve, reject) => {
			let img = new Image()
			img.src = url
			img.onload = () => resolve()
			img.onerror = () => reject()
		}))
	}
	
	loadFont(family, file) {
		let url = recon.getAssetPath(file)
		let font = new FontFace(family, `url(${url})`)
		document.fonts.add(font)
		this.assets.push(font.load())
	}
	
	loadScript(file) {
		let url = recon.getAssetPath(file)
		this.assets.push(new Promise((resolve, reject) => {
			let script = document.createElement('script')
			script.src = url
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
