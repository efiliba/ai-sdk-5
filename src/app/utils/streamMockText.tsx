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

export const streamMockText = async (
  onDelta: (delta: string, accumulatedText: string) => void
) => {
  const stream = createStream(textGenerator());
  const reader = stream.getReader();

  let done = false;
  let accumulatedText = "";
  while (!done) {
    const { value, done: isDone } = await reader.read();
    done = isDone;

    if (!done) {
      accumulatedText += value;
      onDelta(value, accumulatedText);
    }

    await sleep(1000);
  }
};
