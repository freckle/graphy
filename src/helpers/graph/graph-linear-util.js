/* @flow */

import {getClosestStepPoint} from './../graph-util.js'
import type {GraphSettingsT, PointT, GraphPropertiesT} from './../graph-util.js'

const GraphLinearUtil = {

  createGraph: function(graph: any, onPointChanged: (movingPoint: ?PointT, graphProperties: GraphPropertiesT) => void, graphSettings: GraphSettingsT) {

    graph.createCircle('points', graphSettings.startingPoints[0], graphSettings.pointRadius, graphSettings.pointColors[0])
    graph.createCircle('points', graphSettings.startingPoints[1], graphSettings.pointRadius, graphSettings.pointColors[1])

    graph.linearEquation.updateFunction()

    const moveAndUpdate = function(movedPoint: PointT, points: Array<PointT>) {
      const stepPoint = getClosestStepPoint(movedPoint, graphSettings)
      const hasMoved = graph.linearEquation.moveDraggedItemAt(stepPoint)
      if (hasMoved) {
        const graphProperties =
          { graphType: 'linear'
          , property: { points }
          }
        onPointChanged(stepPoint, graphProperties)
        graph.linearEquation.updateFunction()
      }
    }

    const onMouseDown = function(movedPoint: PointT, points: Array<PointT>) {
      graph.linearEquation.startDraggingItemAt(movedPoint)
      moveAndUpdate(movedPoint, points)
    }
    const onMouseMove = function(movedPoint: PointT, points: Array<PointT>) {
      moveAndUpdate(movedPoint, points)
    }
    const onMouseUp = function(movedPoint: PointT, points: Array<PointT>) {
      moveAndUpdate(movedPoint, points)
      graph.linearEquation.stopDraggigItem()
    }

    graph.linearEquation.setDraggable(onMouseDown, onMouseMove, onMouseUp)
  }
}
export default GraphLinearUtil
