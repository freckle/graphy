/* @flow */

import paper from 'paper'
import _ from 'lodash'

export type PaperPointT =
  { x: number
  , y: number
  }

import
  { isPointBelowFunction
  , isPointCloseToFunction
  , getLinearFunction
  , getQuadraticFunction
  , getExponentialFunction
  } from './../logic/graph-equations.js'
import type {GraphSettingsT, PointT, InequalityT} from './../helpers/graph-util.js'

// Returns true if there is an item in one of the group close the point passed
const itemsAtPoint = function(point: PointT, groups: Array<any>): boolean {
  const allItems = _
    .chain(groups)
    .map(group => group.children)
    .flatten()
    .value()

  const testCircle = new paper.Path.Circle(point, 10)
  const containing = _.filter(allItems, item => item.bounds.intersects(testCircle.bounds))
  testCircle.remove()
  return containing
}

// Returns the closest item next to the point passed
const pickClosestItem = function(point: PointT, groups: Array<any>): ?mixed {
  const items = itemsAtPoint(point, groups)
  const itemsByDistance = _.sortBy(items, item => item.position.getDistance(point, true))
  return _.first(itemsByDistance)
}

const createLine = function(from: PointT, to: PointT, strokeColor: string): any {
  return new paper.Path.Line(
    { from
    , to
    , strokeColor
    }
  )
}

const createCircle = function(center: PointT, radius: number, fillColor: string): any {
  return new paper.Path.Circle(
    { center
    , radius
    , fillColor
    }
  )
}

// Return the coordinates of the given point in grid coordinates into view coordinates
const fromGridCoordinateToView = function(view: any, gridPoint: PointT, graphSettings: GraphSettingsT): PaperPointT {
  const {minGridX, maxGridX, minGridY, maxGridY} = graphSettings
  const {x, y} = gridPoint
  const viewSize = view.size
  return new paper.Point(
    { x: x * viewSize.width / (maxGridX - minGridX)
    , y: y * viewSize.height / (maxGridY - minGridY)
    }
  )
}

// Return the coordinates of the given point in view coordinates into grid coordinates
const fromViewCoordinateToGrid = function(view: any, viewPoint: PaperPointT, graphSettings: GraphSettingsT): PointT {
  const {minGridX, maxGridX, minGridY, maxGridY} = graphSettings
  const {x, y} = viewPoint
  const viewSize = view.size
  return (
    { x: (maxGridX - minGridX) / viewSize.width * x
    , y: (maxGridY - minGridY) / viewSize.height * y
    }
  )
}

type GroupKeyT
  = 'grid'
  | 'points'
  | 'curve'
  | 'vertex'
  | 'point'
  | 'inequality-side'

