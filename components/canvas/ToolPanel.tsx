'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  MousePointer as Pointer,
  Hand as HandIcon,
  ZoomIn as ZoomInIcon,
  Plus as Plus,
  Link2,
  MessageSquare as MessageIcon,
  Square as FrameIcon,
  Maximize as FitIcon,
  Wand2,
  Loader2
} from 'lucide-react'

interface ToolPanelProps {
  activeTool: string
  onToolChange: (tool: string) => void
  onFitView: () => void
  onAutoArrange: () => void
  isAutoArranging: boolean
}

const tools = [
  { id: 'select', icon: Pointer, label: 'Select', shortcut: 'S' },
  { id: 'pan', icon: HandIcon, label: 'Pan', shortcut: 'H' },
  { id: 'zoom', icon: ZoomInIcon, label: 'Zoom', shortcut: 'Z' },
  { id: 'create', icon: Plus, label: 'Create Table', shortcut: 'T' },
  { id: 'connect', icon: Link2, label: 'Connect', shortcut: 'C' },
  { id: 'comment', icon: MessageIcon, label: 'Comment', shortcut: 'M' },
  { id: 'frame', icon: FrameIcon, label: 'Frame', shortcut: 'F' },
]

export default function ToolPanel({
  activeTool,
  onToolChange,
  onFitView,
  onAutoArrange,
  isAutoArranging
}: ToolPanelProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [mouseIdleTimer, setMouseIdleTimer] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const handleMouseMove = () => {
      setIsVisible(true)
      if (mouseIdleTimer) clearTimeout(mouseIdleTimer)

      const timer = setTimeout(() => {
        setIsVisible(false)
      }, 3000)

      setMouseIdleTimer(timer)
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (mouseIdleTimer) clearTimeout(mouseIdleTimer)
    }
  }, [mouseIdleTimer])

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: isVisible ? 1 : 0.5, x: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute bottom-6 left-6 z-30"
    >
      <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-2xl p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
        {/* Main Tools */}
        <div className="space-y-1">
          {tools.map((tool) => {
            const Icon = tool.icon
            const isActive = activeTool === tool.id

            return (
              <motion.button
                key={tool.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onToolChange(tool.id)}
                className={`
                  w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200
                  ${isActive
                    ? 'bg-white/20 border border-blue-400/50 shadow-[0_0_0_1px_rgba(96,165,250,0.4)]'
                    : 'bg-white/10 border border-white/10 hover:bg-white/15'
                  }
                `}
                title={`${tool.label} (${tool.shortcut})`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-white/70'}`} />
              </motion.button>
            )
          })}
        </div>

        {/* Divider */}
        <div className="h-px bg-white/10 my-2" />

        {/* Action Tools */}
        <div className="space-y-1">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onFitView}
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/10 border border-white/10 hover:bg-white/15 transition-all duration-200"
            title="Fit View (Shift+1)"
          >
            <FitIcon className="w-5 h-5 text-white/70" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAutoArrange}
            disabled={isAutoArranging}
            className="w-10 h-10 rounded-xl flex items-center justify-center bg-white/10 border border-white/10 hover:bg-white/15 transition-all duration-200 disabled:opacity-50"
            title="Auto Arrange (Shift+2)"
          >
            {isAutoArranging ? (
              <Loader2 className="w-5 h-5 text-white/70 animate-spin" />
            ) : (
              <Wand2 className="w-5 h-5 text-white/70" />
            )}
          </motion.button>
        </div>
      </div>

      {/* Tooltip */}
      <motion.div
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: -70 }}
        transition={{ delay: 0.2 }}
        className="absolute left-0 top-2 pointer-events-none"
      >
        <div className="bg-black/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
          {tools.find(t => t.id === activeTool)?.label || 'Select'}
        </div>
      </motion.div>
    </motion.div>
  )
}
