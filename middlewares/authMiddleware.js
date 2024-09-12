const { decrypt } = require("../utils/encryption");

function authenticateSocket(ws, req, next) {
  try {
    const { encryptedSecretKey, iv } = req; // Extract from WebSocket request
    const decryptedKey = decrypt(encryptedSecretKey, iv);

    // Compare the decrypted key with your valid secret key
    if (decryptedKey === process.env.SECRET_KEY) {
      return next(); // Proceed to the next step
    }

    ws.close(4001, "Unauthorized");
  } catch (error) {
    ws.close(4002, "Authentication Error");
    console.error("Authentication failed:", error);
  }
}

module.exports = { authenticateSocket };
