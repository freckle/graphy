/* @flow */

import type {PointT} from './../helpers/graph-util.js'

const isPointBelowFunction = function(fn: ((x: number) => number), point: PointT): boolean {
  return fn(point.x) > point.y
}

const isPointCloseToFunction = function(fn: ((x: number) => number), point: PointT, radius: number): boolean {
  return Math.abs(fn(point.x) - point.y) < radius
}

// Linear Function

// y = m * x + b

export type LinearEquationCoefficientT =
  { m: number
  , b: number
  }

const getLinearEquationCoefficients = function(point1: PointT, point2: PointT): LinearEquationCoefficientT {
  const m = (point2.y - point1.y) / (point2.x - point1.x)
  const b = point2.y - m * point2.x
  return { m, b }
}

// y = m * x + b
const getLinearFunction = function(point1: PointT, point2: PointT): ((x: number) => number)  {
  const {m, b} = getLinearEquationCoefficients(point1, point2)
  return (x: number) => m * x + b
}

// Quadratic Function

// We know a quadratic function can be written in its vertex(Vx, Vy) form
// y = a * (x - Vx)^2 + Vy
// And with the point (Px, Py) we can compute a
// a = (Py - Vy) / ((Px - Vx)^2)

export type QuadraticEquationCoefficientT =
  { a: number
  , vx: number
  , vy: number
  }

const getQuadraticEquationCoefficients = function(vertex: PointT, point: PointT): QuadraticEquationCoefficientT {
  const a = (point.y - vertex.y) / Math.pow(point.x - vertex.x,2)
  return (
    { a
    , vx: vertex.x
    , vy: vertex.y
    }
  )
}

// y = a * (x - vx)^2 + vy
const getQuadraticFunction = function(vertex: PointT, point: PointT): ((x: number) => number)  {
  const {a, vx, vy} = getQuadraticEquationCoefficients(vertex, point)
  return (x: number) => a * Math.pow(x - vx, 2) + vy
}

// Exponential Equation

// y = a * b ^ x + c

export type ExponentialEquationCoefficientT =
  { a: number
  , b: number
  , c: number
  }

// y = a * b ^ x + c
const getExponentialEquationCoefficients = function(asymptoteY: number, point1: PointT, point2: PointT): ExponentialEquationCoefficientT {
  const c = asymptoteY
  const a = Math.pow((point2.y - c) / (point1.y - c), (1 / (point2.x - point1.x) * - point1.x)) * (point1.y - c)
  const b = Math.pow((point2.y - c) / (point1.y - c), (1 / (point2.x - point1.x)))
  return (
    { a
    , b
    , c
    }
  )
}

const getExponentialFunction = function(asymptoteY: number, point1: PointT, point2: PointT): ((x: number) => number)   {
  const {a, b, c} = getExponentialEquationCoefficients(asymptoteY, point1, point2)
  return (x: number) => a * Math.pow(b, x) + c
}

export
  { isPointBelowFunction
  , isPointCloseToFunction
  , getLinearFunction
  , getQuadraticFunction
  , getExponentialFunction
  }
