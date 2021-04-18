class Label {
	constructor(parent) {
		this.element = document.createElement('div')
		this.element.classList.add('label')
		this.parent = parent
	}
	
	setParent(parent) {
		if (parent === 'container') {
			this.parent.cell.appendChild(this.element)
		} else {
			this.parent.control.appendChild(this.element)
		}
	}
}

class ValueLabel extends Label {
	constructor(parent) {
		super(parent)
		this.element.classList.add('value')
		this.span = document.createElement('span')
		this.element.appendChild(this.span)
		parent.value = this
	}
	
	setText(text) {
		this.span.textContent = text
	}
}

class TextLabel extends Label {
	constructor(parent) {
		super(parent)
		this.element.classList.add('text')
		this.span = document.createElement('span')
		this.element.appendChild(this.span)
	}
	
	setText(text) {
		this.span.textContent = text
	}
}

class IconLabel extends Label {
	constructor(parent) {
		super(parent)
		this.element.classList.add('icon')
		this.icon = document.createElement('span')
		this.icon.classList.add('fa', 'fa-fw', 'fa-2x')
		this.element.appendChild(this.icon)
	}
	
	setIcon(icon) {
		this.icon.classList.add('fa-' + icon)
	}
}

class ImageLabel extends Label {
	constructor(parent) {
		super(parent)
		this.element.classList.add('image')
		this.image = document.createElement('img')
		this.element.appendChild(this.image)
	}
	
	setImage(image) {
		this.image.src = recon.getAssetPath(image)
	}
}
