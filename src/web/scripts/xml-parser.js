const domParser = new DOMParser()

const collections = [
	"Assets",
	"Templates",
	"Views",
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
	let data = isCollection ? [] : {}

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
			data[attribute.name.replace(/-(\w)/, (m, s) => s.toUpperCase())] = parseNumber(attribute.value)
		}
	}

	if (xml.nodeName === 'Action' && xml.attributes.getNamedItem('type').value == 'macro') {
		data.action = []
	}
	
	// recursively call #parse over children, adding results to data
	for (let child of xml.children) {
		let nodeName = child.nodeName
		if (isCollection) {
			// certain predetermined tags gets their children populated in an array
			data.push([parse(child), nodeName])
		} else if (xml.nodeName === 'Action' && xml.attributes.getNamedItem('type').value == 'macro') {
			data.action.push(parse(child))
		} else {
			// the rest gets added as properties
			data[firstCharLowerCase(nodeName)] = parse(child)
		}
	}
	
	return data
}

const errorDoc = domParser.parseFromString('INVALID', 'text/xml')
const parsererrorNs = errorDoc.getElementsByTagName("parsererror")[0].namespaceURI

export default function parseXml(xml) {
	let xmlDocument = domParser.parseFromString(xml, 'text/xml')
	let parserErrors = xmlDocument.getElementsByTagNameNS(parsererrorNs, 'parsererror')
	if (parserErrors.length > 0) {
		throw new Error(parserErrors[0].textContent)
	}
	return parse(xmlDocument)
}
