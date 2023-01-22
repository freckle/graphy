/* @flow */
import { getClosestStepPoint } from "./../graph-util.js";

import type {
  GraphSettingsT,
  PointT,
  GraphPropertiesT,
  QuadraticGraphPropertyT,
} from "./../graph-util.js";

const GraphQuadraticUtil = {
  createGraph: function (
    graph: any,
    onPointChanged: (
      movingPoint: ?PointT,
      graphProperties: GraphPropertiesT
    ) => void,
    graphSettings: GraphSettingsT
  ) {
    graph.quadraticEquation.updateFunction();

    const moveAndUpdate = function (
      movedPoint: PointT,
      { vertex, point }: QuadraticGraphPropertyT
    ) {
      const stepPoint = getClosestStepPoint(movedPoint, graphSettings);
      const hasMoved = graph.quadraticEquation.moveDraggedItemAt(stepPoint);
      if (hasMoved) {
        const graphProperties = {
          graphType: "quadratic",
          property: {
            vertex: getClosestStepPoint(vertex, graphSettings),
            point: getClosestStepPoint(point, graphSettings),
          },
        };
        onPointChanged(stepPoint, graphProperties);
        graph.quadraticEquation.updateFunction();
      }
    };

    const onMouseDown = function (
      point: PointT,
      points: QuadraticGraphPropertyT
    ) {
      graph.quadraticEquation.startDraggingItemAt(point);
      moveAndUpdate(point, points);
    };
    const onMouseMove = function (
      point: PointT,
      points: QuadraticGraphPropertyT
    ) {
      moveAndUpdate(point, points);
    };
    const onMouseUp = function (
      point: PointT,
      points: QuadraticGraphPropertyT
    ) {
      moveAndUpdate(point, points);
      graph.quadraticEquation.stopDraggingItem();
    };

    if (graphSettings.canInteract)
      graph.quadraticEquation.setDraggable(onMouseDown, onMouseMove, onMouseUp);
  },
};

export default GraphQuadraticUtil;
