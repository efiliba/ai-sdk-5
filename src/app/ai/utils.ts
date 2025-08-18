import { type UIMessage } from "ai";

export const messageToString = (message: UIMessage) =>
  message.parts.map((part) => (part.type === "text" ? part.text : "")).join("");

export const messagesToString = (messages: UIMessage[]) =>
  messages
    .map(({ parts: [part] }) => (part.type === "text" ? part.text : ""))
    .join("\n");
