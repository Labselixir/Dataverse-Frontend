/**
 * Canvas Types and Interfaces
 * Comprehensive type definitions for the canvas system
 */

export interface CanvasNode {
  id: string
  name: string
  documentCount: number
  fields: CanvasField[]
  indexes?: string[]
  x: number
  y: number
  width: number
  height: number
}

export interface CanvasField {
  name: string
  type: FieldType
  nullable?: boolean
  sampleValues?: any[]
  isArray?: boolean
  isNested?: boolean
  nestedFields?: CanvasField[]
}

export type FieldType =
  | 'String'
  | 'Number'
  | 'Boolean'
  | 'Date'
  | 'ObjectId'
  | 'Array'
  | 'Object'
  | 'Mixed'

export interface CanvasEdge {
  id: string
  from: string
  to: string
  field: string
  type: RelationType
  cardinality?: Cardinality
}

export type RelationType = 'one-to-one' | 'one-to-many' | 'many-to-many'
export type Cardinality = '1:1' | '1:N' | 'N:M'

export interface CanvasState {
  zoom: number
  pan: { x: number; y: number }
  selectedNodes: Set<string>
  selectedEdges: Set<string>
  hoveredNode: string | null
  hoveredEdge: string | null
  activeTool: CanvasTool
  nodePositions: Map<string, { x: number; y: number }>
}

export type CanvasTool =
  | 'select'
  | 'pan'
  | 'zoom'
  | 'create'
  | 'connect'
  | 'comment'
  | 'frame'

export interface ContextMenuData {
  x: number
  y: number
  type: 'node' | 'canvas'
  data?: any
}

export interface TableNodeProps {
  collection: any
  position: { x: number; y: number }
  isSelected: boolean
  isHovered: boolean
  onSelect: () => void
  onMultiSelect: () => void
  onHover: () => void
  onHoverEnd: () => void
  onPositionChange: (x: number, y: number) => void
  onContextMenu: (e: React.MouseEvent) => void
  zoom: number
}

export interface CanvasRendererProps {
  schema: any
  zoom: number
  pan: { x: number; y: number }
  onPanChange: (pan: { x: number; y: number }) => void
  onZoomChange: (zoom: number) => void
  nodePositions: Map<string, { x: number; y: number }>
  onNodePositionChange: (nodeId: string, x: number, y: number) => void
  selectedNodes: Set<string>
  selectedEdges: Set<string>
  hoveredNode: string | null
  hoveredEdge: string | null
  onNodeSelect: (nodeId: string, multiSelect: boolean) => void
  onEdgeSelect: (edgeId: string, multiSelect: boolean) => void
  onNodeHover: (nodeId: string | null) => void
  onEdgeHover: (edgeId: string | null) => void
  onContextMenu: (e: React.MouseEvent, type: 'node' | 'canvas', data?: any) => void
  activeTool: string
  onClearSelection: () => void
}

export interface MinimapProps {
  schema: any
  nodePositions: Map<string, { x: number; y: number }>
  zoom: number
  pan: { x: number; y: number }
  onNavigate: (x: number, y: number) => void
}

export interface ToolPanelProps {
  activeTool: string
  onToolChange: (tool: string) => void
  onFitView: () => void
  onAutoArrange: () => void
  isAutoArranging: boolean
}

export interface ZoomIndicatorProps {
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
}

export interface TableInfoPanelProps {
  node: any
  schema: any
  onClose: () => void
}

export interface ContextMenuProps {
  x: number
  y: number
  type: 'node' | 'canvas'
  data?: any
  onClose: () => void
  onRefresh: () => void
}

/**
 * Canvas Configuration Constants
 */
export const CANVAS_CONFIG = {
  // Grid
  GRID_SIZE: 40,
  GRID_OPACITY: 0.15,
  GRID_PARALLAX: 0.98,

  // Zoom
  MIN_ZOOM: 0.25,
  MAX_ZOOM: 4,
  ZOOM_STEP: 0.1,
  ZOOM_ANIMATION_DURATION: 150,

  // Pan
  PAN_MOMENTUM_DECAY: 0.95,
  PAN_MOMENTUM_THRESHOLD: 0.1,

  // Nodes
  NODE_MIN_WIDTH: 320,
  NODE_MAX_WIDTH: 480,
  NODE_MIN_HEIGHT: 180,
  NODE_HEADER_HEIGHT: 72,
  NODE_FIELD_HEIGHT: 44,
  NODE_CORNER_RADIUS: 16,

  // Edges
  EDGE_WIDTH: 2.5,
  EDGE_WIDTH_HOVER: 3.5,
  EDGE_WIDTH_SELECTED: 3,
  EDGE_OPACITY: 0.25,
  EDGE_OPACITY_HOVER: 0.6,

  // Animations
  TRANSITION_DURATION: 200,
  DRAG_DELAY: 100,
  DRAG_LAG: 50,
  MOMENTUM_DURATION: 800,

  // Tool Panel
  TOOL_PANEL_FADE_DELAY: 3000,
  TOOL_BUTTON_SIZE: 52,

  // Minimap
  MINIMAP_WIDTH: 180,
  MINIMAP_HEIGHT: 140,

  // Colors
  COLORS: {
    BLACK: '#000000',
    WHITE: '#FFFFFF',
    BLUE: 'rgba(96, 165, 250, 1)',
    BLUE_LIGHT: 'rgba(96, 165, 250, 0.15)',
    BLUE_GLOW: 'rgba(96, 165, 250, 0.4)',
    WHITE_SUBTLE: 'rgba(255, 255, 255, 0.03)',
    WHITE_BORDER: 'rgba(255, 255, 255, 0.18)',
    WHITE_HOVER: 'rgba(255, 255, 255, 0.30)',
    BLACK_PANEL: 'rgba(18, 18, 18, 0.75)',
  }
}
