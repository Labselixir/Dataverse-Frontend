'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Menu, MessageSquare } from 'lucide-react'
import CanvasRenderer from './CanvasRenderer'
import ToolPanel from './ToolPanel'
import ZoomIndicator from './ZoomIndicator'
import TableInfoPanel from './TableInfoPanel'
import ContextMenu from './ContextMenu'
import { apiClient } from '@/lib/api/client'
import toast from 'react-hot-toast'

interface CanvasProps {
  project: any
  onToggleSidebar: () => void
  onToggleChat: () => void
}

export default function Canvas({ project, onToggleSidebar, onToggleChat }: CanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [schema, setSchema] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedNodes, setSelectedNodes] = useState<Set<string>>(new Set())
  const [selectedEdges, setSelectedEdges] = useState<Set<string>>(new Set())
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [activeTool, setActiveTool] = useState<string>('select')
  const [contextMenu, setContextMenu] = useState<any>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [hoveredEdge, setHoveredEdge] = useState<string | null>(null)
  const [nodePositions, setNodePositions] = useState<Map<string, { x: number; y: number }>>(new Map())
  const [isAutoArranging, setIsAutoArranging] = useState(false)

  // Fetch schema on mount
  useEffect(() => {
    fetchSchema()
  }, [project.id])

  const fetchSchema = async () => {
    try {
      setLoading(true)
      const response = await apiClient.get(`/projects/${project.id}`)
      const projectData = response.data.data.project

      if (!projectData.schema?.collections) {
        // Extract schema if not available
        await apiClient.post(`/schema/${project.id}/extract`)
        const updatedResponse = await apiClient.get(`/projects/${project.id}`)
        const raw = updatedResponse.data.data.project.schema
        setSchema(sanitizeSchema(raw))
      } else {
        setSchema(sanitizeSchema(projectData.schema))
      }
    } catch (error: any) {
      toast.error('Failed to load schema')
      console.error('Schema fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Initialize node positions
  useEffect(() => {
    if (schema?.collections) {
      const positions = new Map<string, { x: number; y: number }>()
      schema.collections.forEach((collection: any, index: number) => {
        positions.set(collection.name, {
          x: (index % 4) * 400 + 100,
          y: Math.floor(index / 4) * 300 + 100
        })
      })
      setNodePositions(positions)
    }
  }, [schema])

  const handleZoomIn = useCallback(() => {
    setZoom(prev => Math.min(prev * 1.1, 4))
  }, [])

  const handleZoomOut = useCallback(() => {
    setZoom(prev => Math.max(prev / 1.1, 0.25))
  }, [])

  const handleResetView = useCallback(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
    setSelectedNodes(new Set())
    setSelectedEdges(new Set())
  }, [])

  const handleFitView = useCallback(() => {
    if (nodePositions.size === 0) return

    const positions = Array.from(nodePositions.values())
    const minX = Math.min(...positions.map(p => p.x))
    const maxX = Math.max(...positions.map(p => p.x))
    const minY = Math.min(...positions.map(p => p.y))
    const maxY = Math.max(...positions.map(p => p.y))

    const width = maxX - minX + 400
    const height = maxY - minY + 400

    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth
      const containerHeight = containerRef.current.clientHeight

      const zoomX = containerWidth / width
      const zoomY = containerHeight / height
      const newZoom = Math.min(zoomX, zoomY, 1)

      const centerX = (minX + maxX) / 2
      const centerY = (minY + maxY) / 2

      setZoom(newZoom)
      setPan({
        x: containerWidth / 2 - centerX * newZoom,
        y: containerHeight / 2 - centerY * newZoom
      })
    }
  }, [nodePositions])

  const handleAutoArrange = useCallback(async () => {
    if (isAutoArranging || nodePositions.size === 0) return

    setIsAutoArranging(true)
    // Simulate force-directed layout
    const newPositions = new Map(nodePositions)
    const collections = schema?.collections || []

    // Simple force-directed algorithm
    for (let iteration = 0; iteration < 50; iteration++) {
      collections.forEach((col: any, i: number) => {
        const pos = newPositions.get(col.name)
        if (!pos) return

        let fx = 0
        let fy = 0

        // Repulsion from other nodes
        collections.forEach((other: any, j: number) => {
          if (i === j) return
          const otherPos = newPositions.get(other.name)
          if (!otherPos) return

          const dx = pos.x - otherPos.x
          const dy = pos.y - otherPos.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          const force = 50000 / (dist * dist)

          fx += (dx / dist) * force
          fy += (dy / dist) * force
        })

        // Attraction to related nodes
        const relationships = schema?.relationships || []
        relationships.forEach((rel: any) => {
          if (rel.from === col.name) {
            const targetPos = newPositions.get(rel.to)
            if (targetPos) {
              const dx = targetPos.x - pos.x
              const dy = targetPos.y - pos.y
              const dist = Math.sqrt(dx * dx + dy * dy) || 1
              const force = dist * 0.1

              fx += (dx / dist) * force
              fy += (dy / dist) * force
            }
          }
        })

        // Apply forces with damping
        const newX = pos.x + fx * 0.01
        const newY = pos.y + fy * 0.01
        newPositions.set(col.name, { x: newX, y: newY })
      })
    }

    setNodePositions(newPositions)
    setIsAutoArranging(false)
    toast.success('Layout arranged!')
  }, [schema, nodePositions, isAutoArranging])

  const handleNodeSelect = useCallback((nodeId: string, multiSelect: boolean = false) => {
    setSelectedNodes(prev => {
      const newSet = new Set(prev)
      if (multiSelect) {
        if (newSet.has(nodeId)) {
          newSet.delete(nodeId)
        } else {
          newSet.add(nodeId)
        }
      } else {
        newSet.clear()
        newSet.add(nodeId)
      }
      return newSet
    })
    setSelectedEdges(new Set())
  }, [])

  const handleEdgeSelect = useCallback((edgeId: string, multiSelect: boolean = false) => {
    setSelectedEdges(prev => {
      const newSet = new Set(prev)
      if (multiSelect) {
        if (newSet.has(edgeId)) {
          newSet.delete(edgeId)
        } else {
          newSet.add(edgeId)
        }
      } else {
        newSet.clear()
        newSet.add(edgeId)
      }
      return newSet
    })
    setSelectedNodes(new Set())
  }, [])

  const handleNodePositionChange = useCallback((nodeId: string, x: number, y: number) => {
    setNodePositions(prev => {
      const newMap = new Map(prev)
      newMap.set(nodeId, { x, y })
      return newMap
    })
  }, [])

  const handleContextMenu = useCallback((e: React.MouseEvent, type: 'node' | 'canvas', data?: any) => {
    e.preventDefault()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      type,
      data
    })
  }, [])

  const handleClearSelection = useCallback(() => {
    setSelectedNodes(new Set())
    setSelectedEdges(new Set())
  }, [])

  // Sanitize schema objects to avoid rendering raw objects as React children
  function sanitizeSchema(raw: any) {
    if (!raw) return raw
    const collections = Array.isArray(raw.collections) ? raw.collections.map((col: any) => ({
      ...col,
      name: String(col.name),
      documentCount: Number(col.documentCount || 0),
      // Ensure fields are plain values
      fields: Array.isArray(col.fields) ? col.fields.map((f: any) => ({
        name: String(f.name),
        type: String(f.type),
        sampleValues: Array.isArray(f.sampleValues) ? f.sampleValues : []
      })) : [],
      // Convert index objects to strings for safe rendering
      indexes: Array.isArray(col.indexes)
        ? col.indexes.map((ix: any) => (typeof ix === 'string' ? ix : JSON.stringify(ix)))
        : []
    })) : []

    const relationships = Array.isArray(raw.relationships) ? raw.relationships.map((rel: any) => ({
      from: String(rel.from),
      to: String(rel.to),
      field: typeof rel.field === 'string' ? rel.field : JSON.stringify(rel.field),
      type: typeof rel.type === 'string' ? rel.type : String(rel.type)
    })) : []

    return { ...raw, collections, relationships }
  }

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-black">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500 mb-4" />
        <p className="text-lg text-gray-300">Extracting database schema...</p>
        <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
      </div>
    )
  }

  const selectedNode = selectedNodes.size === 1 
    ? schema?.collections?.find((c: any) => c.name === Array.from(selectedNodes)[0])
    : null

  return (
    <div className="h-full flex flex-col relative bg-black overflow-hidden">
      {/* Top Bar */}
      <div className="h-16 backdrop-blur-md bg-black/50 border-b border-white/10 flex items-center justify-between px-6 z-40">
        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors lg:hidden"
            title="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-xl font-bold text-white">{project.name}</h1>
            <p className="text-sm text-gray-400">{project.databaseName}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onToggleChat}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors lg:hidden"
            title="Toggle Chat"
          >
            <MessageSquare className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden bg-black"
        onContextMenu={(e) => handleContextMenu(e, 'canvas')}
        onClick={() => {
          if (contextMenu) setContextMenu(null)
        }}
      >
        {schema && (
          <CanvasRenderer
            schema={schema}
            zoom={zoom}
            pan={pan}
            onPanChange={setPan}
            onZoomChange={setZoom}
            nodePositions={nodePositions}
            onNodePositionChange={handleNodePositionChange}
            selectedNodes={selectedNodes}
            selectedEdges={selectedEdges}
            hoveredNode={hoveredNode}
            hoveredEdge={hoveredEdge}
            onNodeSelect={handleNodeSelect}
            onEdgeSelect={handleEdgeSelect}
            onNodeHover={setHoveredNode}
            onEdgeHover={setHoveredEdge}
            onContextMenu={handleContextMenu}
            activeTool={activeTool}
            onClearSelection={handleClearSelection}
          />
        )}

        {/* Tool Panel */}
        <ToolPanel
          activeTool={activeTool}
          onToolChange={setActiveTool}
          onFitView={handleFitView}
          onAutoArrange={handleAutoArrange}
          isAutoArranging={isAutoArranging}
        />

        {/* Zoom Indicator */}
        <ZoomIndicator
          zoom={zoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
        />

        {/* Selected Node Info Panel */}
        <AnimatePresence>
          {selectedNode && (
            <TableInfoPanel
              node={selectedNode}
              schema={schema}
              onClose={() => setSelectedNodes(new Set())}
            />
          )}
        </AnimatePresence>

        {/* Context Menu */}
        <AnimatePresence>
          {contextMenu && (
            <ContextMenu
              x={contextMenu.x}
              y={contextMenu.y}
              type={contextMenu.type}
              onClose={() => setContextMenu(null)}
              onRefresh={fetchSchema}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
