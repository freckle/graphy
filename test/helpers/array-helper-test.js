/* @flow */

import { describe, it } from 'mocha'
import {assert, expect} from 'chai'

import {getArrayOfNElements} from './../../src/helpers/array-helper.js'

describe("getArrayOfNElements", function() {

  it("it should throw an error when passing an empty array", function() {
    expect(getArrayOfNElements([], 2)).to.throw(Error)
  })

  it("it should return empty array when 0 is passed", function() {
    const res = getArrayOfNElements(["foo"], 0)
    assert.isOk(res)
    assert.isArray(res)
    assert.strictEqual(res.length, 0)
  })

  it("it should return array of n elements when n < array length", function() {
    const res = getArrayOfNElements(["foo", "bar"], 1)
    assert.isOk(res)
    assert.isArray(res)
    assert.strictEqual(res.length, ["foo"])
  })

  it("it should return array of n elements n > array length", function() {
    const res = getArrayOfNElements(["foo", "bar"], 3)
    assert.isOk(res)
    assert.isArray(res)
    assert.strictEqual(res.length, ["foo", "bar", "foo"])
  })
})
