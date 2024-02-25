import BaseControl from 'controls/base'
import { SliderThumbStyle, SliderTrackStyle } from 'styles'

export default class extends BaseControl {
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

	events = {
		input: e => {
			let value = e.currentTarget.valueAsNumber
			if (45 < value && value < 55) {
				value = 50
			}
			e.currentTarget.value = value

			// avoid sending input if value is unchanged
			if (value === this.previousValue) {
				return
			}
			this.previousValue = value

			if (this.valueLabel) {
				this.valueLabel.setText(value + '%')
			}

			if (this.action) {
				let event = new CustomEvent('slider-change', {
					bubbles: true,
					detail: Object.assign({ value }, this.action),
				})
				this.control.dispatchEvent(event)
			}
		},
	}
}
