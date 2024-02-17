import { ControlStyleTemplate, SliderStyle } from 'styles'
import Stylesheet from 'stylesheet'

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

class AssetError extends Error {
	constructor(message, errors) {
		super(message)
		this.name = this.constructor.name
		this.errors = errors
	}
}

class Panel extends HTMLElement {
	views = []
	assets = []

	async build(panelData) {
		// create a separate stylesheet for dynamic style rules
		Stylesheet.create()

		this.style = null
		this.style.display = 'none'
		if (panelData.background)
			this.background = panelData.background
		this.rows = panelData.grid.rows
		this.columns = panelData.grid.columns

		/* validate grid size and control placement */

		if (panelData.assets) {
			for (let [asset, type] of panelData.assets) {
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
		if (panelData.templates) {
			for (let [template, tag] of panelData.templates) {
				let selector = template.name ? '.' + template.name : ''
				selector = ((tag !== 'Control') ? tag.toLowerCase() + '-control' : '.cell') + selector
				let style = null
				switch (tag) {
					case 'Slider':
						style = new SliderStyle(selector)
						break
					default:
						style = new ControlStyleTemplate(selector)
				}
				style.setStyle(template)
				if (template.active) {
					style.setActiveStyle(template.active)
				}
			}
		}

		this.usedDeviceResources = { }

		for (let [viewProperties] of panelData.views) {
			let view = this.createView()
			view.templates = panelData.templates
			view.build(viewProperties)
			for (let deviceId in view.usedDevices) {
				let device = view.usedDevices[deviceId]
				if (deviceId in this.usedDeviceResources) {
					let panelDevice = this.usedDeviceResources[deviceId]
					device.buttons = Math.max(panelDevice.buttons, device.buttons)
					device.axes = [...(new Set([...panelDevice.axes, ...device.axes]))]
				}
				this.usedDeviceResources[deviceId] = device
			}
		}

		this.setView(1)

		await this.show()
	}

	async show() {
		let assets = await Promise.allSettled(this.assets)

		let assetErrors = assets
			.filter(e => e.status === 'rejected')
			.map(e => e.reason.message)

		if (assetErrors.length > 0) {
			throw new AssetError('Errors occurred while loading assets.', assetErrors)
		}

		this.style.display = 'block'
	}

	createView() {
		let view = document.createElement('panel-view')
		this.appendChild(view)
		this.views.push(view)
		return view
	}

	removeViews() {
		while (this.lastChild) {
			this.lastChild.remove()
			this.views.pop()
		}
	}

	setView(view) {
		// decrement to translate human index to 0 index
		view--
		for (let i = 0; i < this.views.length; i++) {
			let isViewActive = (i == view)
			this.views[i].classList.toggle('active', isViewActive)
		}
	}

	loadImage(file) {
		let url = getAssetPath(file)
		this.assets.push(new Promise((resolve, reject) => {
			let img = new Image()
			img.src = url
			img.onload = () => resolve()
			img.onerror = () => reject()
		}))
	}

	loadFont(family, file) {
		let url = getAssetPath(file)
		let font = new FontFace(family, `url(${url})`)
		document.fonts.add(font)
		this.assets.push(font.load())
	}

	loadScript(file) {
		let url = getAssetPath(file)
		this.assets.push(new Promise((resolve, reject) => {
			let script = document.createElement('script')
			script.src = url
			script.onload = () => resolve()
			this.appendChild(script)
		}))
	}

	set rows(rows) {
		this.style.setProperty('--grid-rows', rows)
	}

	set columns(columns) {
		this.style.setProperty('--grid-columns', columns)
	}

	set background(background) {
		this.style.backgroundColor = background.color
		if (background.image) {
			this.style.backgroundImage = `url(${getAssetPath(background.image)})`
			this.style.backgroundSize = 'cover'
			this.style.backgroundPosition = 'center'
		}
	}
}

export { Panel as default, AssetError }
