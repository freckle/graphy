/* @flow */

import React from 'react'
import _ from 'lodash'

import GraphUtil from './helpers/graph-util.js'
import type {GraphSettingsT, PointT, GraphTypeT, GraphPropertiesT} from './helpers/graph-util.js'
import {fromMaybe, fromMaybeNonEmpty} from './helpers/maybe-helper.js'

const defaultMinGridX = -10
const defaultMaxGridX = 10
const defaultMinGridY = -10
const defaultMaxGridY = 10
const defaultStepX = 1
const defaultStepY = 1
const defaultPointSize = 5
const defaultPointColors =
  [ '#35605A'
  , '#FF9F1C'
  , '#4357AD'
  , '#767522'
  , '#643173'
  ]

const getGraphSetting = function(grapherProps: GrapherProps): GraphSettingsT {
  let inequality
  let defaultStartingPoints = []
  switch (grapherProps.graphType) {
    case 'linear':
      defaultStartingPoints =
        [ { x: -1, y: -1}
        , { x: 1, y: 1}
        ]
      break
    case 'linear-inequality':
      defaultStartingPoints =
        [ { x: -1, y: -1}
        , { x: 1, y: 1}
        ]
      inequality = 'lt'
      break
    case 'quadratic':
      defaultStartingPoints =
        [ { x: 0, y: 0}
        , { x: 5, y: 5}
        ]
      break
    case 'exponential':
      defaultStartingPoints =
        [ { x: 0, y: 1}
        , { x: 2, y: 4}
        ]
      break
    case 'scatter-points':
      defaultStartingPoints =
        [ { x: 0, y: 0}
        , { x: 0, y: 0}
        , { x: 0, y: 0}
        , { x: 0, y: 0}
        , { x: 0, y: 0}
        ]
      break
    default:
      throw new Error (`Could not recognize graph type: ${grapherProps.graphType}`)
  }

  const minGridX = fromMaybe(defaultMinGridX, grapherProps.minGridX)
  const maxGridX = fromMaybe(defaultMaxGridX, grapherProps.maxGridX)
  const minGridY = fromMaybe(defaultMinGridY, grapherProps.minGridY)
  const maxGridY = fromMaybe(defaultMaxGridY, grapherProps.maxGridY)
  const stepX = fromMaybe(defaultStepX, grapherProps.stepX)
  const stepY = fromMaybe(defaultStepY, grapherProps.stepY)
  const pointSize = fromMaybe(defaultPointSize, grapherProps.pointSize)
  const pointColors = fromMaybeNonEmpty(defaultPointColors, grapherProps.pointColors)
  const startingPoints = fromMaybeNonEmpty(defaultStartingPoints, grapherProps.startingPoints)

  return (
    { minGridX
    , maxGridX
    , minGridY
    , maxGridY
    , stepX
    , stepY
    , pointSize
    , pointColors
    , inequality
    , startingPoints
    }
  )
}

type GrapherProps =
  { onPointChanged: (movingPoint: ?PointT, graphProperties: GraphPropertiesT) => void
  , graphType: GraphTypeT
  , minGridX?: ?number
  , maxGridX?: ?number
  , minGridY?: ?number
  , maxGridY?: ?number
  , stepX?: ?number
  , stepY?: ?number
  , pointSize?: ?number
  , pointColors?: ?Array<string>
  , startingPoints?: Array<PointT>
  }

export default class Grapher extends React.Component<void, GrapherProps, void> {
  static defaultProps: void;
  props: GrapherProps;
  state: void;

  componentDidMount() {
    const canvas = document.getElementById(`graph-${this.props.graphType}-canvas`)
    const graphSettings = getGraphSetting(this.props)

    GraphUtil.setupGraph(this.props.graphType, canvas, this.props.onPointChanged, graphSettings)
  }

  render() {

    return (
      <canvas
        id={`graph-${this.props.graphType}-canvas`}
        className="graph-canvas"
      >
      </canvas>
    )
  }
}

export type {PointT}
export type {GraphTypeT}
export type {GraphPropertiesT}
