const userSockets = {};

function handleAssignTask(ws, payload) {
  try {
    const { action, toUserId, data } = JSON.parse(payload);

    if (action === "accept_task" && toUserId && data) {
      const recipientSocket = userSockets[toUserId];
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

module.exports = { handleAssignTask };
