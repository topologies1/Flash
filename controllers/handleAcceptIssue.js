function handleAcceptIssue(ws, users, payload) {
  try {
    const { toUserId, data } = JSON.parse(payload);

    if (toUserId && data) {
      const recipientSocket = users[toUserId];
      if (recipientSocket) {
        recipientSocket.send(JSON.stringify({ from: ws.userId, data }));
      } else {
        ws.send(JSON.stringify({ error: "Recipient not available" }));
      }
    }
  } catch (error) {
    ws.send(JSON.stringify({ error: "Failed to process message" }));
  }
}

module.exports = { handleAcceptIssue };
