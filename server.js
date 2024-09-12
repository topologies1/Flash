require("dotenv").config();
const WebSocket = require("ws");
const http = require("http");
const { authenticateSocket } = require("./middlewares/authMiddleware");
const { handleAcceptIssue } = require("./controllers/handleAcceptIssue");

const server = http.createServer();
const wss = new WebSocket.Server({ server });

// Handle WebSocket connection
wss.on("connection", (ws) => {
  console.log("New connection");

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message); // Parse the incoming message from the client

      if (
        !!data?.encryptedSecretKey &&
        !!data?.iv &&
        !!data?.authTag &&
        !!data?.userId
      ) {
        // Authenticate the socket connection
        authenticateSocket(ws, data, (users) => {
          console.log("User authenticated", ws.userId);

          if (data?.action === "accept_issue") {
            handleAcceptIssue(ws, users, data?.payload);
          }

          ws.on("close", () => {
            console.log(`Connection closed for user ${ws.userId}`);
          });
        });
      } else {
        ws.close(4001, "Invalid message format");
      }
    } catch (err) {
      ws.close(4002, "Error parsing message");
      console.error("Message parsing error:", err);
    }
  });
});

// Start the server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`> Ready on http://localhost:${PORT}`);
});
