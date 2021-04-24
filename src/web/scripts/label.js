import { StylableLabel, StyleElement } from '/scripts/styles.js'

class Label extends StylableLabel(StyleElement) {
	constructor() {
		super()
		this.cellStyle = this.style
		this.containerStyle = this.style
	}

	connectedCallback() {
		this.classList.add('label')
		this.parent = this.parentNode
	}
	
	resetStyle() {
		for (let property of this.cssProperties) {
			this.style.removeProperty(property)
			this.label.style.removeProperty(property)
		}
	}
}

class ValueLabel extends Label {
	constructor() {
		super()
		this.label = document.createElement('span')
		this.elementStyle = this.label.style
	}

	connectedCallback() {
		super.connectedCallback()
		this.appendChild(this.label)
		parent.value = this
	}
	
	setText(text) {
		this.label.textContent = text
	}
}

customElements.define('value-label', ValueLabel)

class TextLabel extends Label {
	constructor() {
		super()
		this.label = document.createElement('span')
		this.elementStyle = this.label.style
	}

	connectedCallback() {
		super.connectedCallback()
		this.appendChild(this.label)
	}
	
	setText(text) {
		this.label.textContent = text
	}
}

customElements.define('text-label', TextLabel)

class IconLabel extends Label {
	constructor(parent) {
		super(parent)
		this.label = document.createElement('span')
		this.label.classList.add('fa', 'fa-fw', 'fa-2x')
		this.elementStyle = this.label.style
	}

	connectedCallback() {
		super.connectedCallback()
		this.appendChild(this.label)
	}
	
	setIcon(icon) {
		this.label.classList.add('fa-' + icon)
	}
}

customElements.define('icon-label', IconLabel)

class ImageLabel extends Label {
	constructor(parent) {
		super(parent)
		this.label = document.createElement('img')
		this.elementStyle = this.label.style
	}

	connectedCallback() {
		super.connectedCallback()
		this.appendChild(this.label)
	}
	
	setImage(image) {
		this.label.src = getAssetPath(image)
	}
}

customElements.define('image-label', ImageLabel)
