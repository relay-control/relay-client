import { ControlStyleTemplate, SliderStyle } from 'styles'
import Stylesheet from 'stylesheet'
import Grid from 'grid'

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

class Panel {
	assets = []

	constructor(name, options) {
		this.name = name
		this.options = options
	}

	async build() {
		// create a separate stylesheet for dynamic style rules
		Stylesheet.create()

		let panelContainer = document.getElementById('panel-container')

		this.options.grid.templates = this.options.templates

		let grid = Grid.create(this.options.grid)
		panelContainer.appendChild(grid)

		this.grid = grid

		/* validate grid size and control placement */

		if (this.options.assets) {
			for (let asset of this.options.assets) {
				switch (asset.tagName) {
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
		if (this.options.templates) {
			for (let template of this.options.templates) {
				let tag = template.tagName
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
	}

	destroy() {
		this.grid?.remove()
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
		this.assets.push(import(url))
	}
}

export { Panel as default, AssetError }
