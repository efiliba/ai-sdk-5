export const resolveConcurrently = <T>(
  promisesAndActions: {
    promise: Promise<T>;
    action: (value: T) => void;
  }[]
) =>
  Promise.all(
    promisesAndActions.map(async ({ promise, action }) => action(await promise))
  );
