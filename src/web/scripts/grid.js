import View from 'view'
import { StylableBase, StyleElement } from 'styles'

export default class Grid extends StylableBase(HTMLElement) {
	views = []
	joystickActions = []

	static create(options) {
		let grid = document.createElement('panel-grid')

		if (options.rows) {
			grid.numRows = options.rows
		}

		if (options.columns) {
			grid.numColumns = options.columns
		}

		grid.setStyle(options)

		for (let viewProperties of options) {
			if (viewProperties.tagName !== 'View') continue
			viewProperties.templates = options.templates
			let view = grid.addView(viewProperties)
			grid.joystickActions.push(...view.joystickActions)
		}

		if (grid.views.length > 0) {
			grid.setView(1)
		}

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

	addClass(className) {
		this.classList.add(className)
	}

	set numRows(numRows) {
		this.setStyleProperty('grid-rows', numRows)
	}

	set numColumns(numColumns) {
		this.setStyleProperty('grid-columns', numColumns)
	}

	set row(row) {
		this.setStyleProperty('row', row)
	}

	set column(column) {
		this.setStyleProperty('column', column)
	}

	set rowSpan(span) {
		this.setStyleProperty('row-span', span)
	}

	set columnSpan(span) {
		this.setStyleProperty('column-span', span)
	}
}
