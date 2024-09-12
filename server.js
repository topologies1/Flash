require("dotenv").config();
const WebSocket = require("ws");
const http = require("http");
const { authenticateSocket } = require("./middlewares/authMiddleware");
const { handleAssignTask } = require("./controllers/assignTaskController");

const server = http.createServer();
const wss = new WebSocket.Server({ server });

// Handle WebSocket connection
wss.on("connection", (ws, req) => {
  console.log("New connection");

  // Authenticate the socket connection
  authenticateSocket(ws, req, () => {
    ws.on("assigntask", (payload) => handleAssignTask(ws, payload));

    ws.on("close", () => {
      console.log(`Connection closed for user ${ws.userId}`);
    });
  });
});

// Start the server
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
