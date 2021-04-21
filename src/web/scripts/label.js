import { Stylable, StylableLabel } from '/scripts/styles.js'

class Label extends StylableLabel(Stylable(HTMLElement)) {
	connectedCallback() {
		this.classList.add('label')
		this.parent = this.parentNode
	}
}

class ValueLabel extends Label {
	constructor() {
		super()
		this.span = document.createElement('span')
	}

	connectedCallback() {
		super.connectedCallback()
		this.appendChild(this.span)
		parent.value = this
	}
	
	setText(text) {
		this.span.textContent = text
	}
}

customElements.define('value-label', ValueLabel)

class TextLabel extends Label {
	constructor() {
		super()
		this.span = document.createElement('span')
	}

	connectedCallback() {
		super.connectedCallback()
		this.appendChild(this.span)
	}
	
	setText(text) {
		this.span.textContent = text
	}
}

customElements.define('text-label', TextLabel)

class IconLabel extends Label {
	constructor(parent) {
		super(parent)
		this.icon = document.createElement('span')
		this.icon.classList.add('fa', 'fa-fw', 'fa-2x')
	}

	connectedCallback() {
		super.connectedCallback()
		this.appendChild(this.icon)
	}
	
	setIcon(icon) {
		this.icon.classList.add('fa-' + icon)
	}
}

customElements.define('icon-label', IconLabel)

class ImageLabel extends Label {
	constructor(parent) {
		super(parent)
		this.image = document.createElement('img')
	}

	connectedCallback() {
		super.connectedCallback()
		this.appendChild(this.image)
	}
	
	setImage(image) {
		this.image.src = getAssetPath(image)
	}
}

customElements.define('image-label', ImageLabel)

export { ValueLabel, TextLabel }
