import { UIMessageStreamWriter } from "ai";

import { Message } from "@/types";

const words = [
  "Hello ",
  "world! ",
  "This ",
  "is a ",
  "test ",
  "of ",
  "streaming ",
  "text\n",
  "without ",
  "using ",
  "an ",
  "LLM ",
  "model. ",
  "Just ",
  "simple ",
  "text ",
  "generation.",
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function* generateText() {
  for (let i = 0; i < words.length; i++) {
    await sleep(50);
    yield words[i];
  }
}

// Wraps a generator into a ReadableStream
const createStream = (iterator: AsyncGenerator<string>) =>
  new ReadableStream({
    // Controls the speed of the stream, even if the generator produces values faster (Back-pressure)
    async pull(controller) {
      const { value, done } = await iterator.next();

      if (done) {
        controller.close();
      } else {
        controller.enqueue(value);
      }
    },
  });

export const generateStream = async (
  writer: UIMessageStreamWriter<Message>,
  onDelta?: (delta: string) => void
) => {
  writer.write({
    id: "new-msg-id",
    type: "text-start",
  });

  const stream = createStream(generateText());
  const reader = stream.getReader();

  let done = false;
  while (!done) {
    const { value, done: isDone } = await reader.read();
    done = isDone;

    if (!done) {
      writer.write({
        id: "new-msg-id",
        type: "text-delta",
        delta: value,
      });
      
      // Call the callback if provided
      if (onDelta) {
        onDelta(value);
      }
    }

    await sleep(200);
  }

  writer.write({
    id: "new-msg-id",
    type: "text-end",
  });
};
