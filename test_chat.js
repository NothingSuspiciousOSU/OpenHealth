const fs = require('fs');
fetch('http://localhost:3000/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    messages: [
      {
        id: "msg1",
        role: "user",
        content: "Hello",
        parts: [{ type: "text", text: "Hello" }]
      },
      {
        id: "msg2",
        role: "assistant",
        content: "",
        parts: [
          {
            type: "tool-convexDatabaseAgent",
            toolCallId: "call_123",
            toolName: "convexDatabaseAgent",
            state: "output-available",
            // missing input!
          }
        ]
      }
    ]
  })
}).then(r => r.text()).then(console.log);
