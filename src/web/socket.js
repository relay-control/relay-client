const net = require('net')

const client = net.createConnection(8098, () => {
	//'connect' listener
	console.log('connected to server!')
})

client.on('data', (data) => {
	console.log(data.toString())
	client.end()
})

client.on('end', () => {
	console.log('disconnected from server')
})

var RelaySocket = {}

RelaySocket.send = function(button, state) {
	client.write(Buffer.from([button | (state << 7)]))
}
