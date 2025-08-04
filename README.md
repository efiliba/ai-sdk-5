# AI Chat Application

This is a Next.js application that demonstrates how to use the AI SDK with streaming chat functionality.

## Features

- Real-time streaming chat
- Message persistence
- Auto-resume functionality
- Custom transport configuration

## How to use `prepareReconnectToStreamRequest`

The `prepareReconnectToStreamRequest` function is part of the `DefaultChatTransport` configuration in the AI SDK. It allows you to customize the request when the AI SDK attempts to reconnect to an existing stream.

### Basic Usage

```typescript
import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";

const { messages, sendMessage } = useChat({
  id: chatId,
  transport: new DefaultChatTransport({
    // Configure how to send new messages
    prepareSendMessagesRequest({ messages }) {
      return {
        body: {
          chatId,
          firstChat: messages.length === 1,
          message: messages.at(-1),
        },
      };
    },
    // Configure how to reconnect to existing streams
    prepareReconnectToStreamRequest({ id }) {
      return {
        api: `/api/chat?chatId=${id}`,
        headers: {
          "Content-Type": "application/json",
        },
      };
    },
  }),
});
```

### Function Parameters

The `prepareReconnectToStreamRequest` function receives an object with the following properties:

- `id`: The chat ID (string)
- `requestMetadata`: Custom metadata passed to the request
- `body`: The request body object
- `credentials`: Request credentials
- `headers`: HTTP headers
- `api`: The API endpoint

### Return Value

The function should return an object with:

- `headers?`: Optional HTTP headers to include in the reconnection request
- `credentials?`: Optional request credentials
- `api?`: Optional custom API endpoint

### Example with Custom Headers

```typescript
prepareReconnectToStreamRequest({ id, headers }) {
  return {
    api: `/api/chat?chatId=${id}`,
    headers: {
      ...headers,
      'X-Custom-Header': 'reconnect',
      'Authorization': `Bearer ${getAuthToken()}`,
    },
  };
}
```

### Example with Different API Endpoint

```typescript
prepareReconnectToStreamRequest({ id }) {
  return {
    api: `/api/chat/resume?chatId=${id}&timestamp=${Date.now()}`,
    headers: {
      'Content-Type': 'application/json',
    },
  };
}
```

## API Routes

The application includes API routes that handle both POST (new messages) and GET (reconnection) requests:

- `POST /api/chat`: Handles new message submissions
- `GET /api/chat?chatId=...`: Handles reconnection requests

## Getting Started

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Set up environment variables:

   ```bash
   cp .env.example .env.local
   ```

3. Run the development server:

   ```bash
   pnpm dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.
