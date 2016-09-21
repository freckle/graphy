/* @flow */

import {getClosestStepPoint} from './../graph-util.js'
import type {GraphSettingsT, PointT, GraphPropertiesT, SideT, DottingT} from './../graph-util.js'

const GraphLinearUtil = {

  createGraph: function(graph: any, onPointChanged: (movingPoint: ?PointT, graphProperties: GraphPropertiesT) => void, graphSettings: GraphSettingsT) {

    graph.createCircle('points', graphSettings.startingPoints[0], graphSettings.pointRadius, graphSettings.pointColors[0])
    graph.createCircle('points', graphSettings.startingPoints[1], graphSettings.pointRadius, graphSettings.pointColors[1])

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
      graph.linearEquationInequality.stopDraggigItem()
    }

    graph.linearEquationInequality.setDraggable(onMouseDown, onMouseMove, onMouseUp)
  }
}
export default GraphLinearUtil
