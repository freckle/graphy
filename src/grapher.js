/* @flow */

import React from 'react'
import _ from 'lodash'

import GraphUtil from './helpers/graph-util.js'
import type {GraphSettingsT, PointT, GraphTypeT, GraphPropertiesT} from './helpers/graph-util.js'

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

type GrapherProps =
  { onPointChanged: (movingPoint: ?PointT, graphProperties: GraphPropertiesT) => void
  , graphType: GraphTypeT
  , minGridX?: number
  , maxGridX?: number
  , minGridY?: number
  , maxGridY?: number
  , stepX?: number
  , stepY?: number
  , pointSize?: number
  , pointColors?: Array<string>
  }

const getGraphSetting = function(grapherProps: GrapherProps): GraphSettingsT {
  const minGridX = grapherProps.minGridX ? grapherProps.minGridX: defaultMinGridX
  const maxGridX = grapherProps.maxGridX ? grapherProps.maxGridX : defaultMaxGridX
  const minGridY = grapherProps.minGridY ? grapherProps.minGridY : defaultMinGridY
  const maxGridY = grapherProps.maxGridY ? grapherProps.maxGridY : defaultMaxGridY
  const stepX = grapherProps.stepX ? grapherProps.stepX : defaultStepX
  const stepY = grapherProps.stepY ? grapherProps.stepY : defaultStepY
  const pointSize = grapherProps.pointSize ? grapherProps.pointSize : defaultPointSize
  const pointColors =
    grapherProps.pointColors && !_.isEmpty(grapherProps.pointColors) ?
      grapherProps.pointColors :
      defaultPointColors

  const baseGraphSettings =
    { minGridX
    , maxGridX
    , minGridY
    , maxGridY
    , stepX
    , stepY
    , pointSize
    , pointColors
    }

  switch (grapherProps.graphType) {
    case 'linear': {
      const startingPoints =
        [ { x: -1, y: -1}
        , { x: 1, y: 1}
        ]
      return _.extend({}, baseGraphSettings, {startingPoints})
    }
    case 'linear-inequality': {
      const startingPoints =
        [ { x: -1, y: -1}
        , { x: 1, y: 1}
        ]
      const side = "lessThan"
      const dotting = "plain"
      return _.extend({}, baseGraphSettings, {startingPoints}, {side}, {dotting})
    }
    case 'quadratic': {
      const startingPoints =
        [ { x: 0, y: 0}
        , { x: 5, y: 5}
        ]
      return _.extend({}, baseGraphSettings, {startingPoints})
    }
    case 'exponential': {
      const startingPoints =
        [ { x: 0, y: 1}
        , { x: 2, y: 4}
        ]
      return _.extend({}, baseGraphSettings, {startingPoints})
    }
    case 'scatter-points': {
      const startingPoints =
        [ { x: 0, y: 0}
        , { x: 0, y: 0}
        , { x: 0, y: 0}
        , { x: 0, y: 0}
        , { x: 0, y: 0}
        ]
      return _.extend({}, baseGraphSettings, {startingPoints})
    }
    default:
      throw new Error (`Could not recognize graph type: ${grapherProps.graphType}`)
  }
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
