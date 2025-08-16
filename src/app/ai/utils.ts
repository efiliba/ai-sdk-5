import { type UIMessage } from "ai";

export const messageToString = (message: UIMessage) =>
  message.parts.map((part) => (part.type === "text" ? part.text : "")).join("");
