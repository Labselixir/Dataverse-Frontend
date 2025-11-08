'use client'

import { motion } from 'framer-motion'
import { Plus, Minus } from 'lucide-react'

interface ZoomIndicatorProps {
  zoom: number
  onZoomIn: () => void
  onZoomOut: () => void
}

export default function ZoomIndicator({
  zoom,
  onZoomIn,
  onZoomOut
}: ZoomIndicatorProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute bottom-6 right-6 z-30"
    >
      <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.6)] overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onZoomOut}
            disabled={zoom <= 0.25}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Zoom Out"
          >
            <Minus className="w-4 h-4 text-white/70" />
          </motion.button>

          <div className="w-14 text-center">
            <span className="text-sm font-mono text-white/80">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onZoomIn}
            disabled={zoom >= 4}
            className="p-1.5 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Zoom In"
          >
            <Plus className="w-4 h-4 text-white/70" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  )
}
