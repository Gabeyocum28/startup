const http = require('http');
const { app, attachWebSocket } = require('./app');

const port = process.env.PORT || (process.argv.length > 2 ? process.argv[2] : 4000);

const server = http.createServer(app);
attachWebSocket(server);

server.listen(port, () => {
  console.log(`Polyrhythmd service listening on port ${port}`);
});

for (const sig of ['SIGTERM', 'SIGINT']) {
  process.on(sig, () => {
    console.log(`${sig} received, shutting down`);
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 5000).unref();
  });
}
