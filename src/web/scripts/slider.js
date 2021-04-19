import Control from '/scripts/control.js'
import { LabelStyle, SliderThumbStyle, SliderTrackStyle } from '/scripts/styles.js'

class Slider extends Control {
	connectedCallback() {
		super.connectedCallback()

		this.control = document.createElement('input')
		this.control.type = 'range'
		this.control.id = this.id
		this.control.classList.add('control')
		this.container.appendChild(this.control)
		
		for (let [event, callback] of Object.entries(this.events)) {
			this.control.addEventListener(event, callback)
		}
	}
	
	setSnapValue(value) {
		let listID = 'datalist-' + this.id
		this.control.setAttribute('list', listID)
		let datalist = document.createElement('datalist')
		datalist.id = listID
		this.container.appendChild(datalist)
		let option = document.createElement('option')
		option.value = value
		datalist.appendChild(option)
	}
	
	apply(style) {
		super.apply(style)
		
		if (style.valueLabel) {
			let valueLabelStyle = new LabelStyle('.value')
			valueLabelStyle.apply(style.valueLabel)
		}
		
		if (style.thumb) {
			let thumbStyle = new SliderThumbStyle(this)
			thumbStyle.apply(style.thumb)
		}
		
		if (style.track) {
			let trackStyle = new SliderTrackStyle(this)
			trackStyle.apply(style.track)
		}
	}
	
	events = {
		input: e => {
			if (45 < e.currentTarget.value && e.currentTarget.value < 55)
				e.currentTarget.value = 50
			
			// avoid sending input if value is unchanged
			if (e.currentTarget.value === this.previousValue) return
			this.previousValue = e.currentTarget.value
			
			if (this.valueLabel)
				this.valueLabel.setText(e.currentTarget.value + '%')
			
			if (this.action) {
				let event = new CustomEvent('slider-change', {
					bubbles: true,
					detail: this.action,
				})
				this.control.dispatchEvent(event)
			}
		},
	}
}

customElements.define('panel-slider', Slider)
