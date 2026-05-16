
```javascript
const API_KEY = "YOUR_API_SUBSCRIPTION_KEY";
const API_URL = "https://api.sarvam.ai/v1/chat/completions";

async function chatCompletionsStream() {
    const response = await fetch(API_URL, {
        method: "POST",
        headers: {
            "API-Subscription-Key": API_KEY,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
    "model": "sarvam-105b",
    "messages": [
        {
            "role": "user",
            "content": "<YOUR_MESSAGE>"
        }
    ],
    "temperature": 0.8,
    "top_p": 1,
    "max_tokens": 4096,
    "stream": true,
    "reasoning_effort": "medium"
})
    });

    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data:")) continue;
            const data = trimmed.slice(5).trim();
            if (data === "[DONE]") break;

            const chunk = JSON.parse(data);
            const content = chunk.choices[0]?.delta?.content;
            if (content) process.stdout.write(content);
        }
    }

    console.log(); // newline at end
}

chatCompletionsStream();
```
