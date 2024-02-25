const domParser = new DOMParser()

const collections = [
	"Assets",
	"Templates",
	"Grid",
	"View",
	"Gradient",
	"Shadows",
	"TextShadow",
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
	let isCollection = collections.includes(xml.nodeName)
	let data = []
	data.tagName = xml.tagName

	let isText = xml.nodeType === 3,
		isElement = xml.nodeType === 1,
		body = xml.textContent && xml.textContent.trim(),
		hasChildren = xml.children && xml.children.length,
		hasAttributes = xml.attributes && xml.attributes.length

	// if it's text, just return it
	if (isText) { return xml.nodeValue.trim() }

	// if it doesn't have any children or attributes, just return the contents
	if (!hasChildren && !hasAttributes) { return data }

	// if it doesn't have children but _does_ have body content, use that
	if (!hasChildren && body.length) { data.text = body }

	// if it's an element with attributes, add them to data.attributes
	if (isElement && hasAttributes) {
		for (let attribute of xml.attributes) {
			// also convert kebab case to camel case
			data[attribute.name.replace(/-(\w)/, (m, s) => s.toUpperCase())] = parseNumber(attribute.value)
		}
	}

	if (xml.nodeName === 'Action' && xml.attributes.getNamedItem('type').value == 'macro') {
		data.action = []
	}
	
	// recursively call #parse over children, adding results to data
	for (let child of xml.children) {
		let nodeName = child.nodeName
		let childData = parse(child)
		if (isCollection && (xml.nodeName !== 'Grid' || nodeName === 'View')) {
			// certain predetermined tags gets their children populated in an array
			data.push(childData)
		} else if (xml.nodeName === 'Action' && xml.attributes.getNamedItem('type').value == 'macro') {
			data.action.push(childData)
		} else {
			// the rest gets added as properties
			data[firstCharLowerCase(nodeName)] = childData
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
