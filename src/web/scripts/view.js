class View {
	constructor(panel) {
		this.element = document.createElement('div')
		this.element.classList.add('view')
		panel.element.appendChild(this.element)
		this.parent = panel
	}
	
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
			let control = v.createControl(tag, controlData)
			
			let style = {}
			if (panel.templates) {
				for (let [template, tag2] of panel.templates) {
					if ((tag2 === 'Control' || tag2 === tag) && template.name === controlData.inherits) {
						Object.assign(style, JSON.parse(JSON.stringify(template)))
					}
				}
			}
			Object.assign(style, controlData)
			
			if (controlData.row) control.row = controlData.row
			if (controlData.column) control.column = controlData.column
			if (style.rowSpan) control.rowSpan = style.rowSpan
			if (style.columnSpan) control.columnSpan = style.columnSpan
			
			control.addClass(tag.toLowerCase())
			
			if ('inherits' in controlData)
				control.addClass(controlData.inherits)
			else
				control.addClass('default')
			
			if (style.square) control.addClass('square')
			if (style.circle) control.addClass('circle')
			if ((style.square || style.circle) && !(style.size || style.width || style.height))
				control.addClass('auto-size')
			
			control.apply(controlData)
			if (controlData.active) {
				control.applyActive(controlData.active)
			}
			
			let textLabel2 = controlData.textLabel
			if (textLabel2) {
				let textLabel = control.createTextLabel()
				textLabel.setText(textLabel2.text)
			}
			
			let iconLabel2 = controlData.iconLabel
			if (iconLabel2) {
				let iconLabel = control.createIconLabel()
				iconLabel.setIcon(iconLabel2.icon)
			}
			
			let imageLabel2 = controlData.imageLabel
			if (imageLabel2) {
				let imageLabel = control.createImageLabel()
				imageLabel.setImage(imageLabel2.image)
			}
			
			if (controlData.action) {
				if (controlData.action.device && !usedVJoyDevices.includes(controlData.action.device)) {
					usedVJoyDevices.push(controlData.action.device)
					usedVJoyDeviceButtons[controlData.action.device] = 0
					usedVJoyDeviceAxes[controlData.action.device] = []
				}
				if (controlData.action.type === 'button') {
					usedVJoyDeviceButtons[controlData.action.device] = Math.max(controlData.action.button, usedVJoyDeviceButtons[controlData.action.device])
				}
				if (controlData.action.type === 'axis' && !usedVJoyDeviceAxes[controlData.action.device].includes(controlData.action.axis)) {
					usedVJoyDeviceAxes[controlData.action.device].push(controlData.action.axis)
				}
				control.action = controlData.action
			}
			
			if (tag === 'Slider') {
				// c.setSnapValue(control.snap)
				control.setSnapValue(50)
				
				if (controlData.valueLabel) {
					let valueLabel = new ValueLabel(control)
					valueLabel.setText("50%")
					control.valueLabel = valueLabel
				}
			}
		}
	}
	
	addControl(control) {
		this.element.appendChild(control.area)
	}
	
	createControl(type, data) {
		switch (type) {
			case 'Button':
				var control = new Button(this)
				control.mode = data.mode
				break
			case 'Slider':
				var control = new Slider(this)
				break
		}
		return control
	}
	
	getNextID() {
		return 'control' + this.parent.id++
	}
}
