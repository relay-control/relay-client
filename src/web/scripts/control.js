class Control extends Style {
	constructor(panel) {
		let id = panel.getNextID()
		super('#' + id)
		this.id = id
		
		this.panel = panel.parent
		
		this.cell = document.createElement('div')
		this.cell.classList.add('cell')
		this.cell.id = this.id
		
		this.container = document.createElement('div')
		this.container.classList.add('container')
		this.cell.appendChild(this.container)
	}
	
	addClass(className) {
		this.cell.classList.add(className)
	}
	
	removeClass(className) {
		this.cell.classList.remove(className)
	}
	
	set row(row) {
		this.setCellStyle('--row', row)
	}
	
	set column(column) {
		this.setCellStyle('--column', column)
	}
	
	createTextLabel() {
		let textLabel = document.createElement('text-label')
		this.cell.appendChild(textLabel)
		return textLabel
	}
	
	createIconLabel() {
		let iconLabel = document.createElement('icon-label')
		this.cell.appendChild(iconLabel)
		return iconLabel
	}
	
	createImageLabel() {
		let imageLabel = document.createElement('image-label')
		this.cell.appendChild(imageLabel)
		return imageLabel
	}
}
