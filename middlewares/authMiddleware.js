const { decrypt } = require("../utils/encryption");

const userSockets = {}; // Maps userId to WebSocket connections

function authenticateSocket(ws, req, next) {
  try {
    const { encryptedSecretKey, iv, authTag, userId } = req; // Extract from WebSocket request
    const decryptedKey = decrypt(encryptedSecretKey, iv, authTag);

    // Compare the decrypted key with your valid secret key
    if (decryptedKey === process.env.SECRET_KEY) {
      ws.userId = userId;
      userSockets[userId] = ws;

      ws.on("close", () => {
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
