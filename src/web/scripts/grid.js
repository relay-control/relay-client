import View from 'view'

export default class Grid extends HTMLElement {
	views = []
	joystickActions = []

	static create(options) {
		let grid = document.createElement('panel-grid')

		grid.numRows = options.rows
		grid.numColumns = options.columns

		if (options.background) {
			grid.background = options.background
		}

		for (let viewProperties of options) {
			if (viewProperties.tagName !== 'View') continue
			viewProperties.templates = options.templates
			let view = grid.addView(viewProperties)
			grid.joystickActions.push(...view.joystickActions)
		}

		grid.setView(1)

		return grid
	}

	addView(options) {
		let view = View.create(options)
		this.appendChild(view)
		this.views.push(view)
		return view
	}

	setView(view) {
		// decrement to translate human index to 0 index
		view--
		if (!this.views[view]) {
			throw new Error(`View ${view + 1} does not exist.`)
		}
		for (let i = 0; i < this.views.length; i++) {
			let isViewActive = (i == view)
			this.views[i].classList.toggle('active', isViewActive)
		}
	}

	set numRows(numRows) {
		this.style.setProperty('--grid-rows', numRows)
	}

	set numColumns(numColumns) {
		this.style.setProperty('--grid-columns', numColumns)
	}

	set background(background) {
		this.style.backgroundColor = background.color
		if (background.image) {
			this.style.backgroundImage = `url(${getAssetUrl(background.image)})`
			this.style.backgroundSize = 'cover'
			this.style.backgroundPosition = 'center'
		}
	}
}
