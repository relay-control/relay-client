export default class Stylesheet {
	static create() {
		Stylesheet.sheet = new CSSStyleSheet();
		document.adoptedStyleSheets = [Stylesheet.sheet];
	}

	static createRule(selector) {
		let index = Stylesheet.sheet.rules.length;
		Stylesheet.sheet.insertRule(`${selector} {}`, index);
		let rule = Stylesheet.sheet.rules[index].style;
		return rule;
	}
}
