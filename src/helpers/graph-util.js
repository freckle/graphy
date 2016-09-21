/* @flow */

import _ from 'lodash'

import PaperUtil from './paper-util.js'
import GraphLinearUtil from './graph/graph-linear-util.js'
import GraphLinearInequalityUtil from './graph/graph-linear-inequality-util.js'
import GraphQuadraticUtil from './graph/graph-quadratic-util.js'
import GraphExponentialUtil from './graph/graph-exponential-util.js'
import GraphScatterPointsUtil from './graph/graph-scatter-points-util.js'

export type GraphTypeT
  = 'linear'
  | 'linear-inequality'
  | 'quadratic'
  | 'exponential'
  | 'scatter-points'

export type SideT
  = "lessThan"
  | "greaterThan"

export type DottingT
  = "dotted"
  | "plain"


export type PointT =
  { x: number
  , y: number
  }

export type GraphSettingsT =
  { minGridX: number
  , maxGridX: number
  , minGridY: number
  , maxGridY: number
  , stepX: number
  , stepY: number
  , startingPoints: Array<PointT>
  , pointColors: Array<string>
  , pointRadius: number
  , side?: SideT
  , dotting?: DottingT
  }

export type LinearGraphPropertyT =
  { points: Array<PointT> }

export type QuadraticGraphPropertyT =
  { vertex: PointT
  , point: PointT
  }

export type ExponentialGraphPropertyT =
  { points: Array<PointT> }

export type LinearInequalityGraphPropertyT =
  { points: Array<PointT>
  , side: SideT
  , dotting: DottingT
  }

export type ScatterPointsGraphPropertyT =
  { points: Array<PointT> }

type GraphPropertyT
  = LinearGraphPropertyT
  | QuadraticGraphPropertyT
  | ExponentialGraphPropertyT
  | LinearInequalityGraphPropertyT
  | ScatterPointsGraphPropertyT

export type GraphPropertiesT =
  { graphType: GraphTypeT
  , property: GraphPropertyT
  }

export const getClosestStepPoint = function(point: PointT, graphSettings: GraphSettingsT): PointT {
  const {stepX, stepY} = graphSettings
  return (
    { x: Math.ceil(point.x/stepX) * stepX
    , y: Math.ceil(point.y/stepY) * stepY
    }
  )
}

const GraphUtil = {

  createGrid: function(graph: any, graphSettings: GraphSettingsT) {
    const {minGridX, maxGridX, minGridY, maxGridY, stepX, stepY} = graphSettings
    const minXAxisGrid = {x: minGridX, y: 0}
    const maxXAxisGrid = {x: maxGridX, y: 0}
    const minYAxisGrid = {x: 0, y: minGridY}
    const maxYAxisGrid = {x: 0, y: maxGridY}
    _
      .chain(_.range(minGridX, maxGridX, stepX))
      .filter(xLineX => xLineX !== 0)
      .forEach(xLineX =>
        graph.createLine('grid', {x: xLineX, y: minGridY}, {x: xLineX, y: maxGridY}, '#eeeeee')
      )
      .value()

    _
      .chain(_.range(minGridY, maxGridY, stepY))
      .filter(yLineY => yLineY !== 0)
      .forEach(yLineY =>
        graph.createLine('grid', {x: minGridX, y: yLineY}, {x: maxGridX, y: yLineY}, '#eeeeee')
      )
      .value()

    graph.createLine('grid', minXAxisGrid, maxXAxisGrid, 'black')
    graph.createLine('grid', minYAxisGrid, maxYAxisGrid, 'black')
  },

  setupGraph: function(graphType: GraphTypeT, canvas: any, onPointChanged: (movingPoint: ?PointT, graphProperties: GraphPropertiesT) => void, graphSettings: GraphSettingsT) {
    const graph = PaperUtil.setupGraph(canvas, graphSettings)

    GraphUtil.createGrid(graph, graphSettings)

    switch (graphType) {
      case 'linear':
        GraphLinearUtil.createGraph(graph, onPointChanged, graphSettings)
        break
      case 'linear-inequality':
        GraphLinearInequalityUtil.createGraph(graph, onPointChanged, graphSettings)
        break
      case 'quadratic':
        GraphQuadraticUtil.createGraph(graph, onPointChanged, graphSettings)
        break
      case 'exponential':
        GraphExponentialUtil.createGraph(graph, onPointChanged, graphSettings)
        break
      case 'scatter-points':
        GraphScatterPointsUtil.createGraph(graph, onPointChanged, graphSettings)
        break
      default:
        throw new Error (`Could not recognize graph type: ${this.props.graphType}`)
    }
  }
}
export default GraphUtil
