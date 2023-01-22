/* @flow */

import _ from "lodash";

import { getClosestStepPoint } from "./../graph-util.js";

import type {
  GraphSettingsT,
  PointT,
  GraphPropertiesT,
} from "./../graph-util.js";

const GraphScatterPointsUtil = {
  createGraph: function (
    graph: any,
    onPointChanged: (
      movingPoint: ?PointT,
      graphProperties: GraphPropertiesT
    ) => void,
    graphSettings: GraphSettingsT
  ) {
    const moveAndUpdate = function (movedPoint: PointT, points: Array<PointT>) {
      const stepPoint = getClosestStepPoint(movedPoint, graphSettings);
      const stepPoints: Array<PointT> = _.map(points, (point) =>
        getClosestStepPoint(point, graphSettings)
      );
      const hasMoved = graph.scatterPoints.moveDraggedItemAt(stepPoint);
      if (hasMoved) {
        const graphProperties = {
          graphType: "scatter-points",
          property: { points: stepPoints },
        };

        onPointChanged(stepPoint, graphProperties);
      }
    };

    const onMouseDown = function (movedPoint: PointT, points: Array<PointT>) {
      graph.scatterPoints.startDraggingItemAt(movedPoint, false);
      moveAndUpdate(movedPoint, points);
    };
    const onMouseMove = function (movedPoint: PointT, points: Array<PointT>) {
      moveAndUpdate(movedPoint, points);
    };
    const onMouseUp = function (movedPoint: PointT, points: Array<PointT>) {
      moveAndUpdate(movedPoint, points);
      graph.scatterPoints.stopDraggingItem();
    };
    const onKeyDown = function(point: PointT, points: Array<PointT>) {
      graph.scatterPoints.startDraggingItemAt(point, true);
      moveAndUpdate(point, points);
    };
    if (graphSettings.canInteract)
      graph.scatterPoints.setDraggable(onMouseDown, onMouseMove, onMouseUp, onKeyDown);
  },
};

export default GraphScatterPointsUtil;
