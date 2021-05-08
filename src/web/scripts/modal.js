const Dialog = {
	template: `
		<div class="modal-mask">
			<div class="modal-content">
				<header>
					<slot name="header"></slot>
				</header>
				<div class="content">
					<slot name="content"></slot>
				</div>
				<slot></slot>
			</div>
		</div>
	`,
}

const DialogButton = {
	props: ['primary'],
	emits: ['click'],
	template: `
		<div class="buttons">
			<button :class="primary" @click="$emit('click')">
				<slot></slot>
			</button>
		</div>
	`,
}

export {
	Dialog,
	DialogButton,
}
