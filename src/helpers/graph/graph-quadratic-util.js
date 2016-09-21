/* @flow */

import {getClosestStepPoint} from './../graph-util.js'
import type {GraphSettingsT, PointT, GraphPropertiesT, QuadraticGraphPropertyT} from './../graph-util.js'

const GraphQuadraticUtil = {

  createGraph: function(graph: any, onPointChanged: (movingPoint: ?PointT, graphProperties: GraphPropertiesT) => void, graphSettings: GraphSettingsT) {

    graph.createCircle('vertex', graphSettings.startingPoints[0], graphSettings.pointRadius, graphSettings.pointColors[0])
    graph.createCircle('point', graphSettings.startingPoints[1], graphSettings.pointRadius, graphSettings.pointColors[1])

    graph.quadraticEquation.updateFunction()

    const moveAndUpdate = function(movedPoint: PointT, {vertex, point}: QuadraticGraphPropertyT) {
      const stepPoint = getClosestStepPoint(movedPoint, graphSettings)
      const hasMoved = graph.quadraticEquation.moveDraggedItemAt(stepPoint)
      if (hasMoved) {
        const graphProperties =
          { graphType: 'linear-inequality'
          , property:
            { vertex
            , point
            }
          }
        onPointChanged(stepPoint, graphProperties)
        graph.quadraticEquation.updateFunction()
      }
    }

    const onMouseDown = function(point: PointT, points: QuadraticGraphPropertyT) {
      graph.quadraticEquation.startDraggingItemAt(point)
      moveAndUpdate(point, points)
    }
    const onMouseMove = function(point: PointT, points: QuadraticGraphPropertyT) {
      moveAndUpdate(point, points)
    }
    const onMouseUp = function(point: PointT, points: QuadraticGraphPropertyT) {
      moveAndUpdate(point, points)
      graph.quadraticEquation.stopDraggigItem()
    }

    graph.quadraticEquation.setDraggable(onMouseDown, onMouseMove, onMouseUp)
  }
}

export default GraphQuadraticUtil
