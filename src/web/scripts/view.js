import Relay from 'relay'

export default class View extends HTMLElement {
	static CustomElements = {
		'Simple': 'simple-control',
		'State': 'state-control',
		'Button': 'button-control',
		'Slider': 'slider-control',
	}

	joystickActions = []

	static create(options) {
		let view = document.createElement('panel-view')

		for (let controlData of options) {
			let tagName = controlData.tagName
			let control = view.addControl(tagName, controlData)

			// manually "inherit" properties that won't be applied using CSS from relevant templates
			let style = {}
			if (options.templates) {
				for (let template of options.templates) {
					if ((template.tagName === 'Control' || template.tagName === tagName) && template.name === controlData.inherits) {
						Object.assign(style, structuredClone(template))
					}
				}
			}
			Object.assign(style, controlData)

			if ('id' in controlData) {
				control.id = controlData.id
			}

			if (controlData.row) {
				control.row = controlData.row
			}

			if (controlData.column) {
				control.column = controlData.column
			}

			if ('inherits' in controlData) {
				control.addClass(controlData.inherits)
			}

			if (style.square) {
				control.addClass('square')
			}

			if (style.circle) {
				control.addClass('circle')
			}

			if ((style.square || style.circle) && !(style.size || style.width || style.height)) {
				control.addClass('auto-size')
			}

			control.setBaseStyle(controlData)
			if (controlData.active) {
				control.setActiveStyle(controlData.active)
			}

			let textLabelData = controlData.textLabel
			if (textLabelData) {
				control.textLabel = control.createLabel('text', textLabelData.anchor?.parent)
				control.textLabel.setText(textLabelData.text)
			}

			let iconLabelData = controlData.iconLabel
			if (iconLabelData) {
				control.iconLabel = control.createLabel('icon', iconLabelData.anchor?.parent)
				control.iconLabel.setIcon(iconLabelData.icon)
			}

			let imageLabelData = controlData.imageLabel
			if (imageLabelData) {
				control.imageLabel = control.createLabel('image', imageLabelData.anchor?.parent)
				control.imageLabel.setImage(imageLabelData.image)
			}

			if (tagName === 'Slider') {
				// c.setSnapValue(control.snap)
				control.setSnapValue(50)

				if (controlData.valueLabel) {
					control.valueLabel = control.createLabel('text', 'container')
					control.valueLabel.setText("50%")
				}
			}

			control.setStyle(controlData)

			let action = controlData.action
			if (action) {
				view.addAction(action)
				control.action = action
			}
		}

		return view
	}

	addControl(type, options) {
		let tagName = View.CustomElements[type]

		if (!tagName) {
			throw new Error(`Invalid control type '${type}'.`)
		}

		if (!customElements.get(tagName)) {
			throw new Error(`Unknown custom element '${tagName}'.`)
		}

		let control = document.createElement(tagName)

		if (type === 'Button') {
			control.mode = options.mode
		}

		this.appendChild(control)

		return control
	}

	addAction(action) {
		action.type = Relay.InputType[action.type]

		if (action.type === Relay.InputType.macro) {
			for (let macroAction of action.actions) {
				this.addAction(macroAction)
			}
			return
		}

		if (action.deviceId) {
			this.joystickActions.push(action)
		}
	}
}
