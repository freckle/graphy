/* @flow */

import _ from "lodash";

import GraphExponentialUtil from "./graph/graph-exponential-util.js";
import GraphLinearInequalityUtil from "./graph/graph-linear-inequality-util.js";
import GraphLinearUtil from "./graph/graph-linear-util.js";
import GraphQuadraticUtil from "./graph/graph-quadratic-util.js";
import GraphScatterPointsUtil from "./graph/graph-scatter-points-util.js";
import PaperUtil from "./paper-util.js";

export type GraphTypeT =
  | "linear"
  | "linear-inequality"
  | "quadratic"
  | "exponential"
  | "scatter-points"
  | "empty";

export type InequalityT = "lt" | "le" | "gt" | "ge";

export type PointT = {
  x: number,
  y: number,
};

export type GraphSettingsT = {
  minGridX: number,
  maxGridX: number,
  minGridY: number,
  maxGridY: number,
  stepX: number,
  stepY: number,
  startingPoints: Array<PointT>,
  pointColors: Array<string>,
  pointSize: number,
  inequality?: InequalityT,
  showBoundingLabels: ?boolean,
  canInteract: boolean,
  ariaDescribedby?: ?string,
};

export type LinearGraphPropertyT = {
  points: Array<PointT>,
};

export type QuadraticGraphPropertyT = {
  vertex: PointT,
  point: PointT,
};

export type ExponentialGraphPropertyT = {
  points: Array<PointT>,
};

export type LinearInequalityGraphPropertyT = {
  points: Array<PointT>,
  inequality: InequalityT,
};

export type ScatterPointsGraphPropertyT = {
  points: Array<PointT>,
};

type GraphPropertyT =
  | LinearGraphPropertyT
  | QuadraticGraphPropertyT
  | ExponentialGraphPropertyT
  | LinearInequalityGraphPropertyT
  | ScatterPointsGraphPropertyT;

export type GraphPropertiesT = {
  graphType: GraphTypeT,
  property: GraphPropertyT,
};

export function getClosestStepPoint(
  point: PointT,
  graphSettings: GraphSettingsT
): PointT {
  const { stepX, stepY } = graphSettings;
  return {
    x: Math.round(point.x / stepX) * stepX,
    y: Math.round(point.y / stepY) * stepY,
  };
}

const GraphUtil = {
  // This function traces the grid on the canvas based on the graph settings
  createGrid: function (graph: any, graphSettings: GraphSettingsT) {
    const {
      minGridX,
      maxGridX,
      minGridY,
      maxGridY,
      stepX,
      stepY,
      showBoundingLabels,
    } = graphSettings;
    const minXAxisGrid = { x: minGridX, y: 0 };
    const maxXAxisGrid = { x: maxGridX, y: 0 };
    const minYAxisGrid = { x: 0, y: minGridY };
    const maxYAxisGrid = { x: 0, y: maxGridY };
    _.chain(_.range(minGridX, maxGridX, stepX))
      .filter((xLineX) => xLineX !== 0)
      .forEach((xLineX) =>
        graph.createLine(
          "grid",
          { x: xLineX, y: minGridY },
          { x: xLineX, y: maxGridY },
          "#eeeeee"
        )
      )
      .value();

    _.chain(_.range(minGridY, maxGridY, stepY))
      .filter((yLineY) => yLineY !== 0)
      .forEach((yLineY) =>
        graph.createLine(
          "grid",
          { x: minGridX, y: yLineY },
          { x: maxGridX, y: yLineY },
          "#eeeeee"
        )
      )
      .value();

    graph.createLine("grid", minXAxisGrid, maxXAxisGrid, "black");
    graph.createLine("grid", minYAxisGrid, maxYAxisGrid, "black");

    if (showBoundingLabels) {
      // arrived at -4 through trial and error, observing the point where the
      // cutoff from the bottom started
      if (minGridY > -4) {
        graph.createLabel("label", minXAxisGrid, minGridX.toString(), [
          "bottom",
          "left",
        ]);
        graph.createLabel("label", maxXAxisGrid, maxGridX.toString(), [
          "bottom",
          "right",
        ]);
      } else {
        graph.createLabel("label", minXAxisGrid, minGridX.toString(), ["left"]);
        graph.createLabel("label", maxXAxisGrid, maxGridX.toString(), [
          "right",
        ]);
      }
      graph.createTick("tick", maxXAxisGrid, "x");
      graph.createTick("tick", minXAxisGrid, "x");

      graph.createLabel("label", minYAxisGrid, minGridY.toString(), ["bottom"]);
      graph.createTick("tick", minYAxisGrid, "y");

      graph.createLabel("label", maxYAxisGrid, maxGridY.toString(), ["left"]);
      graph.createTick("tick", maxYAxisGrid, "y");
    }
  },

  // This function initialize the canvas with the drawing library,
  // set the grid on the canvas and set the default points for the graph
  setupGraph: function (
    graphType: GraphTypeT,
    canvas: any,
    onPointChanged: (
      movingPoint: ?PointT,
      graphProperties: GraphPropertiesT
    ) => void,
    graphSettings: GraphSettingsT
  ): any {
    const graph = PaperUtil.setupGraph(canvas, graphSettings);

    GraphUtil.createGrid(graph, graphSettings);

    switch (graphType) {
      case "linear":
        GraphLinearUtil.createGraph(graph, onPointChanged, graphSettings);
        break;
      case "linear-inequality":
        GraphLinearInequalityUtil.createGraph(
          graph,
          onPointChanged,
          graphSettings
        );
        break;
      case "quadratic":
        GraphQuadraticUtil.createGraph(graph, onPointChanged, graphSettings);
        break;
      case "exponential":
        GraphExponentialUtil.createGraph(graph, onPointChanged, graphSettings);
        break;
      case "scatter-points":
        GraphScatterPointsUtil.createGraph(
          graph,
          onPointChanged,
          graphSettings
        );
        break;
      case "empty":
        break;
      default:
        throw new Error(
          `Could not recognize graph type: ${this.props.graphType}`
        );
    }
    return graph;
  },
};
export default GraphUtil;
