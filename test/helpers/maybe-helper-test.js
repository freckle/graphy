/* @flow */

import { describe, it } from 'mocha'
import {assert} from 'chai'

import {fromMaybe, fromMaybeNonEmpty} from './../../src/helpers/maybe-helper.js'

describe("fromMaybe", function() {
  it("it should return null when passing a null value and a null default value", function() {
    assert.strictEqual(fromMaybe(null, null), null)
  })

  it("it should return default value when passing a null value and default value", function() {
    assert.strictEqual(fromMaybe("foo", null), "foo")
  })

  it("it should return default value when passing an undefined value and default value", function() {
    assert.strictEqual(fromMaybe("foo", undefined), "foo")
  })

  it("it should return value when passing a valid value and default value", function() {
    assert.strictEqual(fromMaybe("foo", "bar"), "bar")
  })
})

describe("fromMaybeNonEmpty", function() {
  it("it should return default value array when passing a null value", function() {
    assert.strictEqual(fromMaybeNonEmpty([], null), [])
  })

  it("it should return default value array when passing an undefined value", function() {
    assert.strictEqual(fromMaybeNonEmpty([], undefined), [])
  })

  it("it should return value when passing a non-null value and default value", function() {
    assert.strictEqual(fromMaybeNonEmpty(["bar"], ["foo"]), "foo")
  })
})
