import { ControlStyle, Stylable, StyleElement } from '/scripts/styles.js'

export default class Control extends ControlStyle(Stylable(StyleElement)) {
	constructor() {
		super()
		this.container = document.createElement('div')
		this.container.classList.add('container')
		this.cellStyle = this.style
		this.containerStyle = this.container.style
	}

	connectedCallback() {
		this.classList.add('cell')
		this.appendChild(this.container)
	}

	setBaseStyle(style) {
		this.baseStyle = style
	}

	setActiveStyle(style) {
		this.activeStyle = style
	}
	
	addClass(className) {
		this.classList.add(className)
	}
	
	removeClass(className) {
		this.classList.remove(className)
	}
	
	set row(row) {
		this.cellStyle.setProperty('--row', row)
	}
	
	set column(column) {
		this.cellStyle.setProperty('--column', column)
	}
	
	createTextLabel() {
		let textLabel = document.createElement('text-label')
		this.appendChild(textLabel)
		this.textLabel = textLabel
		return textLabel
	}
	
	createIconLabel() {
		let iconLabel = document.createElement('icon-label')
		this.appendChild(iconLabel)
		this.iconLabel = iconLabel
		return iconLabel
	}
	
	createImageLabel() {
		let imageLabel = document.createElement('image-label')
		this.appendChild(imageLabel)
		this.imageLabel = imageLabel
		return imageLabel
	}
}
