/* @flow */

import {getClosestStepPoint} from './../graph-util.js'
import type {GraphSettingsT, PointT, GraphPropertiesT} from './../graph-util.js'

const GraphExponentialUtil = {

  createGraph: function(graph: any, onPointChanged: (movingPoint: ?PointT, graphProperties: GraphPropertiesT) => void, graphSettings: GraphSettingsT) {

    graph.createCircle('points', graphSettings.startingPoints[0], graphSettings.pointRadius, graphSettings.pointColors[0])
    graph.createCircle('points', graphSettings.startingPoints[1], graphSettings.pointRadius, graphSettings.pointColors[1])

    graph.exponentialEquation.updateFunction()

    const moveAndUpdate = function(movedPoint: PointT, points: Array<PointT>) {
      const stepPoint = getClosestStepPoint(movedPoint, graphSettings)
      const hasMoved = graph.exponentialEquation.moveDraggedItemAt(stepPoint)
      if (hasMoved) {
        const graphProperties =
          { graphType: 'exponential'
          , property: { points }
          }
        onPointChanged(stepPoint, graphProperties)
        graph.exponentialEquation.updateFunction()
      }
    }

    const onMouseDown = function(point: PointT, points: Array<PointT>) {
      graph.exponentialEquation.startDraggingItemAt(point)
      moveAndUpdate(point, points)
    }
    const onMouseMove = function(point: PointT, points: Array<PointT>) {
      moveAndUpdate(point, points)
    }
    const onMouseUp = function(point: PointT, points: Array<PointT>) {
      moveAndUpdate(point, points)
      graph.exponentialEquation.stopDraggigItem()
    }

    graph.exponentialEquation.setDraggable(onMouseDown, onMouseMove, onMouseUp)
  }
}

export default GraphExponentialUtil
