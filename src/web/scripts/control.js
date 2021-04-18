class Control extends Stylable(HTMLElement) {
	connectedCallback() {
		let id = panel.getNextID()
		super('#' + id)
		this.id = id
		
		this.panel = panel.parent
		
		this.classList.add('cell')
		
		this.container = document.createElement('div')
		this.container.classList.add('container')
		this.appendChild(this.container)
	}
	
	addClass(className) {
		this.classList.add(className)
	}
	
	removeClass(className) {
		this.classList.remove(className)
	}
	
	set row(row) {
		this.setCellStyle('--row', row)
	}
	
	set column(column) {
		this.setCellStyle('--column', column)
	}
	
	createTextLabel() {
		let textLabel = document.createElement('text-label')
		this.appendChild(textLabel)
		return textLabel
	}
	
	createIconLabel() {
		let iconLabel = document.createElement('icon-label')
		this.appendChild(iconLabel)
		return iconLabel
	}
	
	createImageLabel() {
		let imageLabel = document.createElement('image-label')
		this.appendChild(imageLabel)
		return imageLabel
	}
}
