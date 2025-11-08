'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'

interface CanvasRendererProps {
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

export default function CanvasRenderer({
  schema,
  zoom,
  pan,
  onPanChange,
  onZoomChange,
  nodePositions,
  onNodePositionChange,
  selectedNodes,
  selectedEdges,
  hoveredNode,
  hoveredEdge,
  onNodeSelect,
  onEdgeSelect,
  onNodeHover,
  onEdgeHover,
  onContextMenu,
  activeTool,
  onClearSelection
}: CanvasRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [draggedNode, setDraggedNode] = useState<string | null>(null)
  const [isDrawingMarquee, setIsDrawingMarquee] = useState(false)
  const [marqueeStart, setMarqueeStart] = useState({ x: 0, y: 0 })
  const [marqueeEnd, setMarqueeEnd] = useState({ x: 0, y: 0 })
  const [momentum, setMomentum] = useState({ vx: 0, vy: 0 })

  // Draw grid background, responsive to container resize
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = container.clientWidth
      canvas.height = container.clientHeight

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Calculate grid opacity based on zoom
      let gridOpacity = 0.15
      if (zoom > 1.5) gridOpacity = Math.max(0.05, 0.15 - (zoom - 1.5) * 0.05)
      if (zoom < 0.6) gridOpacity = Math.min(0.25, 0.15 + (0.6 - zoom) * 0.1)

      // Draw grid with parallax
      const gridSize = 40
      const offsetX = (pan.x * 0.98) % gridSize
      const offsetY = (pan.y * 0.98) % gridSize

      ctx.fillStyle = `rgba(255, 255, 255, ${gridOpacity})`
      for (let x = offsetX; x < canvas.width + gridSize; x += gridSize) {
        for (let y = offsetY; y < canvas.height + gridSize; y += gridSize) {
          ctx.beginPath()
          ctx.arc(x, y, 1.5, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    }

    resize()

    const ro = new ResizeObserver(resize)
    ro.observe(container)

    return () => {
      ro.disconnect()
    }
  }, [zoom, pan])

  // Handle mouse wheel zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 0.9 : 1.1
      const newZoom = Math.max(0.25, Math.min(4, zoom * delta))

      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        const mouseX = e.clientX - rect.left
        const mouseY = e.clientY - rect.top

        // Calculate new pan to keep mouse position fixed
        const oldPan = pan
        const newPan = {
          x: mouseX - (mouseX - oldPan.x) * (newZoom / zoom),
          y: mouseY - (mouseY - oldPan.y) * (newZoom / zoom)
        }

        onZoomChange(newZoom)
        onPanChange(newPan)
      }
    }
  }, [zoom, pan, onZoomChange, onPanChange])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => container.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  // Handle mouse down
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return // Only left click

    const target = e.target as HTMLElement
    if (target.closest('[data-node]') || target.closest('[data-edge]')) {
      return // Let node/edge handlers deal with it
    }

    if (activeTool === 'select' || activeTool === 'pan') {
      setIsDragging(true)
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
      setMomentum({ vx: 0, vy: 0 })
    } else if (activeTool === 'select') {
      setIsDrawingMarquee(true)
      setMarqueeStart({ x: e.clientX, y: e.clientY })
      setMarqueeEnd({ x: e.clientX, y: e.clientY })
    }
  }, [activeTool, pan])

  // Handle mouse move
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      const newPan = {
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      }
      onPanChange(newPan)

      // Calculate momentum
      setMomentum({
        vx: (e.clientX - dragStart.x - pan.x) * 0.1,
        vy: (e.clientY - dragStart.y - pan.y) * 0.1
      })
    } else if (isDrawingMarquee) {
      setMarqueeEnd({ x: e.clientX, y: e.clientY })
    }
  }, [isDragging, isDrawingMarquee, dragStart, pan, onPanChange])

  // Handle mouse up
  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false)
      // Apply momentum
      if (Math.abs(momentum.vx) > 0.1 || Math.abs(momentum.vy) > 0.1) {
        let currentMomentum = { ...momentum }
        const animate = () => {
          currentMomentum.vx *= 0.95
          currentMomentum.vy *= 0.95

          if (Math.abs(currentMomentum.vx) > 0.1 || Math.abs(currentMomentum.vy) > 0.1) {
            onPanChange({
              x: pan.x + currentMomentum.vx,
              y: pan.y + currentMomentum.vy
            })
            requestAnimationFrame(animate)
          }
        }
        animate()
      }
    } else if (isDrawingMarquee) {
      setIsDrawingMarquee(false)
      // Select nodes in marquee
      const minX = Math.min(marqueeStart.x, marqueeEnd.x)
      const maxX = Math.max(marqueeStart.x, marqueeEnd.x)
      const minY = Math.min(marqueeStart.y, marqueeEnd.y)
      const maxY = Math.max(marqueeStart.y, marqueeEnd.y)

      const newSelection = new Set<string>()
      nodePositions.forEach((pos, nodeId) => {
        const screenX = pos.x * zoom + pan.x
        const screenY = pos.y * zoom + pan.y
        if (screenX >= minX && screenX <= maxX && screenY >= minY && screenY <= maxY) {
          newSelection.add(nodeId)
        }
      })

      if (newSelection.size > 0) {
        newSelection.forEach(nodeId => onNodeSelect(nodeId, true))
      }
    }
  }, [isDragging, isDrawingMarquee, momentum, pan, marqueeStart, marqueeEnd, nodePositions, zoom, onPanChange, onNodeSelect])

  // Handle spacebar for pan mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        // Activate pan mode
      }
      if (e.code === 'Escape') {
        onClearSelection()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClearSelection])

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative overflow-hidden cursor-move"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Grid Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
      />

      {/* Relationship Lines */}
      <svg
        className="absolute inset-0 pointer-events-none"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`
        }}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="rgba(255,255,255,0.25)" />
          </marker>
          <marker
            id="arrowhead-hover"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="rgba(255,255,255,0.6)" />
          </marker>
          <marker
            id="arrowhead-selected"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
          >
            <polygon points="0 0, 10 3, 0 6" fill="rgba(96, 165, 250, 1)" />
          </marker>
        </defs>

        {/* Render edges */}
        {schema?.relationships?.map((rel: any, idx: number) => {
          const edgeId = `${rel.from}-${rel.to}-${idx}`
          const sourcePos = nodePositions.get(rel.from)
          const targetPos = nodePositions.get(rel.to)

          if (!sourcePos || !targetPos) return null

          const isSelected = selectedEdges.has(edgeId)
          const isHovered = hoveredEdge === edgeId

          // Calculate bezier curve
          const dx = targetPos.x - sourcePos.x
          const dy = targetPos.y - sourcePos.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          const controlOffset = distance * 0.3

          const midX = (sourcePos.x + targetPos.x) / 2
          const midY = (sourcePos.y + targetPos.y) / 2

          const angle = Math.atan2(dy, dx)
          const cpx = midX + Math.cos(angle + Math.PI / 2) * controlOffset
          const cpy = midY + Math.sin(angle + Math.PI / 2) * controlOffset

          return (
            <g key={edgeId}>
              <path
                d={`M ${sourcePos.x} ${sourcePos.y} Q ${cpx} ${cpy} ${targetPos.x} ${targetPos.y}`}
                stroke={isSelected ? 'rgba(96, 165, 250, 1)' : isHovered ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)'}
                strokeWidth={isSelected ? 3 : isHovered ? 3.5 : 2.5}
                fill="none"
                strokeLinecap="round"
                markerEnd={isSelected ? 'url(#arrowhead-selected)' : isHovered ? 'url(#arrowhead-hover)' : 'url(#arrowhead)'}
                className="transition-all duration-200 pointer-events-auto cursor-pointer"
                data-edge={edgeId}
                onClick={(e) => {
                  e.stopPropagation()
                  onEdgeSelect(edgeId, e.ctrlKey || e.metaKey)
                }}
                onMouseEnter={() => onEdgeHover(edgeId)}
                onMouseLeave={() => onEdgeHover(null)}
                onContextMenu={(e) => onContextMenu(e as any, 'node', { type: 'edge', data: rel })}
              />

              {/* Edge label */}
              {(isSelected || isHovered) && (
                <g>
                  <rect
                    x={midX - 30}
                    y={midY - 12}
                    width="60"
                    height="24"
                    rx="6"
                    fill="rgba(18, 18, 18, 0.85)"
                    style={{ backdropFilter: 'blur(16px)' }}
                  />
                  <text
                    x={midX}
                    y={midY + 4}
                    textAnchor="middle"
                    fill="white"
                    fontSize="12"
                    fontWeight="500"
                    className="pointer-events-none"
                  >
                    {rel.field}
                  </text>
                </g>
              )}
            </g>
          )
        })}
      </svg>

      {/* Table Nodes */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          position: 'absolute',
          top: 0,
          left: 0
        }}
      >
        {schema?.collections?.map((collection: any) => {
          const pos = nodePositions.get(collection.name)
          if (!pos) return null

          const isSelected = selectedNodes.has(collection.name)
          const isHovered = hoveredNode === collection.name

          return (
            <TableNode
              key={collection.name}
              collection={collection}
              position={pos}
              isSelected={isSelected}
              isHovered={isHovered}
              onSelect={() => onNodeSelect(collection.name, false)}
              onMultiSelect={() => onNodeSelect(collection.name, true)}
              onHover={() => onNodeHover(collection.name)}
              onHoverEnd={() => onNodeHover(null)}
              onPositionChange={(x, y) => onNodePositionChange(collection.name, x, y)}
              onContextMenu={(e) => onContextMenu(e, 'node', { type: 'collection', data: collection })}
              zoom={zoom}
            />
          )
        })}
      </div>

      {/* Marquee Selection */}
      {isDrawingMarquee && (
        <div
          style={{
            position: 'absolute',
            left: Math.min(marqueeStart.x, marqueeEnd.x),
            top: Math.min(marqueeStart.y, marqueeEnd.y),
            width: Math.abs(marqueeEnd.x - marqueeStart.x),
            height: Math.abs(marqueeEnd.y - marqueeStart.y),
            border: '2px dashed rgba(96, 165, 250, 0.6)',
            backgroundColor: 'rgba(96, 165, 250, 0.15)',
            pointerEvents: 'none'
          }}
        />
      )}
    </div>
  )
}

// Table Node Component
function TableNode({
  collection,
  position,
  isSelected,
  isHovered,
  onSelect,
  onMultiSelect,
  onHover,
  onHoverEnd,
  onPositionChange,
  onContextMenu,
  zoom
}: any) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isExpanded, setIsExpanded] = useState(false)
  const nodeRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return
    e.stopPropagation()

    if (e.ctrlKey || e.metaKey) {
      onMultiSelect()
    } else {
      onSelect()
    }

    setIsDragging(true)
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      onPositionChange(
        e.clientX - dragOffset.x,
        e.clientY - dragOffset.y
      )
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  return (
    <motion.div
      ref={nodeRef}
      data-node={collection.name}
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: '320px',
        minHeight: '180px'
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseEnter={onHover}
      onMouseLeave={() => {
        handleMouseUp()
        onHoverEnd()
      }}
      onContextMenu={onContextMenu}
      className={`
        rounded-2xl transition-all duration-200 cursor-grab active:cursor-grabbing
        bg-white/5 border border-white/15
        shadow-[0_8px_32px_rgba(0,0,0,0.6)]
        [backdrop-filter:blur(16px)]
        ${isSelected 
          ? 'border-blue-400 shadow-[0_0_24px_rgba(96,165,250,0.4)]'
          : isHovered
          ? 'border-white/30 shadow-[0_12px_40px_rgba(0,0,0,0.7)]'
          : ''
        }
      `}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/15 flex items-center justify-between bg-white/5">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white">{collection.name}</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-white/10 rounded transition-colors"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        </div>
      </div>

      {/* Document Count Badge */}
      <div className="px-5 py-2">
        <span className="inline-block px-3 py-1 bg-white/10 rounded-full text-[10px] text-white/70 tracking-wide">
          {collection.documentCount?.toLocaleString() || 0} docs
        </span>
      </div>

      {/* Fields */}
      <div className="px-5 py-2 space-y-1 max-h-48 overflow-y-auto">
        {collection.fields?.slice(0, isExpanded ? undefined : 5).map((field: any, idx: number) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="flex items-center justify-between py-2 px-2 rounded hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="text-xs text-white/40 flex-shrink-0">
                {getFieldTypeIcon(field.type)}
              </span>
              <span className="text-sm font-mono text-white truncate">{field.name}</span>
            </div>
            <span className="text-xs px-2 py-1 bg-blue-500/15 text-blue-400 rounded flex-shrink-0">
              {field.type}
            </span>
          </motion.div>
        ))}
        {collection.fields?.length > 5 && !isExpanded && (
          <div className="text-xs text-white/40 text-center py-2">
            +{collection.fields.length - 5} more fields
          </div>
        )}
      </div>
    </motion.div>
  )
}

function getFieldTypeIcon(type: string): string {
  const icons: { [key: string]: string } = {
    'String': '""',
    'Number': '#',
    'Boolean': '✓',
    'Date': '📅',
    'ObjectId': '🔑',
    'Array': '[]',
    'Object': '{}'
  }
  return icons[type] || '•'
}
