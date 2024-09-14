require("dotenv").config();
const WebSocket = require("ws");
const http = require("http");
const { authenticateSocket } = require("./middlewares/authMiddleware");
const { handleSend } = require("./controllers/handleSend");

console.log("process.env.ORIGIN: ", process.env.ORIGIN);

const server = http.createServer((req, res) => {
  // Handle CORS for HTTP requests
  res.setHeader("Access-Control-Allow-Origin", process.env.ORIGIN); // Set the allowed origin
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
  } else {
    res.writeHead(404);
    res.end();
  }
});

const wss = new WebSocket.Server({ server });

server.on("upgrade", (request, socket, head) => {
  const origin = request.headers.origin;

  // Check if the origin is allowed
  if (origin !== process.env.ORIGIN) {
    socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
    socket.destroy();
    return;
  }

  // Proceed with WebSocket connection if origin is valid
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});

// Handle WebSocket connection
wss.on("connection", (ws, req) => {
  console.log("New connection");

  authenticateSocket(ws, req, (users) => {
    console.log("User authenticated", ws.userId);
    ws.on("message", (message) => {
      const payload = JSON.parse(message);
      const to = users[payload?.to];
      if (!!to && !!payload?.event && !!payload?.data) {
        handleSend(ws, to, payload);
      } else {
        ws.send(JSON.stringify({ error: "Recipient not available" }));
      }
    });
  });
});

// Start the server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`> Ready on http://localhost:${PORT}`);
});
