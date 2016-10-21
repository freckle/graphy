/* @flow */

export function fromMaybe<T>(defaultValue: T, t: ?T): T {
  return t === null || t === undefined ? defaultValue : t
}

export function fromMaybeNonEmpty<T>(defaultValue: Array<T>, t: ?Array<T>): Array<T> {
  return t === null || t === undefined || t.length === 0 ? defaultValue : t
}