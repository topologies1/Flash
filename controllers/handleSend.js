function handleSend(ws, to, payload) {
  try {
    const { data, event } = payload;
    to.send(JSON.stringify({ from: ws.userId, data, event }));
  } catch (error) {
    ws.send(JSON.stringify({ error: "Failed to process message" }));
  }
}

module.exports = { handleSend };
