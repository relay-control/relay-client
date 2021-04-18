class Control extends ControlStyle {
	constructor(panel) {
		let id = panel.getNextID()
		super(id)
		this.id = id
		
		this.panel = panel.parent
		
		this.area = document.createElement('div')
		this.area.classList.add('cell')
		this.area.id = this.id
		panel.addControl(this)
		
		this.container = document.createElement('div')
		this.container.classList.add('container')
		this.area.appendChild(this.container)
	}
	
	addClass(className) {
		this.area.classList.add(className)
	}
	
	removeClass(className) {
		this.area.classList.remove(className)
	}
	
	set row(row) {
		this.setAreaStyle('--row', row)
	}
	
	set column(column) {
		this.setAreaStyle('--column', column)
	}
	
	createTextLabel() {
		let textLabel = new TextLabel(this)
		return textLabel
	}
	
	createIconLabel() {
		let iconLabel = new IconLabel(this)
		return iconLabel
	}
	
	createImageLabel() {
		let imageLabel = new ImageLabel(this)
		return imageLabel
	}
}
