/* @flow */

import _ from "lodash";

import { getClosestStepPoint } from "./../graph-util.js";

import type {
  GraphSettingsT,
  PointT,
  GraphPropertiesT,
  InequalityT,
} from "./../graph-util.js";

const GraphLinearInequalityUtil = {
  createGraph: function (
    graph: any,
    onPointChanged: (
      movingPoint: ?PointT,
      graphProperties: GraphPropertiesT
    ) => void,
    graphSettings: GraphSettingsT
  ) {
    if (!graphSettings.inequality) {
      throw new Error(
        "GraphLinearInequalityUtil.createGraph: graphSettings doesn't contain inequality property"
      );
    }
    graph.linearEquationInequality.setInequality(graphSettings.inequality);
    graph.linearEquationInequality.updateFunction();

    const moveAndUpdate = function (
      movedPoint: PointT,
      points: Array<PointT>,
      inequality: InequalityT,
      setInequality: boolean
    ) {
      const stepPoint = getClosestStepPoint(movedPoint, graphSettings);
      const stepPoints: Array<PointT> = _.map(points, (point) =>
        getClosestStepPoint(point, graphSettings)
      );
      const hasMoved = graph.linearEquationInequality.moveDraggedItemAt(
        stepPoint
      );
      if (hasMoved || setInequality) {
        const graphProperties = {
          graphType: "linear-inequality",
          property: { points: stepPoints, inequality },
        };
        onPointChanged(stepPoint, graphProperties);
        graph.linearEquationInequality.updateFunction();
      }
    };

    const onMouseDown = function (
      movedPoint: PointT,
      points: Array<PointT>,
      inequality: InequalityT
    ) {
      graph.linearEquationInequality.startDraggingItemAt(movedPoint, false);
      moveAndUpdate(movedPoint, points, inequality, true);
    };

    const onMouseMove = function (
      movedPoint: PointT,
      points: Array<PointT>,
      inequality: InequalityT
    ) {
      moveAndUpdate(movedPoint, points, inequality, false);
    };

    const onMouseUp = function (
      movedPoint: PointT,
      points: Array<PointT>,
      inequality: InequalityT
    ) {
      moveAndUpdate(movedPoint, points, inequality, true);
      graph.linearEquationInequality.stopDraggingItem();
    };

    const onKeyDown = function(
      point: PointT, 
      points: Array<PointT>, 
      inequality: InequalityT
    ) {
      graph.linearEquationInequality.startDraggingItemAt(point, true);
      moveAndUpdate(point, points, inequality, true);
    }

    if (graphSettings.canInteract)
      graph.linearEquationInequality.setDraggable(
        onMouseDown,
        onMouseMove,
        onMouseUp,
        onKeyDown
      );
  },
};
export default GraphLinearInequalityUtil;
