/* @flow */

import _ from 'lodash'
import {getClosestStepPoint} from './../graph-util.js'
import type {GraphSettingsT, PointT, GraphPropertiesT} from './../graph-util.js'

const GraphScatterPointsUtil = {

  createGraph: function(graph: any, onPointChanged: (movingPoint: ?PointT, graphProperties: GraphPropertiesT) => void, graphSettings: GraphSettingsT) {
    _.forEach(graphSettings.startingPoints, (point, i) => {
      graph.createCircle('points', point, graphSettings.pointRadius, graphSettings.pointColors[i])
    })

    const moveAndUpdate = function(movedPoint: PointT, points: Array<PointT>) {
      const stepPoint = getClosestStepPoint(movedPoint, graphSettings)
      const hasMoved = graph.scatterPoints.moveDraggedItemAt(stepPoint)
      if (hasMoved) {
        const graphProperties =
          { graphType: 'scatter-points'
          , property: { points }
          }

        onPointChanged(stepPoint, graphProperties)
      }
    }

    const onMouseDown = function(movedPoint: PointT, points: Array<PointT>) {
      graph.scatterPoints.startDraggingItemAt(movedPoint)
      moveAndUpdate(movedPoint, points)
    }
    const onMouseMove = function(movedPoint: PointT, points: Array<PointT>) {
      moveAndUpdate(movedPoint, points)
    }
    const onMouseUp = function(movedPoint: PointT, points: Array<PointT>) {
      moveAndUpdate(movedPoint, points)
      graph.scatterPoints.stopDraggigItem()
    }

    graph.scatterPoints.setDraggable(onMouseDown, onMouseMove, onMouseUp)
  }
}

export default GraphScatterPointsUtil