import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { resolveConcurrently } from "./utils";

const delayedPromise = (value: string, delay: number): Promise<string> =>
  new Promise((resolve) => setTimeout(() => resolve(value), delay));

const ensureOnlyExpectedActionsCalled = (
  allActions: Mock[],
  expectedActionIndexes: Record<number, string>
) => {
  allActions.forEach((action, index) => {
    if (expectedActionIndexes[index]) {
      expect(action).toHaveBeenCalledWith(expectedActionIndexes[index]);
    } else {
      expect(action).not.toHaveBeenCalled();
    }
  });
};

describe("resolveConcurrently", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should resolve all promises in parallel but execute each action immediately", async () => {
    vi.useFakeTimers();
    const mockActions = [vi.fn(), vi.fn(), vi.fn(), vi.fn(), vi.fn()];

    const pendingPromises = resolveConcurrently([
      { promise: delayedPromise("33", 30), action: mockActions[0] },
      { promise: delayedPromise("55", 50), action: mockActions[1] },
      { promise: delayedPromise("11", 10), action: mockActions[2] },
      { promise: delayedPromise("44", 40), action: mockActions[3] },
      { promise: delayedPromise("22", 20), action: mockActions[4] },
    ]);

    // Before any time passes, nothing should have executed
    const calledActions: Record<number, string> = {};
    ensureOnlyExpectedActionsCalled(mockActions, calledActions);

    // After 10ms, only the 10ms promise should have triggered
    await vi.advanceTimersByTimeAsync(10);
    calledActions[2] = "11";
    ensureOnlyExpectedActionsCalled(mockActions, calledActions);

    // After 20ms, the 20ms promise should also have been triggered
    await vi.advanceTimersByTimeAsync(10);
    calledActions[4] = "22";
    ensureOnlyExpectedActionsCalled(mockActions, calledActions);

    // After 30ms, the 30ms promise should also have been triggered
    await vi.advanceTimersByTimeAsync(10);
    calledActions[0] = "33";
    ensureOnlyExpectedActionsCalled(mockActions, calledActions);

    // After 40ms, the 40ms promise should also have been triggered
    await vi.advanceTimersByTimeAsync(10);
    calledActions[3] = "44";
    ensureOnlyExpectedActionsCalled(mockActions, calledActions);

    // After 50ms, all the promises should have been triggered
    await vi.advanceTimersByTimeAsync(10);
    calledActions[1] = "55";
    // Ensure calledActions contains all the actions (test the test)
    expect(calledActions).toEqual({
      2: "11",
      4: "22",
      0: "33",
      3: "44",
      1: "55",
    });
    ensureOnlyExpectedActionsCalled(mockActions, calledActions);

    // Check all the actions were called and in the expected order
    expect(mockActions[2]).toHaveBeenCalledWith("11");
    expect(mockActions[2]).toHaveBeenCalledBefore(mockActions[4]);
    expect(mockActions[4]).toHaveBeenCalledWith("22");
    expect(mockActions[4]).toHaveBeenCalledBefore(mockActions[0]);
    expect(mockActions[0]).toHaveBeenCalledWith("33");
    expect(mockActions[0]).toHaveBeenCalledBefore(mockActions[3]);
    expect(mockActions[3]).toHaveBeenCalledWith("44");
    expect(mockActions[3]).toHaveBeenCalledBefore(mockActions[1]);
    expect(mockActions[1]).toHaveBeenCalledWith("55");

    // Clean up and ensure the overall promise settles
    await vi.runAllTimersAsync();
    await pendingPromises;
    vi.useRealTimers();
  });
});
