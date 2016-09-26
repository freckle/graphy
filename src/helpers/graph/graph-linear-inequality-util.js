/* @flow */

import {getClosestStepPoint} from './../graph-util.js'
import {getArrayOfNElements} from './../array-helper.js'
import type {GraphSettingsT, PointT, GraphPropertiesT, SideT, StyleT} from './../graph-util.js'

const GraphLinearInequalityUtil = {

  createGraph: function(graph: any, onPointChanged: (movingPoint: ?PointT, graphProperties: GraphPropertiesT) => void, graphSettings: GraphSettingsT) {

    const [point1Color, point2Color] = getArrayOfNElements(graphSettings.pointColors, 2)
    graph.createCircle('points', graphSettings.startingPoints[0], graphSettings.pointSize, point1Color)
    graph.createCircle('points', graphSettings.startingPoints[1], graphSettings.pointSize, point2Color)
    if (!graphSettings.inequality) {
      throw new Error("GraphLinearInequalityUtil.createGraph: graphSettings doesn't contain inequality property")
    }
    const {side, style} = graphSettings.inequality
    graph.linearEquationInequality.setSide(side)
    graph.linearEquationInequality.setStyle(style)
    graph.linearEquationInequality.updateFunction()

    const moveAndUpdate = function(movedPoint: PointT, points: Array<PointT>, side: SideT, style: StyleT) {
      const stepPoint = getClosestStepPoint(movedPoint, graphSettings)
      const hasMoved = graph.linearEquationInequality.moveDraggedItemAt(stepPoint)
      if (hasMoved) {
        const graphProperties =
          { graphType: 'quadratic'
          , property:
            { points
            , side
            , style
            }
          }
        onPointChanged(stepPoint, graphProperties)
        graph.linearEquationInequality.updateFunction()
      }
    }

    const onMouseDown = function(movedPoint: PointT, points: Array<PointT>, side: SideT, style: StyleT) {
      graph.linearEquationInequality.startDraggingItemAt(movedPoint)
      moveAndUpdate(movedPoint, points, side, style)
    }

    const onMouseMove = function(movedPoint: PointT, points: Array<PointT>, side: SideT, style: StyleT) {
      moveAndUpdate(movedPoint, points, side, style)
    }

    const onMouseUp = function(movedPoint: PointT, points: Array<PointT>, side: SideT, style: StyleT) {
      moveAndUpdate(movedPoint, points, side, style)
      graph.linearEquationInequality.stopDraggingItem()
    }

    graph.linearEquationInequality.setDraggable(onMouseDown, onMouseMove, onMouseUp)
  }
}
export default GraphLinearInequalityUtil
