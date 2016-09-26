/* @flow */

import _ from 'lodash'

export function getArrayOfNElements<T>(arr: Array<T>, n: number): Array<T> {
  if (n === 0) {
    return []
  }
  if (arr.length === 0) {
    throw new Error("getArrayOfNElements: Could not create a n element array with an empty array")
  }
  return _.map(_.range(n), i => arr[i % arr.length])
}
