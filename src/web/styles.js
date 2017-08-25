var Styles = {
	global: [
		['label', (style, data, element) => {
			style.color = data.color
			if (data.icon) {
				let icon = document.createElement('i')
				icon.classList.add('fa', 'fa-fw', 'fa-2x', 'fa-' + data.icon)
				element.appendChild(icon)
			} else if (data.text) {
				element.textContent = data.text
			}
		}],
		// ['padding', (style, data, element, control) => {
			// style.padding = `${data.y} ${data.x}`
		// }],
		['border', (style, data, element, control) => {
			style.borderStyle = data.style
			style.borderWidth = data.width
			style.borderColor = data.color
			if (!control.circle) style.borderRadius = data.radius
		}],
		['background', (style, data) => {
			style.backgroundColor = data.color
			style.backgroundImage = data.image || "initial"
			if (data.gradient) {
				let gradient = []
				for (point of data.gradient) {
					let colorStop = point.color
					if (point.stop) colorStop += ' ' +point.stop
					gradient.push(colorStop)
				}
				gradient = gradient.join(", ")
				if (data.gradient.type === "radial") {
					if (data.gradient.position) gradient = data.gradient.position + ', ' + gradient
					style.backgroundImage = `-webkit-radial-gradient(${gradient})`
				} else {
					let direction = data.gradient.direction
					if (direction && !direction.match(/\d+deg/)) direction = "to " + direction
					if (direction) gradient = data.gradient.direction + ', ' + gradient
					style.backgroundImage = `-webkit-linear-gradient(${gradient})`
				}
			}
		}],
		['shadows', (style, data) => {
			let boxShadows = []
			for (shadow of data) {
				let boxShadow = []
				if (shadow.inset) boxShadow.push("inset")
				boxShadow.push(shadow.offsetX, shadow.offsetY)
				if (typeof shadow.blurRadius !== 'undefined') boxShadow.push(shadow.blurRadius)
				if (typeof shadow.spreadRadius !== 'undefined') boxShadow.push(shadow.spreadRadius)
				if (shadow.color) boxShadow.push(parseColor(shadow.color, shadow.alpha))
				boxShadows.push(boxShadow.join(" "))
			}
			style.boxShadow = boxShadows.join(", ")
		}],
	],
	controls: {
		Slider: {
			// ['datalist', (style, data) => {
				// element.setAttribute("list", "datalist" + n)
				// let datalist = cell.appendChild(document.createElement("datalist"))
				// datalist.id = "datalist" + n
				// let option = datalist.appendChild(document.createElement("option"))
				// option.value = 50
			// }],
			children: [
				['thumb', '::-webkit-slider-thumb', (style, data, element, control) => {
					style.marginTop = `${-parseInt(data.height) / 2 + parseInt(control.track.height) / 2}px`
				}],
				['track', '::-webkit-slider-runnable-track'],
			],
		},
	},
}
