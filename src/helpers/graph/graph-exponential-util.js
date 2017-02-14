/* @flow */

import _ from 'lodash'

import {getClosestStepPoint} from './../graph-util.js'
import {getArrayOfNElements} from './../array-helper.js'
import type {GraphSettingsT, PointT, GraphPropertiesT} from './../graph-util.js'

const GraphExponentialUtil = {

  createGraph: function(graph: any, onPointChanged: (movingPoint: ?PointT, graphProperties: GraphPropertiesT) => void, graphSettings: GraphSettingsT) {

    const [point1Color, point2Color] = getArrayOfNElements(graphSettings.pointColors, 2)
    graph.createCircle('points', graphSettings.startingPoints[0], graphSettings.pointSize, point1Color)
    graph.createCircle('points', graphSettings.startingPoints[1], graphSettings.pointSize, point2Color)

    graph.exponentialEquation.updateFunction()

    const moveAndUpdate = function(movedPoint: PointT, points: Array<PointT>) {
      const stepPoint = getClosestStepPoint(movedPoint, graphSettings)
      const stepPoints: Array<PointT> = _.map(points, point => getClosestStepPoint(point, graphSettings))
      const hasMoved = graph.exponentialEquation.moveDraggedItemAt(stepPoint)
      if (hasMoved) {
        const graphProperties =
          { graphType: 'exponential'
          , property: { points: stepPoints }
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
      graph.exponentialEquation.stopDraggingItem()
    }

    graph.exponentialEquation.setDraggable(onMouseDown, onMouseMove, onMouseUp)
  }
}

export default GraphExponentialUtil
