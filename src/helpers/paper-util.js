/* @flow */

import paper from 'paper'
import _ from 'lodash'
import forEach from 'lodash/forEach'
import find from 'lodash/find'

export type GraphTypeT =
  | "linear"
  | "linear-inequality"
  | "quadratic"
  | "exponential"
  | "scatter-points"
  | "empty";

export type PaperPointT =
  { x: number
  , y: number
  }

export type AxisT
  = 'x'
  | 'y'

export type AnchorT
  = 'left'
  | 'bottom'
  | 'right'
  | 'top'

export const ANNOUNCEMENT_NODE_ID = 'canvas-announcement'

import
  { isPointBelowFunction
  , isPointCloseToFunction
  , getLinearFunction
  , getQuadraticFunction
  , getExponentialFunction
  } from './../logic/graph-equations.js'
import type {GraphSettingsT, PointT, InequalityT} from './../helpers/graph-util.js'

// Return the strict or loose version of the inequality and keep the side
// eg: lt -> le
// eg: le -> lt
const switchInequalityStrictness = function(inequality: InequalityT): InequalityT {
  if (inequality === "lt") {
    return "le"
  } else if (inequality === "le") {
    return "lt"
  } else if (inequality === "gt") {
    return "ge"
  } else if (inequality === "ge") {
    return "gt"
  } else {
    throw new Error(`Invalid inequality ${inequality}`)
  }
}

// Return the opposite version of the inequality when click is on the
// opposite side and keep the strictness
// eg: gt && clickedLessThan -> lt
const switchToOppositeInequality = function(inequality: InequalityT, clickedLessThan: boolean): InequalityT {
  if (inequality === "lt" && !clickedLessThan) {
    return "gt"
  } else if (inequality === "le" && !clickedLessThan) {
    return "ge"
  } else if (inequality === "gt" && clickedLessThan) {
    return "lt"
  } else if (inequality === "ge" && clickedLessThan) {
    return "le"
  } else {
    return inequality
  }
}

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

const createTick = function(point: PointT, axis: AxisT): any {
  const size = axis === 'x' ? new paper.Size(4, 8) : new paper.Size(8, 4)

  const rect = new paper.Path.Rectangle(
    { point
    , size
    , fillColor: "black"
    }
  )

  rect.translate([-rect.bounds.width / 2, -rect.bounds.height / 2])

  return rect
}

const createCircle = function(center: PointT, radius: number, fillColor: string, id?: ?string): any {
  const idAttr = id !== null && id !== undefined ? {id} : {}
  return new paper.Path.Circle(
    { center
    , radius
    , fillColor
    , data: {...idAttr}
    }
  )
}

const createLabel = function(point: PointT, content: string, anchor: AnchorT): any {
  let label = new paper.PointText(point)
  label.content = content
  label.scaling = [1, -1]

  // if text is on the right move it over the full width so it ends on the
  // desired point
  if (anchor === 'right') {
    label.translate(new paper.Point([-label.bounds.width, 0]))
  }

  // impossible to get font baseline and due to ligatures height is too large
  // divide height in order to get a more reasonable translation
  if (anchor === 'bottom') {
    label.translate(new paper.Point([0, label.bounds.height / 2]))
  } else {
    label.translate(new paper.Point([0, -label.bounds.height / 2]))
  }

  return label
}

