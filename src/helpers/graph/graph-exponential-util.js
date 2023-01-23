/* @flow */

import _ from "lodash";

import { getClosestStepPoint } from "./../graph-util.js";

import type {
  GraphSettingsT,
  PointT,
  GraphPropertiesT,
} from "./../graph-util.js";

const GraphExponentialUtil = {
  createGraph: function (
    graph: any,
    onPointChanged: (
      movingPoint: ?PointT,
      graphProperties: GraphPropertiesT
    ) => void,
    graphSettings: GraphSettingsT
  ) {
    graph.exponentialEquation.updateFunction();

    const moveAndUpdate = function (movedPoint: PointT, points: Array<PointT>) {
      const stepPoint = getClosestStepPoint(movedPoint, graphSettings);
      const stepPoints: Array<PointT> = _.map(points, (point) =>
        getClosestStepPoint(point, graphSettings)
      );
      const hasMoved = graph.exponentialEquation.moveDraggedItemAt(stepPoint);
      if (hasMoved) {
        const graphProperties = {
          graphType: "exponential",
          property: { points: stepPoints },
        };
        onPointChanged(stepPoint, graphProperties);
        graph.exponentialEquation.updateFunction();
      }
    };

    const onMouseDown = function (point: PointT, points: Array<PointT>) {
      graph.exponentialEquation.startDraggingItemAt(point, false);
      moveAndUpdate(point, points);
    };
    const onMouseMove = function (point: PointT, points: Array<PointT>) {
      moveAndUpdate(point, points);
    };
    const onMouseUp = function (point: PointT, points: Array<PointT>) {
      moveAndUpdate(point, points);
      graph.exponentialEquation.stopDraggingItem();
    };
    const onKeyDown = function(point: PointT, points: Array<PointT>) {
      graph.exponentialEquation.startDraggingItemAt(point, true);
      moveAndUpdate(point, points);
    }

    if (graphSettings.canInteract)
      graph.exponentialEquation.setDraggable(
        onMouseDown,
        onMouseMove,
        onMouseUp,
        onKeyDown
      );
  },
};

export default GraphExponentialUtil;
