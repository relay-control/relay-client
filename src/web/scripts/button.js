import Control from '/scripts/control.js'
import Relay from '/scripts/relay.js'

class Button extends Control {
	static actionTypes = [
		Relay.InputType.key,
		Relay.InputType.button,
		Relay.InputType.command,
		Relay.InputType.macro,
		Relay.InputType.view,
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

		for (let label of this.labels) {
			label.resetStyle()
		}
	}

	applyBaseStyle() {
		this.resetStyle()
		if (this.baseStyle) this.setStyle(this.baseStyle)
	}

	applyActiveStyle() {
		if (this.activeStyle) this.setStyle(this.activeStyle)
	}

	dispatchEvent(eventName, detail = { }) {
		if (!this.action) return
		if (!Button.actionTypes.includes(this.action.type)) return
		let event = new CustomEvent(eventName, {
			bubbles: true,
			detail: Object.assign(detail, this.action),
		})
		this.control.dispatchEvent(event)
	}
	
	activate() {
		this.addClass('active')
		this.applyActiveStyle()
		this.dispatchEvent('button-activate')
		this.dispatchEvent('button-change', { isPressed: true })
	}
	
	deactivate() {
		this.removeClass('active')
		this.applyBaseStyle()
		this.dispatchEvent('button-deactivate')
		this.dispatchEvent('button-change', { isPressed: false })
	}
	
	press() {
		if (this.mode === 'toggle') {
			if (!this.wasActive) {
				this.activate()
			}
		} else {
			this.activate()
		}
		this.isPressed = true
	}
	
	release() {
		if (this.mode === 'toggle') {
			if (this.wasActive)
				this.deactivate()
			this.wasActive = !this.wasActive
		} else {
			this.deactivate()
		}
		this.isPressed = false
	}
	
	events = {
		mousedown: e => {
			this.press()
		},
		mouseup: e => {
			this.release()
		},
		mouseout: e => {
			if (this.isPressed) {
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
