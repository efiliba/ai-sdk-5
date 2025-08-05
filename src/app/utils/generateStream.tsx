import { UIMessageStreamWriter } from "ai";

import { Message } from "@/types";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function* integers() {
  let i = 0;
  while (true) {
    await sleep(50);
    yield i++;
  }
}

// Wraps a generator into a ReadableStream
const createStream = (iterator: AsyncGenerator<number>) =>
  new ReadableStream({
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

export const generateStream = async (
  writer: UIMessageStreamWriter<Message>
) => {
  writer.write({
    id: "new-msg-id",
    type: "text-start",
  });

  const stream = createStream(integers());
  const reader = stream.getReader();

  for (let i = 0; i < 20; i++) {
    await sleep(200);
    const { value, done } = await reader.read();

    if (done) {
      break;
    }

    writer.write({
      id: "new-msg-id",
      type: "text-delta",
      delta: `${value}${(value + 1) % 10 === 0 ? "  \n" : " "}`,
    });
  }

  writer.write({
    id: "new-msg-id",
    type: "text-end",
  });
};
