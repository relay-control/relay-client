import { StylableLabel, StyleElement } from 'styles'

class Label extends StylableLabel(StyleElement) {
	connectedCallback() {
		this.classList.add('label')
		this.appendChild(this.label)
	}
}

class TextLabel extends Label {
	constructor() {
		super()
		this.label = document.createElement('span')
	}

	setText(text) {
		this.label.textContent = text
	}
}

class IconLabel extends Label {
	constructor() {
		super()
		this.label = document.createElement('span')
		this.label.classList.add('fa', 'fa-fw', 'fa-2x')
	}

	setIcon(icon) {
		this.label.classList.add('fa-' + icon)
	}
}

class ImageLabel extends Label {
	constructor() {
		super()
		this.label = document.createElement('img')
	}

	setImage(image) {
		this.label.src = getAssetUrl(image)
	}
}

export { TextLabel, IconLabel, ImageLabel }
