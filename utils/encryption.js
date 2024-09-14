const crypto = require("crypto");

function deriveKey(passphrase) {
  return crypto.pbkdf2Sync(passphrase, "salt", 100000, 32, "sha256");
}

const SHARED_KEY = deriveKey(process.env.ENCRYPTION_KEY); // The derived key used for encryption/decryption

// Decrypt function using Node.js crypto module
function decrypt(encryptedData, iv, authTag) {
  // Ensure iv and authTag are Buffers
  const ivBuffer = Buffer.from(iv, "hex");
  const authTagBuffer = Buffer.from(authTag, "hex");
  const encryptedBuffer = Buffer.from(encryptedData, "hex");

  // Create the decipher with AES-256-GCM
  const decipher = crypto.createDecipheriv("aes-256-gcm", SHARED_KEY, ivBuffer);

  // Set the authentication tag for AES-GCM
  decipher.setAuthTag(authTagBuffer);

  // Decrypt the data
  let decrypted = decipher.update(encryptedBuffer, "binary", "utf8");
  decrypted += decipher.final("utf8");

  // Split the decrypted data to get the timestamp and the original secret key
  const [timestamp, secretKey] = decrypted.split(":");

  // Validate timestamp
  const currentUTCTimestamp = Math.floor(new Date().getTime() / 1000);
  if (currentUTCTimestamp - parseInt(timestamp) > 3) {
    return "failed";
  }

  return secretKey;
}

module.exports = { decrypt };
