class View extends HTMLElement {
	// show() {
		// Promise.all(this.assets)
		 // .then(() => {
			// let menu = document.getElementById('menu')
			// menu.style.display = 'none'
			
			// this.element.style.display = 'grid'
		 // })
	// }

	build(view) {
		let usedVJoyDevices = {}
		
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
			
			let textLabel2 = controlData.textLabel
			if (textLabel2) {
				let textLabel = control.createTextLabel()
				textLabel.setText(textLabel2.text)
				if (textLabel2.anchor?.parent === 'container') {
					control.appendChild(textLabel)
				} else {
					control.control.appendChild(textLabel)
				}
			}
			
			let iconLabel2 = controlData.iconLabel
			if (iconLabel2) {
				let iconLabel = control.createIconLabel()
				iconLabel.setIcon(iconLabel2.icon)
				if (iconLabel2.anchor?.parent === 'container') {
					control.appendChild(iconLabel)
				} else {
					control.control.appendChild(iconLabel)
				}
			}
			
			let imageLabel2 = controlData.imageLabel
			if (imageLabel2) {
				let imageLabel = control.createImageLabel()
				imageLabel.setImage(imageLabel2.image)
			}
			
			if (tag === 'Slider') {
				// c.setSnapValue(control.snap)
				control.setSnapValue(50)
				
				if (controlData.valueLabel) {
					let valueLabel = control.createValueLabel()
					valueLabel.setText("50%")
				}
			}
			
			let action = controlData.action
			if (action) {
				if (action.device && !(action.device in usedVJoyDevices)) {
					usedVJoyDevices[action.device] = {
						buttons: 0,
						axes: [],
					}
				}
				if (action.type === 'button') {
					usedVJoyDevices[action.device].buttons = Math.max(action.button, usedVJoyDevices[action.device].buttons)
				}
				if (action.type === 'axis' && !usedVJoyDevices[action.device].axes.includes(action.axis)) {
					usedVJoyDevices[action.device].axes.push(action.axis)
				}
				control.action = action
			}
		}

		this.usedDevices = usedVJoyDevices
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
	
	getNextID() {
		return 'control' + this.parent.id++
	}
}

customElements.define('panel-view', View)
