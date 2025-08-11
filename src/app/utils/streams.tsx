import type { UIMessageChunk, UIMessageStreamWriter } from "ai";

import type { Message } from "@/types";

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

async function* textGenerator() {
  for (let i = 0; i < words.length; i++) {
    await sleep(50);
    yield words[i];
  }
}

// Wraps a generator into a ReadableStream
const createStream = <T,>(iterator: AsyncGenerator<T>) =>
  new ReadableStream<T>({
    // async start(controller) {
    //   for await (const v of iterator) { // Eager for-loop - runs as fast as possible and no way to stop producing
    //     controller.enqueue(v);
    //   }
    //   controller.close();
    // },

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

export const streamMockText = async (
  writer: UIMessageStreamWriter<Message>
) => {
  writer.write({
    id: "mock-text",
    type: "text-start",
  });

  const stream = createStream(textGenerator());
  const reader = stream.getReader();

  let done = false;
  while (!done) {
    await sleep(1000);
    const { value, done: isDone } = await reader.read();
    done = isDone;

    if (done) {
      break;
    }

    writer.write({
      id: "mock-text",
      type: "text-delta",
      delta: value!,
    });
  }

  writer.write({
    id: "mock-text",
    type: "text-end",
  });
};

export const convertToReadableStringStream = (
  stream: ReadableStream<Uint8Array>
) =>
  new ReadableStream<string>({
    start(controller) {
      const reader = stream.getReader();
      const decoder = new TextDecoder();

      async function pump() {
        const { value, done } = await reader.read();

        if (done) {
          controller.close();
          return;
        }

        controller.enqueue(decoder.decode(value, { stream: true }));
        return pump();
      }

      return pump();
    },
  });
