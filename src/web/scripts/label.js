import { StylableLabel, StyleElement } from '/scripts/styles.js'

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

customElements.define('text-label', TextLabel)

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

customElements.define('icon-label', IconLabel)

class ImageLabel extends Label {
	constructor() {
		super()
		this.label = document.createElement('img')
	}

	setImage(image) {
		this.label.src = getAssetPath(image)
	}
}

customElements.define('image-label', ImageLabel)
