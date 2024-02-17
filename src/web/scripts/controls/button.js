import StateControl from 'controls/state'
import Relay from 'relay'

export default class ButtonControl extends StateControl {
	static actionTypes = [
		Relay.InputType.key,
		Relay.InputType.button,
		Relay.InputType.command,
		Relay.InputType.macro,
		Relay.InputType.view,
	]

	connectedCallback() {
		super.connectedCallback()

		for (let [event, callback] of Object.entries(this.events)) {
			this.control.addEventListener(event, callback)
		}
	}

	dispatchEvent(eventName, detail = { }) {
		if (!this.action) return
		if (!ButtonControl.actionTypes.includes(this.action.type)) return
		let event = new CustomEvent(eventName, {
			bubbles: true,
			detail: Object.assign(detail, this.action),
		})
		this.control.dispatchEvent(event)
	}

	activate() {
		super.activate()
		this.dispatchEvent('button-activate')
		this.dispatchEvent('button-change', { isPressed: true })
	}

	deactivate() {
		super.deactivate()
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
