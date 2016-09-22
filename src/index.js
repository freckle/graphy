/* @flow */

import React from 'react'
import _ from 'lodash'

import GraphUtil from './helpers/graph-util.js'
import type {GraphSettingsT, PointT, GraphTypeT, GraphPropertiesT} from './helpers/graph-util.js'

const minGridX = -10
const maxGridX = 10
const minGridY = -10
const maxGridY = 10
const stepX = 1
const stepY = 1
const pointRadius = 5
const pointColors =
  [ '#35605A'
  , '#FF9F1C'
  , '#4357AD'
  , '#767522'
  , '#643173'
  ]

const baseGraphSettings =
  { minGridX
  , maxGridX
  , minGridY
  , maxGridY
  , stepX
  , stepY
  , pointRadius
  , pointColors
  }

type GrapherProps =
  { onPointChanged: (movingPoint: ?PointT, graphProperties: GraphPropertiesT) => void
  , graphType: GraphTypeT
  }

const getGraphSetting = function(graphType: GraphTypeT): GraphSettingsT {
  switch (graphType) {
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
      throw new Error (`Could not recognize graph type: ${graphType}`)
  }
}

export default class Grapher extends React.Component<void, GrapherProps, void> {
  static defaultProps: void;
  props: GrapherProps;
  state: void;

  componentDidMount() {
    const canvas = document.getElementById(`graph-${this.props.graphType}-canvas`)
    const graphSettings = getGraphSetting(this.props.graphType)

    GraphUtil.setupGraph(this.props.graphType, canvas, this.props.onPointChanged, graphSettings)
  }

  render() {

    return (
      <canvas id={`graph-${this.props.graphType}-canvas`}>
      </canvas>
    )
  }
}
