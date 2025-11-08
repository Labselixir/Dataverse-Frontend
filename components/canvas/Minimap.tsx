'use client'

import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

interface MinimapProps {
  schema: any
  nodePositions: Map<string, { x: number; y: number }>
  zoom: number
  pan: { x: number; y: number }
  onNavigate: (x: number, y: number) => void
}

export default function Minimap({
  schema,
  nodePositions,
  zoom,
  pan,
  onNavigate
}: MinimapProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || nodePositions.size === 0) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const width = canvas.offsetWidth
    const height = canvas.offsetHeight

    // Calculate bounds
    const positions = Array.from(nodePositions.values())
    const minX = Math.min(...positions.map(p => p.x))
    const maxX = Math.max(...positions.map(p => p.x))
    const minY = Math.min(...positions.map(p => p.y))
    const maxY = Math.max(...positions.map(p => p.y))

    const contentWidth = maxX - minX + 400
    const contentHeight = maxY - minY + 400

    const scaleX = width / contentWidth
    const scaleY = height / contentHeight
    const scale = Math.min(scaleX, scaleY)

    const offsetX = (width - contentWidth * scale) / 2 - minX * scale
    const offsetY = (height - contentHeight * scale) / 2 - minY * scale

    // Clear canvas
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, width, height)

    // Draw border
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = 1
    ctx.strokeRect(0, 0, width, height)

    // Draw nodes
    nodePositions.forEach((pos, nodeId) => {
      const x = pos.x * scale + offsetX
      const y = pos.y * scale + offsetY
      const size = 4

      ctx.fillStyle = 'rgba(96, 165, 250, 0.6)'
      ctx.fillRect(x - size / 2, y - size / 2, size, size)
    })

    // Draw viewport indicator
    const viewportWidth = width / zoom
    const viewportHeight = height / zoom
    const viewportX = -pan.x / zoom
    const viewportY = -pan.y / zoom

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
    ctx.lineWidth = 2
    ctx.strokeRect(
      viewportX * scale + offsetX,
      viewportY * scale + offsetY,
      viewportWidth * scale,
      viewportHeight * scale
    )
  }, [nodePositions, zoom, pan])

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas || nodePositions.size === 0) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Calculate bounds
    const positions = Array.from(nodePositions.values())
    const minX = Math.min(...positions.map(p => p.x))
    const maxX = Math.max(...positions.map(p => p.x))
    const minY = Math.min(...positions.map(p => p.y))
    const maxY = Math.max(...positions.map(p => p.y))

    const contentWidth = maxX - minX + 400
    const contentHeight = maxY - minY + 400

    const scaleX = canvas.offsetWidth / contentWidth
    const scaleY = canvas.offsetHeight / contentHeight
    const scale = Math.min(scaleX, scaleY)

    const offsetX = (canvas.offsetWidth - contentWidth * scale) / 2 - minX * scale
    const offsetY = (canvas.offsetHeight - contentHeight * scale) / 2 - minY * scale

    // Convert click to world coordinates
    const worldX = (x - offsetX) / scale
    const worldY = (y - offsetY) / scale

    // Center on that point
    onNavigate(
      canvas.offsetWidth / 2 - worldX * zoom,
      canvas.offsetHeight / 2 - worldY * zoom
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="absolute top-6 right-6 z-30"
    >
      <div className="backdrop-blur-md bg-black/75 border border-white/12 rounded-xl shadow-xl overflow-hidden">
        <canvas
          ref={canvasRef}
          width={180}
          height={140}
          onClick={handleCanvasClick}
          className="block cursor-pointer hover:opacity-80 transition-opacity"
          title="Click to navigate"
        />
      </div>
    </motion.div>
  )
}
