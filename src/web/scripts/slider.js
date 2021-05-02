import Control from '/scripts/control.js'
import { SliderThumbStyle, SliderTrackStyle } from '/scripts/styles.js'

class Slider extends Control {
	constructor() {
		super()
		this.control = document.createElement('input')
		this.control.type = 'range'
		this.control.id = this.id
		this.control.classList.add('control')
	}

	connectedCallback() {
		super.connectedCallback()
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
	
	setStyle(style) {
		super.setStyle(style)
		
		if (style.valueLabel && this.valueLabel) {
			this.valueLabel.setStyle(style.valueLabel)
		}
		
		if (style.thumb) {
			let thumbStyle = new SliderThumbStyle(this)
			thumbStyle.setStyle(style.thumb)
		}
		
		if (style.track) {
			let trackStyle = new SliderTrackStyle(this)
			trackStyle.setStyle(style.track)
		}
	}
	
	createValueLabel() {
		let valueLabel = document.createElement('text-label')
		this.appendChild(valueLabel)
		this.valueLabel = valueLabel
		return valueLabel
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
