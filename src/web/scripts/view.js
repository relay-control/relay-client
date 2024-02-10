import Relay from 'relay'

export default class View extends HTMLElement {
	usedDevices = {}

	build(view) {
		for (let [controlData, tag] of view) {
			let control = this.createControl(tag, controlData)

			// manually "inherit" properties that won't be applied using CSS from relevant templates
			let style = {}
			if (this.templates) {
				for (let [template, tag2] of this.templates) {
					if ((tag2 === 'Control' || tag2 === tag) && (!controlData.inherits || template.name === controlData.inherits)) {
						Object.assign(style, JSON.parse(JSON.stringify(template)))
					}
				}
			}
			Object.assign(style, controlData)
			
			if (controlData.row) control.row = controlData.row
			if (controlData.column) control.column = controlData.column

			if ('inherits' in controlData)
				control.addClass(controlData.inherits)

			if (style.square) control.addClass('square')
			if (style.circle) control.addClass('circle')
			if ((style.square || style.circle) && !(style.size || style.width || style.height))
				control.addClass('auto-size')

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

			if (tag === 'Slider') {
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
				this.addAction(action)
				control.action = action
			}
		}
	}

	createControl(type, data) {
		switch (type) {
			case 'Button':
				var control = document.createElement('panel-button')
				control.mode = data.mode
				break
			case 'Slider':
				var control = document.createElement('panel-slider')
				break
			default:
				throw `Invalid control type '${type}'.`
		}
		this.appendChild(control)
		return control
	}

	addAction(action) {
		action.type = Relay.InputType[action.type]

		if (action.type === Relay.InputType.macro) {
			action.actions = action.action
			for (let macroAction of action.actions) {
				this.addAction(macroAction)
			}
			return
		}

		if (action.deviceId) {
			if (!(action.deviceId in this.usedDevices)) {
				this.usedDevices[action.deviceId] = {
					buttons: 0,
					axes: [],
				}
			}
			let device = this.usedDevices[action.deviceId]
			if (action.type === Relay.InputType.button) {
				device.buttons = Math.max(action.button, device.buttons)
			}
			if (action.type === Relay.InputType.axis && !device.axes.includes(action.axis)) {
				device.axes.push(action.axis)
			}
		}
	}
}
