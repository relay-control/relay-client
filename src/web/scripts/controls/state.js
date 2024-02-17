import BaseControl from 'controls/base'

export default class StateControl extends BaseControl {
	constructor() {
		super()
		this.control = document.createElement('button')
		this.control.classList.add('control')
	}

	connectedCallback() {
		super.connectedCallback()
		this.container.appendChild(this.control)
	}

	resetStyle() {
		super.resetStyle()

		for (let label of this.labels) {
			label.resetStyle()
		}
	}

	applyBaseStyle() {
		this.resetStyle()
		if (this.baseStyle) this.setStyle(this.baseStyle)
	}

	applyActiveStyle() {
		if (this.activeStyle) this.setStyle(this.activeStyle)
	}

	activate() {
		this.addClass('active')
		this.applyActiveStyle()
	}

	deactivate() {
		this.removeClass('active')
		this.applyBaseStyle()
	}
}
