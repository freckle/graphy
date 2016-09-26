/* @flow */

import {getClosestStepPoint} from './../graph-util.js'
import {getArrayOfNElements} from './../array-helper.js'
import type {GraphSettingsT, PointT, GraphPropertiesT, QuadraticGraphPropertyT} from './../graph-util.js'

const GraphQuadraticUtil = {

  createGraph: function(graph: any, onPointChanged: (movingPoint: ?PointT, graphProperties: GraphPropertiesT) => void, graphSettings: GraphSettingsT) {

    const [vertexColor, pointColor] = getArrayOfNElements(graphSettings.pointColors, 2)
    graph.createCircle('vertex', graphSettings.startingPoints[0], graphSettings.pointSize, vertexColor)
    graph.createCircle('point', graphSettings.startingPoints[1], graphSettings.pointSize, pointColor)

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
      graph.quadraticEquation.stopDraggingItem()
    }

    graph.quadraticEquation.setDraggable(onMouseDown, onMouseMove, onMouseUp)
  }
}

export default GraphQuadraticUtil