// Return the coordinates of the closest point in grid bounds
const getClosestInGridPoint = function(view: any, gridPoint: PointT, graphSettings: GraphSettingsT): PointT {
  const {minGridX, maxGridX, minGridY, maxGridY} = graphSettings
  const {x, y} = gridPoint
  return (
    { x: _.clamp(x, minGridX, maxGridX)
    , y: _.clamp(y, minGridY, maxGridY)
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

function speakPoint(point: PointT): string {
  const {x, y} = point
  return `${Math.round(x)}, ${Math.round(y)}`
}

type GroupKeyT
  = 'grid'
  | 'points'
  | 'curve'
  | 'vertex'
  | 'point'
  | 'inequality-side'
  | 'tick'
  | 'label'

const PaperUtil = {
  setupGraph: function(canvas: HTMLCanvasElement, graphSettings: GraphSettingsT, graphType: GraphTypeT): any {
    const initialize = (): any => {
      // Save initial canvas state (restore in destroy())
      // We do this because on some version of Chrome for Mac OS X, paper.js seems
      // to leave the canvas in a transformed state after clearing the project
      canvas.getContext('2d').save()

      paper.setup(canvas)

      // Move View to be centered on 0,0 of the Grid which is determined by
      // the GraphSettings (not always the middle of the canvas)
      // To do that we apply a translation to the paper view with the ratio
      // of GridMinX / GridWidth and same for Y axis
      // Because Y axis is inverted (coef -1) to have negative number, the
      // translation has to be based on View Height
      const {minGridX, maxGridX, minGridY, maxGridY} = graphSettings
      const widthGrid = Math.abs(maxGridX - minGridX)
      const heightGrid = Math.abs(maxGridY - minGridY)

      const tx = minGridX * (paper.view.size.width / widthGrid)
      const ty = minGridY * (paper.view.size.height / heightGrid) + paper.view.size.height
      paper.view.transform(new paper.Matrix(1, 0, 0, -1, -tx, ty))

      this.groups = {}
      this.groups['grid'] = new paper.Group()
      const pointsGroup = this.groups['points'] = new paper.Group()
      this.groups['curve'] = new paper.Group()
      this.groups['vertex'] = new paper.Group()
      this.groups['point'] = new paper.Group()
      this.groups['inequality-side'] = new paper.Group()
      this.groups['label'] = new paper.Group()
      this.groups['tick'] = new paper.Group()
      this.pointsTool = new paper.Tool(pointsGroup)
      this.pointsTool.activate()

      // used for aria-live announcements
      this.announcementNode = document.getElementById(ANNOUNCEMENT_NODE_ID)

      // Provide keyboard accessible buttons for each
      // dragable coordinate point on the graph
      forEach(graphSettings.startingPoints, (p, index) => {
        const controlButton = document.createElement('button')
        const id = `control-button-${index}`
        controlButton.id = id
        controlButton.innerText = `Coordinates ${speakPoint(p)}.`
        // auto-switch to focus mode for screen-readers
        controlButton.setAttribute('role', 'application')
        canvas.appendChild(controlButton)
        const paperCenterPoint = this.fromGridCoordinateToView(p)
        // round-robin colors
        const color = graphSettings.pointColors[index % graphSettings.pointColors.length]
        const circle = createCircle(
          paperCenterPoint, 
          graphSettings.pointSize, 
          color,
          id
        )
        if(graphType === 'quadratic' && index === 0) {
          // first point in a quadratic graph is the vertex
          this.groups.vertex.addChild(circle)
        } else {
          this.groups.points.addChild(circle)
        }
      })

      paper.view.draw()
      return this
    }

    this.getFocusedStartingPoint = () => {
      const target = document.activeElement
      const targetId = target ? target.id : null
      const focusedPath = find([
        ...this.groups.points.children,
        ...this.groups.vertex.children
      ], c => c.data.id === targetId)
      return focusedPath
    }

    this.checkFocusOnStartingPoints = () => {
      const focusedPath = this.getFocusedStartingPoint()

      forEach(this.groups.points.children, path => path.set({
        strokeColor: undefined,
        strokeWidth: 0,
        scale: 1
      }))

      if(focusedPath !== null && focusedPath !== undefined) {
        focusedPath.set({
          strokeColor: 'black',
          strokeWidth: 2,
          scale: 1.5
        })
      }
    }

    this.destroy = () => {
      this.removeHandlers()

      if (this.pointsTool) {
        this.pointsTool.remove()
        this.pointsTool = null
      }

      if (this.groups) {
        this.groups = {}
      }

      if (paper.project) {
        paper.project.clear()
      }

      // Restore initial canvas state (save in initialize())
      canvas.getContext('2d').restore()
    }

    this.removeHandlers = () => {
      if (this.pointsTool) {
        if (this.onMouseDown) {
          this.pointsTool.off('mousedown', this.onMouseDown)
          this.onMouseDown = null
        }
        if (this.onMouseDrag) {
          this.pointsTool.off('mousedrag', this.onMouseDrag)
          this.onMouseDrag = null
        }
        if (this.onMouseUp) {
          this.pointsTool.off('mouseup', this.onMouseUp)
          this.onMouseUp = null
        }
        if (this.onKeyDown) {
          this.pointsTool.off('keydown', this.onKeyDown)
          this.onKeyDown = null
        }
      }

      document.removeEventListener('focus', this.checkFocusOnStartingPoints, true);
      document.removeEventListener('blur', this.checkFocusOnStartingPoints, true);
    }

    this.setDraggable = (onMouseDown, onMouseDrag, onMouseUp, onKeyDown) => {
      this.removeHandlers()
      this.pointsTool.on('mousedown', this.onMouseDown = onMouseDown)
      this.pointsTool.on('mousedrag', this.onMouseDrag = onMouseDrag)
      this.pointsTool.on('mouseup', this.onMouseUp = onMouseUp)
      this.pointsTool.on('keydown', this.onKeyDown = onKeyDown)

      // Listen to focus 
      document.addEventListener('focus', this.checkFocusOnStartingPoints, true);
      document.addEventListener('blur', this.checkFocusOnStartingPoints, true);
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

    this.createTick = (group: GroupKeyT, gridPoint: PointT, axis: AxisT) => {
      const paperPoint = this.fromGridCoordinateToView(gridPoint)
      const tick = createTick(paperPoint, axis)
      this.groups[group].addChild(tick)
    }

    this.createCircle = (group: GroupKeyT, centerGridPoint: PointT, radius: number, fillColor: string)=> {
      const paperCenterPoint = this.fromGridCoordinateToView(centerGridPoint)
      const circle = createCircle(paperCenterPoint, radius, fillColor)
      this.groups[group].addChild(circle)
    }

    this.createLabel = (group: GroupKeyT, axisBoundsGridCoordinatePoint: PointT, text: string, anchors: AnchorT[] = ['top', 'left']) => {
      const axisBoundsPoint = this.fromGridCoordinateToView(axisBoundsGridCoordinatePoint)

      let nextClosestVerticalPoint = null
      if (anchors.indexOf('bottom') > -1) {
        nextClosestVerticalPoint = this.fromGridCoordinateToView({ x: axisBoundsGridCoordinatePoint.x, y: axisBoundsGridCoordinatePoint.y + 1 })
      } else {
        nextClosestVerticalPoint = this.fromGridCoordinateToView({ x: axisBoundsGridCoordinatePoint.x, y: axisBoundsGridCoordinatePoint.y - 1 })
      }

      let nextClosestHorizontalPoint = null
      if (anchors.indexOf('right') > -1) {
        nextClosestHorizontalPoint = this.fromGridCoordinateToView({ x: axisBoundsGridCoordinatePoint.x - 1, y: axisBoundsGridCoordinatePoint.y })
      } else {
        nextClosestHorizontalPoint = this.fromGridCoordinateToView({ x: axisBoundsGridCoordinatePoint.x + 1, y: axisBoundsGridCoordinatePoint.y })
      }

      const verticalOffset = (nextClosestVerticalPoint.y - axisBoundsPoint.y) / 10
      const horizontalOffset = (nextClosestHorizontalPoint.x - axisBoundsPoint.x) / 10
      const labelPoint = { x: axisBoundsPoint.x + horizontalOffset, y: axisBoundsPoint.y + verticalOffset }
      const label = createLabel(labelPoint, text, anchors[0])

      this.groups[group].addChild(label)
    }

    this.traceCurve = (group: GroupKeyT, fn: ((x: number) => number), minXGridPoint: number, maxXGridPoint: number, stepGridX: number, color: string, isDashed: boolean = false) => {
      // Subdivide the grid steps for more precision
      const xs = _.range(minXGridPoint, maxXGridPoint + stepGridX, stepGridX / 8.0)
      const points = _.map(xs, x => this.fromGridCoordinateToView({x, y: fn(x)}))
      const path = new paper.Path(points)

      // Reduce the number of segments by fitting Bezier curves to the path
      path.simplify()

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

    this.callFuncWithConvertedPoint = (func: (point: PointT, ...args: Array<mixed>) => void, paperPoint: PaperPointT, ...args: Array<mixed>) => {
      const gridPoint = this.fromViewCoordinateToGrid(paperPoint)
      const inGridBoundsPoint = getClosestInGridPoint(paper.view, gridPoint, graphSettings)
      func(inGridBoundsPoint, ...args)
    }

    this.getTargetPointForKeyboardEvent = (event) => {
      const focusedPath = this.getFocusedStartingPoint()
      const ALLOWED_KEYS = ['up', 'down', 'left', 'right']
      if(focusedPath !== null && focusedPath !== undefined && ALLOWED_KEYS.includes(event.key)) {
        const gridPoint = this.fromViewCoordinateToGrid(focusedPath.position)
        const targetPoint = (() => {
          switch(event.key) {
            case 'up':
              return {
                ...gridPoint,
                x: gridPoint.x,
                y:  gridPoint.y + graphSettings.stepY
              }
            case 'down':
              return {
                ...gridPoint,
                x: gridPoint.x,
                y:  gridPoint.y - graphSettings.stepY
              }
            case 'left':
              return {
                ...gridPoint,
                x: gridPoint.x - graphSettings.stepX,
                y:  gridPoint.y
              }
            case 'right':
              return {
                ...gridPoint,
                x: gridPoint.x + graphSettings.stepX,
                y:  gridPoint.y
              }
            default:
              return gridPoint
          }
        })()
        return getClosestInGridPoint(paper.view, targetPoint, graphSettings)
      }
    }

    this.linearEquation = {

      updateFunction: () => {
        this.groups['curve'].removeChildren()
        const [gridPoint1, gridPoint2] = this.getAllPointsInGroup('points')
        const fn = getLinearFunction(gridPoint1, gridPoint2)
        const {minGridX, maxGridX, stepX} = graphSettings
        this.traceCurve('curve', fn, minGridX, maxGridX, stepX, 'blue')
      },

      setDraggable: (onMouseDown, onMouseDrag, onMouseUp, onKeyDown) => {
        this.setDraggable(
          event => {
            this.callFuncWithConvertedPoint(onMouseDown, event.point, this.getAllPointsInGroup('points'))
          },
          event => {
            this.callFuncWithConvertedPoint(onMouseDrag, event.point, this.getAllPointsInGroup('points'))
          },
          event => {
            this.callFuncWithConvertedPoint(onMouseUp, event.point, this.getAllPointsInGroup('points'))
          },
          event => {
            const targetPoint = this.getTargetPointForKeyboardEvent(event)
            if(targetPoint) {
              onKeyDown(targetPoint, this.getAllPointsInGroup('points'))
            }
          }
        )
      },

      startDraggingItemAt: (point: PointT, isKeyboardEvent: boolean) => {
        if(isKeyboardEvent) {
          this.draggedItem = this.getFocusedStartingPoint()
        } else {
          const paperPoint = this.fromGridCoordinateToView(point)
          this.draggedItem = pickClosestItem(paperPoint, [this.groups['points']])
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
          , point: this.getAllPointsInGroup('points')[0]
          }
        )
      },

      setDraggable: (onMouseDown, onMouseDrag, onMouseUp, onKeyDown) => {
        this.setDraggable(
          event => {
            this.callFuncWithConvertedPoint(onMouseDown, event.point, this.quadraticEquation.getVertexAndPoint())
          },
          event => {
            this.callFuncWithConvertedPoint(onMouseDrag, event.point, this.quadraticEquation.getVertexAndPoint())
          },
          event => {
            this.callFuncWithConvertedPoint(onMouseUp, event.point, this.quadraticEquation.getVertexAndPoint())
          },
          event => {
            const targetPoint = this.getTargetPointForKeyboardEvent(event)
            if(targetPoint) {
              onKeyDown(targetPoint, this.quadraticEquation.getVertexAndPoint())
            }
          }
        )
      },

      startDraggingItemAt: (point: PointT, isKeyboardEvent: boolean) => {
        if(isKeyboardEvent) {
          this.draggedItem = this.getFocusedStartingPoint()
        } else {
          const paperPoint = this.fromGridCoordinateToView(point)
          this.draggedItem = pickClosestItem(paperPoint, [this.groups['vertex'], this.groups['points']])
        }
      },

      moveDraggedItemAt: (point: PointT): boolean => {
        if (this.draggedItem) {
          this.announcementNode.innerText = `Moved from coordinates (${speakPoint(this.fromViewCoordinateToGrid(this.draggedItem.position))}), to, coordinates ${speakPoint(point)}.`
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

      setDraggable: (onMouseDown, onMouseDrag, onMouseUp, onKeyDown) => {
        this.setDraggable(
          event => {
            this.callFuncWithConvertedPoint(onMouseDown, event.point, this.getAllPointsInGroup('points'))
          },
          event => {
            this.callFuncWithConvertedPoint(onMouseDrag, event.point, this.getAllPointsInGroup('points'))
          },
          event => {
            this.callFuncWithConvertedPoint(onMouseUp, event.point, this.getAllPointsInGroup('points'))
          },
          event => {
              const targetPoint = this.getTargetPointForKeyboardEvent(event)
              if(targetPoint) {
                onKeyDown(targetPoint, this.getAllPointsInGroup('points'))
              }
          }
        )
      },

      startDraggingItemAt: (point: PointT, isKeyboardEvent: boolean) => {
        if(isKeyboardEvent) {
          this.draggedItem = this.getFocusedStartingPoint()
        } else {
          const paperPoint = this.fromGridCoordinateToView(point)
          this.draggedItem = pickClosestItem(paperPoint, [this.groups['points']])
        }
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

      setDraggable: (onMouseDown, onMouseDrag, onMouseUp, onKeyDown) => {
        this.setDraggable(
          event => {
            this.callFuncWithConvertedPoint(onMouseDown, event.point, this.getAllPointsInGroup('points'))
          },
          event => {
            this.callFuncWithConvertedPoint(onMouseDrag, event.point, this.getAllPointsInGroup('points'))
          },
          event => {
            this.callFuncWithConvertedPoint(onMouseUp, event.point, this.getAllPointsInGroup('points'))
          },
          event => {
            const targetPoint = this.getTargetPointForKeyboardEvent(event)
            if(targetPoint) {
              onKeyDown(targetPoint, this.getAllPointsInGroup('points'))
            }
          },
        )
      },

      startDraggingItemAt: (point: PointT, isKeyboardEvent: boolean) => {
        if(isKeyboardEvent) {
          this.draggedItem = this.getFocusedStartingPoint()
        } else {
          const paperPoint = this.fromGridCoordinateToView(point)
          this.draggedItem = pickClosestItem(paperPoint, [this.groups['points']])
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
          inequality === "lt" || inequality === "le" ?
            [gridPointEnd1, topLeftCorner, topRightCorner, gridPointEnd2] :
            [gridPointEnd1, bottomLeftCorner, bottomRightCorner, gridPointEnd2]

        this.createShape('inequality-side', shapePoints, new paper.Color(0, 1, 0, 0.1))
      },

      setDraggable: (onMouseDown, onMouseDrag, onMouseUp, onKeyDown) => {
        this.setDraggable(
          event => {
            this.callFuncWithConvertedPoint(onMouseDown, event.point, this.getAllPointsInGroup('points'), this.linearEquationInequality.inequality)
          },
          event => {
            this.callFuncWithConvertedPoint(onMouseDrag, event.point, this.getAllPointsInGroup('points'), this.linearEquationInequality.inequality)
          },
          event => {
            this.callFuncWithConvertedPoint(onMouseUp, event.point, this.getAllPointsInGroup('points'), this.linearEquationInequality.inequality)
          },
          event => {
            const targetPoint = this.getTargetPointForKeyboardEvent(event)
            if(targetPoint) {
              onKeyDown(targetPoint, this.getAllPointsInGroup('points'), this.linearEquationInequality.inequality)
            }
          },
        )
      },

      startDraggingItemAt: (point: PointT, isKeyboardEvent: boolean) => {
        if(isKeyboardEvent) {
          this.draggedItem = this.getFocusedStartingPoint()
        } else {
          const paperPoint = this.fromGridCoordinateToView(point)
          const item = pickClosestItem(paperPoint, [this.groups['points']])

          const [gridPoint1, gridPoint2] = this.getAllPointsInGroup('points')
          const fn = getLinearFunction(gridPoint1, gridPoint2)

          if (item) {
            // User click next to a point
            this.draggedItem = item
          } else if (isPointCloseToFunction(fn, point, graphSettings.stepY)) {
            // Clicking on function
            const newInequality = switchInequalityStrictness(this.linearEquationInequality.inequality)
            this.linearEquationInequality.setInequality(newInequality)
            this.linearEquationInequality.updateFunction()
          } else {
            const clickedLessThan = isPointBelowFunction(fn, point)
            const newInequality = switchToOppositeInequality(this.linearEquationInequality.inequality, clickedLessThan)
            this.linearEquationInequality.setInequality(newInequality)
            this.linearEquationInequality.updateFunction()
          }
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

    return initialize()
  }
}

export default PaperUtil
