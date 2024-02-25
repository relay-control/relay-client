const domParser = new DOMParser()

const CollectionTagNames = [
	'Assets',
	'Templates',
	'Grid',
	'View',
	'Gradient',
	'Shadows',
	'TextShadow',
]

function firstCharLowerCase(str) {
	return str.charAt(0).toLowerCase() + str.slice(1)
}

  // stripPrefix = function(str) {
    // return str.replace(prefixMatch, '')
  // }

  // parseBooleans = function(str) {
    // if (/^(?:true|false)$/i.test(str)) {
      // str = str.toLowerCase() === 'true'
    // }
    // return str
// }

function parseNumber(str) {
	if (!isNaN(str)) {
		str = str % 1 === 0 ? parseInt(str, 10) : parseFloat(str)
	}
	return str
}

function parse(xml) {
	let isCollection = CollectionTagNames.includes(xml.nodeName)
	let data = []
	data.tagName = xml.tagName

	// if it's text, just return it
	if (xml.nodeType === Node.TEXT_NODE) {
		return xml.nodeValue.trim()
	}

	let hasChildren = xml.children?.length
	let hasAttributes = xml.attributes?.length

	// if it doesn't have any children or attributes, just return the contents
	if (!hasChildren && !hasAttributes) {
		return data
	}

	// if it doesn't have children but _does_ have body content, use that
	let body = xml.textContent?.trim()
	if (!hasChildren && body.length) {
		data.text = body
	}

	// if it's an element with attributes, add them to data.attributes
	if (xml.nodeType === Node.ELEMENT_NODE && hasAttributes) {
		for (let attribute of xml.attributes) {
			// also convert kebab case to camel case
			data[attribute.name.replace(/-(\w)/, (m, s) => s.toUpperCase())] = parseNumber(attribute.value)
		}
	}

	if (xml.nodeName === 'Action' && xml.attributes.getNamedItem('type').value == 'macro') {
		data.actions = []
	}

	// recursively call #parse over children, adding results to data
	for (let child of xml.children) {
		let childData = parse(child)
		if (isCollection && (xml.nodeName !== 'Grid' || child.nodeName === 'View')) {
			// certain predetermined tags gets their children populated in an array
			data.push(childData)
		} else if (xml.nodeName === 'Action' && xml.attributes.getNamedItem('type').value == 'macro') {
			data.actions.push(Object.assign({ }, childData))
		} else {
			// the rest gets added as properties
			data[firstCharLowerCase(child.nodeName)] = childData
		}
	}

	return data
}

const CHROMIUM_ERROR_HEADER = 'This page contains the following errors:'
const CHROMIUM_ERROR_FOOTER = 'Below is a rendering of the page up to the first error.'

export default function parseXml(xml) {
	let xmlDocument = domParser.parseFromString(xml, 'text/xml')
	let errorNode = xmlDocument.querySelector('parsererror')
	if (errorNode) {
		let message = errorNode.textContent
		// sourcetext exists on Firefox error views
		let sourceText = errorNode.querySelector('sourcetext')
		if (sourceText) {
			message = errorNode.childNodes[0].textContent
		} else if (errorNode.children.length === 3 &&
			errorNode.children[0].textContent === CHROMIUM_ERROR_HEADER &&
			errorNode.children[2].textContent === CHROMIUM_ERROR_FOOTER) {
			message = errorNode.children[1].textContent
		} else {
			message = errorNode.textContent
		}
		throw new SyntaxError(message)
	}
	return parse(xmlDocument)
}
