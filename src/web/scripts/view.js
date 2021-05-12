import Recon from '/scripts/recon.js'

class View extends HTMLElement {
	usedDevices = {}

	// show() {
		// Promise.all(this.assets)
		 // .then(() => {
			// let menu = document.getElementById('menu')
			// menu.style.display = 'none'
			
			// this.element.style.display = 'grid'
		 // })
	// }
	
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
				let textLabel = control.createTextLabel()
				textLabel.setText(textLabelData.text)
				if (textLabelData.anchor?.parent === 'container') {
					control.appendChild(textLabel)
				} else {
					control.control.appendChild(textLabel)
				}
			}
			
			let iconLabelData = controlData.iconLabel
			if (iconLabelData) {
				let iconLabel = control.createIconLabel()
				iconLabel.setIcon(iconLabelData.icon)
				if (iconLabelData.anchor?.parent === 'container') {
					control.appendChild(iconLabel)
				} else {
					control.control.appendChild(iconLabel)
				}
			}
			
			let imageLabelData = controlData.imageLabel
			if (imageLabelData) {
				let imageLabel = control.createImageLabel()
				imageLabel.setImage(imageLabelData.image)
				if (imageLabelData.anchor?.parent === 'container') {
					control.appendChild(imageLabel)
				} else {
					control.control.appendChild(imageLabel)
				}
			}
			
			if (tag === 'Slider') {
				// c.setSnapValue(control.snap)
				control.setSnapValue(50)
				
				if (controlData.valueLabel) {
					let valueLabel = control.createValueLabel()
					valueLabel.setText("50%")
				}
			}

			control.setStyle(controlData)
			
			let action = controlData.action
			if (action) {
				this.addAction(controlData.action)
			}
			control.action = action
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
		}
		this.appendChild(control)
		return control
	}

	addAction(action) {
		action.type = Recon.InputType[action.type]

		if (action.type === Recon.InputType.macro) {
			action.actions = action.action
			for (let macroAction of action.actions) {
				this.addAction(macroAction)
			}
		}

		if (action.deviceId) {
			if (!(action.device in this.usedDevices)) {
				this.usedDevices[action.deviceId] = {
					buttons: 0,
					axes: [],
				}
			}
			let device = this.usedDevices[action.deviceId]
			if (action.type === Recon.InputType.button) {
				device.buttons = Math.max(action.button, device.buttons)
			}
			if (action.type === Recon.InputType.axis && !device.axes.includes(action.axis)) {
				device.axes.push(action.axis)
			}
		}
	}
}

customElements.define('panel-view', View)
