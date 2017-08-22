const net = require('net')

const client = net.createConnection(8098, "192.168.0.202", () => {
	//'connect' listener
	console.log('connected to Relay server!')
})

client.on('data', (data) => {
	console.log(data.toString())
	client.end()
})

client.on('error', (err) => {
	if (err.code === "ECONNREFUSED") console.log("Unable to connect to Relay server")
	console.dir(err)
})

client.on('close', () => {
	console.log('connection to Relay server closed')
})

client.on('end', () => {
	console.log('disconnected from Relay server')
})

var RelaySocket = {}

RelaySocket.send = function(button, state) {
	client.write(Buffer.from([button | (state << 7)]))
}
