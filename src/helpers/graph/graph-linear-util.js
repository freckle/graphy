/* @flow */

import _ from "lodash";

import { getClosestStepPoint } from "./../graph-util.js";

import type {
  GraphSettingsT,
  PointT,
  GraphPropertiesT,
} from "./../graph-util.js";

const GraphLinearUtil = {
  createGraph: function (
    graph: any,
    onPointChanged: (
      movingPoint: ?PointT,
      graphProperties: GraphPropertiesT
    ) => void,
    graphSettings: GraphSettingsT
  ) {
    graph.linearEquation.updateFunction();

    const moveAndUpdate = function (movedPoint: PointT, points: Array<PointT>) {
      const stepPoint = getClosestStepPoint(movedPoint, graphSettings);
      const stepPoints: Array<PointT> = _.map(points, (point) =>
        getClosestStepPoint(point, graphSettings)
      );
      const hasMoved = graph.linearEquation.moveDraggedItemAt(stepPoint);
      if (hasMoved) {
        const graphProperties = {
          graphType: "linear",
          property: { points: stepPoints },
        };
        onPointChanged(stepPoint, graphProperties);
        graph.linearEquation.updateFunction();
      }
    };

    const onMouseDown = function (movedPoint: PointT, points: Array<PointT>) {
      graph.linearEquation.startDraggingItemAt(movedPoint);
      moveAndUpdate(movedPoint, points);
    };
    const onMouseMove = function (movedPoint: PointT, points: Array<PointT>) {
      moveAndUpdate(movedPoint, points);
    };
    const onMouseUp = function (movedPoint: PointT, points: Array<PointT>) {
      moveAndUpdate(movedPoint, points);
      graph.linearEquation.stopDraggingItem();
    };

    if (graphSettings.canInteract)
      graph.linearEquation.setDraggable(onMouseDown, onMouseMove, onMouseUp);
  },
};
export default GraphLinearUtil;
