import Control from '/scripts/control.js'

class Button extends Control {
	static actionTypes = [
		'key',
		'button',
		'command',
		'macro',
	]
	
	constructor() {
		super()
		this.control = document.createElement('button')
		this.control.classList.add('control')
	}

	connectedCallback() {
		super.connectedCallback()
		this.container.appendChild(this.control)
		
		for (let [event, callback] of Object.entries(this.events)) {
			this.control.addEventListener(event, callback)
		}
	}

	resetStyle() {
		super.resetStyle()
		
		if (this.textLabel) {
			this.textLabel.resetStyle()
		}
		
		if (this.iconLabel) {
			this.iconLabel.resetStyle()
		}
		
		if (this.imageLabel) {
			this.imageLabel.resetStyle()
		}
	}

	applyBaseStyle() {
		this.resetStyle()
		if (this.baseStyle) this.setStyle(this.baseStyle)
	}

	applyActiveStyle() {
		if (this.activeStyle) this.setStyle(this.activeStyle)
	}
	
	activate() {
		this.addClass('active')
		this.applyActiveStyle()
		if (!this.action) return
		if (Button.actionTypes.includes(this.action.type)) {
			let event = new CustomEvent('button-activate', {
				bubbles: true,
				detail: this.action,
			})
			this.control.dispatchEvent(event)
		}
	}
	
	deactivate() {
		this.removeClass('active')
		this.applyBaseStyle()
		if (!this.action) return
		//if (this.action.type === 'key' || this.action.type === 'button') {
			let event = new CustomEvent('button-deactivate', {
				bubbles: true,
				detail: this.action,
			})
			this.control.dispatchEvent(event)
		//}
	}
	
	press() {
		if (this.mode === 'toggle') {
			if (!this.wasActive) {
				this.activate()
			}
		} else {
			this.activate()
		}
		this.pressed = true
	}
	
	release() {
		if (this.mode === 'toggle') {
			if (this.wasActive)
				this.deactivate()
			this.wasActive = !this.wasActive
		} else {
			this.deactivate()
		}
		this.pressed = false
	}
	
	events = {
		mousedown: e => {
			this.press()
		},
		mouseup: e => {
			this.release()
		},
		mouseout: e => {
			if (this.pressed) {
				this.release()
			}
		},
		touchstart: e => {
			// e.preventDefault()
			this.press()
		},
		touchend: e => {
			e.preventDefault()
			this.release()
		},
	}
}

customElements.define('panel-button', Button)