const PaperUtil = {

  setupGraph: function(canvas: any, graphSettings: GraphSettingsT): any {
    const initialize = (): any => {
      paper.setup(canvas)

      // Move View to be centered on 0,0 of the Grid which is determined by
      // the GraphSettings (not always the middle of the canvas)
      // To do that we apply a translation to the paper view with the ratio
      // of GridMinX * GridWidth and same for Y axis
      // Because Y axis is inverted (coef -1) to have negative number, the
      // translation has to be based on View Height
      const {minGridX, maxGridX, minGridY, maxGridY} = graphSettings
      const widthGrid = Math.abs(maxGridX) + Math.abs(minGridX)
      const heightGrid = Math.abs(maxGridY) + Math.abs(minGridY)
      const tx = paper.view.size.width * (Math.abs(minGridX) / widthGrid)
      const ty = paper.view.size.height - (paper.view.size.height * (Math.abs(minGridY) / heightGrid))
      paper.view.transform(new paper.Matrix(1,0,0,-1,tx, ty))

      this.groups = {}
      this.groups['grid'] = new paper.Group()
      this.groups['points'] = new paper.Group()
      this.groups['curve'] = new paper.Group()
      this.groups['vertex'] = new paper.Group()
      this.groups['point'] = new paper.Group()
      this.groups['inequality-side'] = new paper.Group()

      paper.view.draw()
      return this
    }

    // Make the conversion from Grid coordinates to view coordinates
    this.fromGridCoordinateToView = (gridPoint: PointT): PointT => {
      return fromGridCoordinateToView(paper.view, gridPoint, graphSettings)
    }

    // Make the conversion from View coordinates to Grid coordinates
    this.fromViewCoordinateToGrid = (paperPoint: PaperPointT): PointT => {
      return fromViewCoordinateToGrid(paper.view, paperPoint, graphSettings)
    }

    this.createLine = (group: GroupKeyT, fromGridPoint: PointT, toGridPoint: PointT, color: string) => {
      const paperFromPoint = this.fromGridCoordinateToView(fromGridPoint)
      const paperToPoint = this.fromGridCoordinateToView(toGridPoint)
      const line = createLine(paperFromPoint, paperToPoint, color)
      this.groups[group].addChild(line)
    }

    this.createCircle = (group: GroupKeyT, centerGridPoint: PointT, radius: number, fillColor: string)=> {
      const paperCenterPoint = this.fromGridCoordinateToView(centerGridPoint)
      const circle = createCircle(paperCenterPoint, radius, fillColor)
      this.groups[group].addChild(circle)
    }

    this.traceCurve = (group: GroupKeyT, fn: ((x: number) => number), minXGridPoint: number, maxXGridPoint: number, stepGridX: number, color: string, isDashed: boolean = false) => {
      const gridRangePoints = _.range(minXGridPoint, maxXGridPoint + stepGridX, stepGridX)
      const paperPoints = _.map(gridRangePoints, x => this.fromGridCoordinateToView({x, y: fn(x)}))
      const path = new paper.Path(paperPoints)
      path.smooth('continuous')
      path.strokeColor = color
      path.dashArray = isDashed ? [10, 5] : []
      this.groups[group].addChild(path)
    }

    this.createShape = (group: GroupKeyT, gridPoints: Array<PointT>, color: any) => {
      const paperPoints = _.map(gridPoints, p => this.fromGridCoordinateToView(p))
      const path = new paper.Path(paperPoints)
      path.closePath()
      path.fillColor = color
      this.groups[group].addChild(path)
    }

    this.getAllPointsInGroup = (group: GroupKeyT): Array<PointT> => {
      return _.map(this.groups[group].children, item => this.fromViewCoordinateToGrid(item.position))
    }

    this.linearEquation = {

      updateFunction: () => {
        this.groups['curve'].removeChildren()
        const [gridPoint1, gridPoint2] = this.getAllPointsInGroup('points')
        const fn = getLinearFunction(gridPoint1, gridPoint2)
        const {minGridX, maxGridX, stepX} = graphSettings
        this.traceCurve('curve', fn, minGridX, maxGridX, stepX, 'blue')
      },

      setDraggable: (onMouseDown, onMouseDrag, onMouseUp) => {
        const pointsTool = new paper.Tool(this.groups['points'])

        pointsTool.onMouseDown = event => {
          onMouseDown(this.fromViewCoordinateToGrid(event.point), this.getAllPointsInGroup('points'))
        }

        pointsTool.onMouseDrag = event => {
          onMouseDrag(this.fromViewCoordinateToGrid(event.point), this.getAllPointsInGroup('points'))
        }

        pointsTool.onMouseUp = event => {
          onMouseUp(this.fromViewCoordinateToGrid(event.point), this.getAllPointsInGroup('points'))
        }
      },

      startDraggingItemAt: (point: PointT) => {
        const paperPoint = this.fromGridCoordinateToView(point)
        this.draggedItem = pickClosestItem(paperPoint, [this.groups['points']])
      },

      moveDraggedItemAt: (point: PointT): boolean => {
        if (this.draggedItem) {
          const paperPoint = this.fromGridCoordinateToView(point)
          this.draggedItem.position = paperPoint
          return true
        }
        return false
      },

      stopDraggingItem: () => {
        if (this.draggedItem) {
          this.draggedItem = null
        }
      }
    }

    this.quadraticEquation = {

      updateFunction: () => {
        this.groups['curve'].removeChildren()
        const {vertex, point} = this.quadraticEquation.getVertexAndPoint()
        const fn = getQuadraticFunction(vertex, point)
        const {minGridX, maxGridX, stepX} = graphSettings
        this.traceCurve('curve', fn, minGridX, maxGridX, stepX, 'blue')
      },

      getVertexAndPoint: () => {
        return (
          { vertex: this.getAllPointsInGroup('vertex')[0]
          , point: this.getAllPointsInGroup('point')[0]
          }
        )
      },

      setDraggable: (onMouseDown, onMouseDrag, onMouseUp) => {
        const pointsTool = new paper.Tool()

        pointsTool.onMouseDown = event => {
          onMouseDown(this.fromViewCoordinateToGrid(event.point), this.quadraticEquation.getVertexAndPoint())
        }

        pointsTool.onMouseDrag = event => {
          onMouseDrag(this.fromViewCoordinateToGrid(event.point), this.quadraticEquation.getVertexAndPoint())
        }

        pointsTool.onMouseUp = event => {
          onMouseUp(this.fromViewCoordinateToGrid(event.point), this.quadraticEquation.getVertexAndPoint())
        }
      },

      startDraggingItemAt: (point: PointT) => {
        const paperPoint = this.fromGridCoordinateToView(point)
        this.draggedItem = pickClosestItem(paperPoint, [this.groups['vertex'], this.groups['point']])
      },

      moveDraggedItemAt: (point: PointT): boolean => {
        if (this.draggedItem) {
          const paperPoint = this.fromGridCoordinateToView(point)
          this.draggedItem.position = paperPoint
          return true
        }
        return false
      },

      stopDraggingItem: () => {
        if (this.draggedItem) {
          this.draggedItem = null
        }
      }
    }

    this.exponentialEquation = {

      updateFunction: () => {
        this.groups['curve'].removeChildren()
        const [gridPoint1, gridPoint2] = this.getAllPointsInGroup('points')
        const exponentialFunction = getExponentialFunction(0, gridPoint1, gridPoint2)
        const {minGridX, maxGridX, stepX} = graphSettings
        this.traceCurve('curve', exponentialFunction, minGridX, maxGridX, stepX, 'blue')
      },

      setDraggable: (onMouseDown, onMouseDrag, onMouseUp) => {
        const pointsTool = new paper.Tool()

        pointsTool.onMouseDown = event => {
          onMouseDown(this.fromViewCoordinateToGrid(event.point), this.getAllPointsInGroup('points'))
        }

        pointsTool.onMouseDrag = event => {
          onMouseDrag(this.fromViewCoordinateToGrid(event.point), this.getAllPointsInGroup('points'))
        }

        pointsTool.onMouseUp = event => {
          onMouseUp(this.fromViewCoordinateToGrid(event.point), this.getAllPointsInGroup('points'))
        }
      },

      startDraggingItemAt: (point: PointT) => {
        const paperPoint = this.fromGridCoordinateToView(point)
        this.draggedItem = pickClosestItem(paperPoint, [this.groups['points']])
      },

      moveDraggedItemAt: (point: PointT): boolean => {
        if (this.draggedItem) {
          const paperPoint = this.fromGridCoordinateToView(point)
          this.draggedItem.position = paperPoint

          // When one of the point of an exponential function crosses the x axis
          // we move the other point to its inverse (x0,y0) => (x0,-y0)
          // This behavior is to prevent moving points to impossible exponential functions
          const otherItem = _.filter(this.groups['points'].children, item => item !== this.draggedItem)[0]
          if ((otherItem.position.y > 0 && paperPoint.y < 0) || (otherItem.position.y < 0 && paperPoint.y > 0)) {
            otherItem.position = new paper.Point({x: otherItem.position.x, y: -otherItem.position.y})
          }
          return true
        }
        return false
      },

      stopDraggingItem: () => {
        if (this.draggedItem) {
          this.draggedItem = null
        }
      }
    }

    this.scatterPoints = {

      setDraggable: (onMouseDown, onMouseDrag, onMouseUp) => {
        const pointsTool = new paper.Tool()

        pointsTool.onMouseDown = event => {
          onMouseDown(this.fromViewCoordinateToGrid(event.point), this.getAllPointsInGroup('points'))
        }

        pointsTool.onMouseDrag = event => {
          onMouseDrag(this.fromViewCoordinateToGrid(event.point), this.getAllPointsInGroup('points'))
        }

        pointsTool.onMouseUp = event => {
          onMouseUp(this.fromViewCoordinateToGrid(event.point), this.getAllPointsInGroup('points'))
        }
      },

      startDraggingItemAt: (point: PointT) => {
        const paperPoint = this.fromGridCoordinateToView(point)
        this.draggedItem = pickClosestItem(paperPoint, [this.groups['points']])
      },

      moveDraggedItemAt: (point: PointT): boolean => {
        if (this.draggedItem) {
          const paperPoint = this.fromGridCoordinateToView(point)
          this.draggedItem.position = paperPoint
          return true
        }
        return false
      },

      stopDraggingItem: () => {
        if (this.draggedItem) {
          this.draggedItem = null
        }
      }
    }

    this.linearEquationInequality = {
      inequality: null,

      setInequality: (inequality: InequalityT) => {
        this.linearEquationInequality.inequality = inequality
      },

      updateFunction: () => {
        this.groups['curve'].removeChildren()
        const [gridPoint1, gridPoint2] = this.getAllPointsInGroup('points')
        const fn = getLinearFunction(gridPoint1, gridPoint2)
        const {minGridX, maxGridX, stepX} = graphSettings
        const isDashed = _.includes(["gt", "lt"], this.linearEquationInequality.inequality)
        this.traceCurve('curve', fn, minGridX, maxGridX, stepX, 'blue', isDashed)
        this.linearEquationInequality.updateInequalitySide(this.linearEquationInequality.inequality)
      },

      updateInequalitySide: (inequality: InequalityT) => {
        this.groups['inequality-side'].removeChildren()
        const [gridPoint1, gridPoint2] = this.getAllPointsInGroup('points')
        const fn = getLinearFunction(gridPoint1, gridPoint2)
        const {minGridX, minGridY, maxGridX, maxGridY} = graphSettings

        const [gridPointEnd1, gridPointEnd2] =
          [ {x: minGridX, y: fn(minGridX)}
          , {x: maxGridX, y: fn(maxGridX)}
          ]

        const topLeftCorner = {x: minGridX, y: minGridY}
        const topRightCorner = {x: maxGridX, y: minGridY}
        const bottomLeftCorner = {x: minGridX, y: maxGridY}
        const bottomRightCorner = {x: maxGridX, y: maxGridY}
        const shapePoints =
          inequality === "lt" || inequality === "lteq" ?
            [gridPointEnd1, topLeftCorner, topRightCorner, gridPointEnd2] :
            [gridPointEnd1, bottomLeftCorner, bottomRightCorner, gridPointEnd2]

        this.createShape('inequality-side', shapePoints, new paper.Color(0, 1, 0, 0.1))
      },

      setDraggable: (onMouseDown, onMouseDrag, onMouseUp) => {
        const pointsTool = new paper.Tool(this.groups['points'])

        pointsTool.onMouseDown = event => {
          onMouseDown(this.fromViewCoordinateToGrid(event.point), this.getAllPointsInGroup('points'), this.linearEquationInequality.inequality)
        }

        pointsTool.onMouseDrag = event => {
          onMouseDrag(this.fromViewCoordinateToGrid(event.point), this.getAllPointsInGroup('points'), this.linearEquationInequality.inequality)
        }

        pointsTool.onMouseUp = event => {
          onMouseUp(this.fromViewCoordinateToGrid(event.point), this.getAllPointsInGroup('points'), this.linearEquationInequality.inequality)
        }
      },

      startDraggingItemAt: (point: PointT) => {
        const paperPoint = this.fromGridCoordinateToView(point)
        const item = pickClosestItem(paperPoint, [this.groups['points']])

        const [gridPoint1, gridPoint2] = this.getAllPointsInGroup('points')
        const fn = getLinearFunction(gridPoint1, gridPoint2)

        if (item) {
          // User click next to a point
          this.draggedItem = item
        } else if (isPointCloseToFunction(fn, point, graphSettings.stepY)) {
          // Clicking on function
          let newInequality
          if (this.linearEquationInequality.inequality === "lt") {
            newInequality = "lteq"
          } else if (this.linearEquationInequality.inequality === "lteq") {
            newInequality = "lt"
          } else if (this.linearEquationInequality.inequality === "gt") {
            newInequality = "gteq"
          } else if (this.linearEquationInequality.inequality === "gteq") {
            newInequality = "gt"
          }
          this.linearEquationInequality.setInequality(newInequality)
          this.linearEquationInequality.updateFunction()
        } else {
          const clickedLessThan = isPointBelowFunction(fn, point)
          let newInequality
          if (this.linearEquationInequality.inequality === "lt" && !clickedLessThan) {
            newInequality = "gt"
          } else if (this.linearEquationInequality.inequality === "lteq" && !clickedLessThan) {
            newInequality = "gteq"
          } else if (this.linearEquationInequality.inequality === "gt" && clickedLessThan) {
            newInequality = "lt"
          } else if (this.linearEquationInequality.inequality === "gteq" && clickedLessThan) {
            newInequality = "lteq"
          }
          this.linearEquationInequality.setInequality(newInequality)
          this.linearEquationInequality.updateFunction()
        }
      },

      moveDraggedItemAt: (point: PointT): boolean => {
        if (this.draggedItem) {
          const paperPoint = this.fromGridCoordinateToView(point)
          this.draggedItem.position = paperPoint
          return true
        }
        return false
      },

      stopDraggingItem: () => {
        if (this.draggedItem) {
          this.draggedItem = null
        }
      }
    }

    return initialize(canvas)
  }
}

export default PaperUtil
