export const resolveConcurrently = <
  T extends Array<unknown>
>(promisesAndActions: {
  [K in keyof T]: {
    promise: Promise<T[K]>;
    action?: (value: T[K]) => void;
  };
}) =>
  Promise.all(
    promisesAndActions.map(async ({ promise, action = () => {} }) =>
      action(await promise)
    )
  );
