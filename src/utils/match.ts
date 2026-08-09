/**
 * PHP like match function
 * @param conditions - Array of [condition, value]
 * @returns Value of first met condition
 * @example
 * ```tsx
 * const value = match(
 *  [condition1, value1],
 *  [condition2, value2],
 *  [condition3, value3],
 *  [true, defaultValue]
 * );
 */
export function match<T>(...conditions: Array<[boolean, T]>): T {
  const found =
    conditions.find(([condition]) => condition) ?? conditions.at(-1);
  if (!found) {
    throw new Error("No conditions have been met");
  }
  return found[1];
}
