/* @flow */

import {getClosestStepPoint} from './../graph-util.js'
import {getArrayOfNElements} from './../array-helper.js'
import type {GraphSettingsT, PointT, GraphPropertiesT, SideT, DottingT} from './../graph-util.js'

const GraphLinearInequalityUtil = {

  createGraph: function(graph: any, onPointChanged: (movingPoint: ?PointT, graphProperties: GraphPropertiesT) => void, graphSettings: GraphSettingsT) {

    const [point1Color, point2Color] = getArrayOfNElements(graphSettings.pointColors, 2)
    graph.createCircle('points', graphSettings.startingPoints[0], graphSettings.pointSize, point1Color)
    graph.createCircle('points', graphSettings.startingPoints[1], graphSettings.pointSize, point2Color)

    graph.linearEquationInequality.setSide(graphSettings.side)
    graph.linearEquationInequality.setDotting(graphSettings.dotting)
    graph.linearEquationInequality.updateFunction()

    const moveAndUpdate = function(movedPoint: PointT, points: Array<PointT>, side: SideT, dotting: DottingT) {
      const stepPoint = getClosestStepPoint(movedPoint, graphSettings)
      const hasMoved = graph.linearEquationInequality.moveDraggedItemAt(stepPoint)
      if (hasMoved) {
        const graphProperties =
          { graphType: 'quadratic'
          , property:
            { points
            , side
            , dotting
            }
          }
        onPointChanged(stepPoint, graphProperties)
        graph.linearEquationInequality.updateFunction()
      }
    }

    const onMouseDown = function(movedPoint: PointT, points: Array<PointT>, side: SideT, dotting: DottingT) {
      graph.linearEquationInequality.startDraggingItemAt(movedPoint)
      moveAndUpdate(movedPoint, points, side, dotting)
    }

    const onMouseMove = function(movedPoint: PointT, points: Array<PointT>, side: SideT, dotting: DottingT) {
      moveAndUpdate(movedPoint, points, side, dotting)
    }

    const onMouseUp = function(movedPoint: PointT, points: Array<PointT>, side: SideT, dotting: DottingT) {
      moveAndUpdate(movedPoint, points, side, dotting)
      graph.linearEquationInequality.stopDraggingItem()
    }

    graph.linearEquationInequality.setDraggable(onMouseDown, onMouseMove, onMouseUp)
  }
}
export default GraphLinearInequalityUtil
