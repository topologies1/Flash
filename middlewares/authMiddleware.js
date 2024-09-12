const { decrypt } = require("../utils/encryption");
const url = require("url");

const userSockets = {}; // Maps userId to WebSocket connections

function authenticateSocket(ws, req, next) {
  const queryParams = url.parse(req.url, true).query;
  try {
    const { encryptedSecretKey, iv, authTag, userId } = queryParams; // Extract from WebSocket request

    if (!encryptedSecretKey || !iv || !authTag || !userId) {
      ws.close(4001, "Unauthorized");
      return;
    }

    const decryptedKey = decrypt(encryptedSecretKey, iv, authTag);

    // Compare the decrypted key with your valid secret key
    if (decryptedKey === process.env.SECRET_KEY) {
      if (ws.userId !== userId && !userSockets[userId]) {
        ws.userId = userId;
        userSockets[userId] = ws;
      }

      ws.on("close", () => {
        console.log(`Connection closed for user ${ws.userId}`);
        delete userSockets[userId];
      });

      return next(userSockets); // Proceed to the next step
    }

    ws.close(4001, "Unauthorized");
  } catch (error) {
    ws.close(4002, "Authentication Error");
    console.error("Authentication failed:", error);
  }
}

module.exports = { authenticateSocket };
