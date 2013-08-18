var app = require('./'),
	port = require('./config').port;

app.listen(port);

console.log('Tenn16 running at localhost:' + port);