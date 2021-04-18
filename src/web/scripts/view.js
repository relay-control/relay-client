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
		for (let [control, tag] of view) {
			let c = v.createControl(tag, control)
			
			let style = {}
			if (panel.templates) {
				for (let [template, tag2] of panel.templates) {
					if ((tag2 === 'Control' || tag2 === tag) && template.name === control.inherits) {
						Object.assign(style, JSON.parse(JSON.stringify(template)))
					}
				}
			}
			Object.assign(style, control)
			
			if (control.row) c.row = control.row
			if (control.column) c.column = control.column
			if (style.rowSpan) c.rowSpan = style.rowSpan
			if (style.columnSpan) c.columnSpan = style.columnSpan
			
			c.addClass(tag.toLowerCase())
			
			if ('inherits' in control)
				c.addClass(control.inherits)
			else
				c.addClass('default')
			
			if (style.square) c.addClass('square')
			if (style.circle) c.addClass('circle')
			if ((style.square || style.circle) && !(style.size || style.width || style.height))
				c.addClass('auto-size')
			
			c.apply(control)
			if (control.active) {
				c.applyActive(control.active)
			}
			
			let textLabel2 = control.textLabel
			if (textLabel2) {
				let textLabel = c.createTextLabel()
				textLabel.setText(textLabel2.text)
				// textLabel.setPosition(textLabel2.position)
				// textLabel.setAnchor(textLabel2.anchor)
			}
			
			let iconLabel2 = control.iconLabel
			if (iconLabel2) {
				let iconLabel = c.createIconLabel()
				iconLabel.setIcon(iconLabel2.icon)
				// iconLabel.setPosition(iconLabel2.position)
				// iconLabel.setAnchor(iconLabel2.anchor)
			}
			
			let imageLabel2 = control.imageLabel
			if (imageLabel2) {
				let imageLabel = c.createImageLabel()
				imageLabel.setImage(imageLabel2.image)
				// iconLabel.setPosition(iconLabel2.position)
				// imageLabel.setAnchor(imageLabel2.anchor)
			}
			
			if (control.action) {
				if (control.action.device && !usedVJoyDevices.includes(control.action.device)) {
					usedVJoyDevices.push(control.action.device)
					usedVJoyDeviceButtons[control.action.device] = 0
					usedVJoyDeviceAxes[control.action.device] = []
				}
				if (control.action.type === 'button') {
					usedVJoyDeviceButtons[control.action.device] = Math.max(control.action.button, usedVJoyDeviceButtons[control.action.device])
				}
				if (control.action.type === 'axis' && !usedVJoyDeviceAxes[control.action.device].includes(control.action.axis)) {
					usedVJoyDeviceAxes[control.action.device].push(control.action.axis)
				}
				c.action = control.action
			}
			
			if (tag === 'Slider') {
				// c.setSnapValue(control.snap)
				c.setSnapValue(50)
				
				if (control.valueLabel) {
					let valueLabel = new ValueLabel(c)
					// valueLabel.setPosition(control.valueLabel.position)
					// valueLabel.setAnchor('container')
					valueLabel.setText("50%")
					c.valueLabel = valueLabel
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
