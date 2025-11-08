/**
 * Canvas Utility Functions
 * Helper functions for canvas operations and calculations
 */

import { CANVAS_CONFIG } from '@/lib/types/canvas'

/**
 * Calculate bezier curve control points for smooth relationship lines
 */
export function calculateBezierControlPoints(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  offset: number = 0.3
) {
  const dx = x2 - x1
  const dy = y2 - y1
  const distance = Math.sqrt(dx * dx + dy * dy)
  const controlOffset = distance * offset

  const midX = (x1 + x2) / 2
  const midY = (y1 + y2) / 2

  const angle = Math.atan2(dy, dx)
  const cpx = midX + Math.cos(angle + Math.PI / 2) * controlOffset
  const cpy = midY + Math.sin(angle + Math.PI / 2) * controlOffset

  return { cpx, cpy }
}

/**
 * Calculate arrow head position and rotation
 */
export function calculateArrowHead(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  size: number = 12
) {
  const dx = x2 - x1
  const dy = y2 - y1
  const angle = Math.atan2(dy, dx)

  const distance = Math.sqrt(dx * dx + dy * dy)
  const arrowX = x2 - (Math.cos(angle) * size)
  const arrowY = y2 - (Math.sin(angle) * size)

  return {
    x: arrowX,
    y: arrowY,
    angle: (angle * 180) / Math.PI
  }
}

/**
 * Check if point is within rectangle bounds
 */
export function isPointInRect(
  px: number,
  py: number,
  x: number,
  y: number,
  width: number,
  height: number
): boolean {
  return px >= x && px <= x + width && py >= y && py <= y + height
}

/**
 * Check if rectangles intersect
 */
export function doRectsIntersect(
  x1: number,
  y1: number,
  w1: number,
  h1: number,
  x2: number,
  y2: number,
  w2: number,
  h2: number
): boolean {
  return !(x1 + w1 < x2 || x2 + w2 < x1 || y1 + h1 < y2 || y2 + h2 < y1)
}

/**
 * Calculate distance between two points
 */
export function distance(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1
  const dy = y2 - y1
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Calculate angle between two points
 */
export function angle(x1: number, y1: number, x2: number, y2: number): number {
  return Math.atan2(y2 - y1, x2 - x1)
}

/**
 * Clamp value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Lerp between two values
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

/**
 * Ease out cubic
 */
export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

/**
 * Ease in out cubic
 */
export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

/**
 * Calculate grid opacity based on zoom level
 */
export function calculateGridOpacity(zoom: number): number {
  let opacity = CANVAS_CONFIG.GRID_OPACITY

  if (zoom > 1.5) {
    opacity = Math.max(0.05, CANVAS_CONFIG.GRID_OPACITY - (zoom - 1.5) * 0.05)
  }

  if (zoom < 0.6) {
    opacity = Math.min(0.25, CANVAS_CONFIG.GRID_OPACITY + (0.6 - zoom) * 0.1)
  }

  return opacity
}

/**
 * Calculate viewport bounds
 */
export function calculateViewportBounds(
  containerWidth: number,
  containerHeight: number,
  zoom: number,
  pan: { x: number; y: number }
) {
  return {
    minX: -pan.x / zoom,
    minY: -pan.y / zoom,
    maxX: (-pan.x + containerWidth) / zoom,
    maxY: (-pan.y + containerHeight) / zoom
  }
}

/**
 * Check if node is in viewport
 */
export function isNodeInViewport(
  nodeX: number,
  nodeY: number,
  nodeWidth: number,
  nodeHeight: number,
  bounds: ReturnType<typeof calculateViewportBounds>,
  buffer: number = 500
): boolean {
  return !(
    nodeX + nodeWidth + buffer < bounds.minX ||
    nodeX - buffer > bounds.maxX ||
    nodeY + nodeHeight + buffer < bounds.minY ||
    nodeY - buffer > bounds.maxY
  )
}

/**
 * Format field type for display
 */
export function formatFieldType(type: string): string {
  const typeMap: { [key: string]: string } = {
    'String': 'String',
    'Number': 'Number',
    'Boolean': 'Boolean',
    'Date': 'Date',
    'ObjectId': 'ObjectId',
    'Array': 'Array',
    'Object': 'Object',
    'Mixed': 'Mixed'
  }
  return typeMap[type] || type
}

/**
 * Get field type icon
 */
export function getFieldTypeIcon(type: string): string {
  const icons: { [key: string]: string } = {
    'String': '""',
    'Number': '#',
    'Boolean': '✓',
    'Date': '📅',
    'ObjectId': '🔑',
    'Array': '[]',
    'Object': '{}',
    'Mixed': '?'
  }
  return icons[type] || '•'
}

/**
 * Format sample value for display
 */
export function formatSampleValue(value: any): string {
  if (value === null || value === undefined) return 'null'
  if (typeof value === 'string') {
    const truncated = value.substring(0, 30)
    return `"${truncated}${value.length > 30 ? '...' : ''}"`
  }
  if (typeof value === 'number') return value.toLocaleString()
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (value instanceof Date) return value.toLocaleDateString()
  if (Array.isArray(value)) return `[${value.length} items]`
  if (typeof value === 'object') return '{...}'
  return String(value).substring(0, 30)
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }

    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * Calculate force-directed layout positions
 */
export function calculateForceDirectedLayout(
  nodes: Array<{ id: string; x: number; y: number }>,
  edges: Array<{ from: string; to: string }>,
  iterations: number = 50,
  repulsionForce: number = 50000,
  attractionForce: number = 0.1
): Map<string, { x: number; y: number }> {
  const positions = new Map(nodes.map(n => [n.id, { x: n.x, y: n.y }]))
  const velocities = new Map(nodes.map(n => [n.id, { x: 0, y: 0 }]))

  for (let iter = 0; iter < iterations; iter++) {
    // Reset forces
    const forces = new Map(nodes.map(n => [n.id, { x: 0, y: 0 }]))

    // Repulsion between all nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const pos1 = positions.get(nodes[i].id)!
        const pos2 = positions.get(nodes[j].id)!

        const dx = pos2.x - pos1.x
        const dy = pos2.y - pos1.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1

        const force = repulsionForce / (dist * dist)
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force

        forces.get(nodes[i].id)!.x -= fx
        forces.get(nodes[i].id)!.y -= fy
        forces.get(nodes[j].id)!.x += fx
        forces.get(nodes[j].id)!.y += fy
      }
    }

    // Attraction along edges
    edges.forEach(edge => {
      const pos1 = positions.get(edge.from)
      const pos2 = positions.get(edge.to)

      if (pos1 && pos2) {
        const dx = pos2.x - pos1.x
        const dy = pos2.y - pos1.y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1

        const force = dist * attractionForce
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force

        forces.get(edge.from)!.x += fx
        forces.get(edge.from)!.y += fy
        forces.get(edge.to)!.x -= fx
        forces.get(edge.to)!.y -= fy
      }
    })

    // Apply forces with damping
    nodes.forEach(node => {
      const force = forces.get(node.id)!
      const vel = velocities.get(node.id)!
      const pos = positions.get(node.id)!

      vel.x = (vel.x + force.x * 0.01) * 0.9
      vel.y = (vel.y + force.y * 0.01) * 0.9

      pos.x += vel.x
      pos.y += vel.y
    })
  }

  return positions
}
