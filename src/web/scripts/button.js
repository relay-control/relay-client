class Button extends Control {
	static actionTypes = [
		'key',
		'button',
		'macro',
		'command',
	]
	
	constructor(panel) {
		super(panel)
		this.control = document.createElement('button')
		this.control.classList.add('control')
		this.container.appendChild(this.control)
		
		for (let [event, callback] of Object.entries(this.events)) {
			this.control.addEventListener(event, callback)
		}
	}
	
	activate() {
		this.addClass('active')
		if (!this.action) return
		if (Button.actionTypes.includes(this.action.type)) {
			recon.sendInput({
				type: this.action.type,
				deviceID: this.action.device,
				key: this.action.key,
				button: this.action.button,
				state: true,
				actions: this.action.action,
				command: this.action.command,
				args: this.action.args,
			})
		}
	}
	
	deactivate() {
		this.removeClass('active')
		if (!this.action) return
		if (this.action.type === 'key' || this.action.type === 'button') {
			recon.sendInput({
				type: this.action.type,
				deviceID: this.action.device,
				key: this.action.key,
				button: this.action.button,
				state: false,
				actions: this.action.action,
			})
		}
		if (this.action.type === 'view') {
			this.panel.setView(this.action.view)
		}
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
	
	get events() {
		return {
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
}
