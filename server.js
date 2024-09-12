require("dotenv").config();
const WebSocket = require("ws");
const http = require("http");
const { authenticateSocket } = require("./middlewares/authMiddleware");
const { handleSend } = require("./controllers/handleSend");

const server = http.createServer();
const wss = new WebSocket.Server({ server });

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
