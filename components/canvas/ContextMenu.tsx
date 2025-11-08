'use client'

import { motion } from 'framer-motion'
import {
  Copy,
  Trash2,
  Download,
  Palette,
  Lock,
  Square,
  RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'

interface ContextMenuProps {
  x: number
  y: number
  type: 'node' | 'canvas'
  data?: any
  onClose: () => void
  onRefresh: () => void
}

export default function ContextMenu({
  x,
  y,
  type,
  onClose,
  onRefresh
}: ContextMenuProps) {
  const handleDuplicate = () => {
    toast.success('Collection duplicated')
    onClose()
  }

  const handleDelete = () => {
    toast.error('Collection deleted')
    onClose()
  }

  const handleExport = () => {
    toast.success('Schema exported')
    onClose()
  }

  const handleRefresh = () => {
    onRefresh()
    toast.success('Schema refreshed')
    onClose()
  }

  const nodeMenuItems = [
    { icon: Copy, label: 'Duplicate', onClick: handleDuplicate },
    { icon: RefreshCw, label: 'Refresh', onClick: handleRefresh },
    { icon: Download, label: 'Export Schema', onClick: handleExport },
    { icon: Palette, label: 'Change Color', onClick: () => toast.success('Color changed') },
    { icon: Lock, label: 'Lock Position', onClick: () => toast.success('Position locked') },
    { icon: Square, label: 'Add to Frame', onClick: () => toast.success('Added to frame') },
    { icon: Trash2, label: 'Delete', onClick: handleDelete, danger: true },
  ]

  const canvasMenuItems = [
    { icon: Copy, label: 'Create Table', onClick: () => toast.success('Table created') },
    { icon: Copy, label: 'Paste', onClick: () => toast.success('Pasted') },
    { icon: Copy, label: 'Select All', onClick: () => toast.success('All selected') },
    { icon: RefreshCw, label: 'Layout Reset', onClick: () => toast.success('Layout reset') },
  ]

  const items = type === 'node' ? nodeMenuItems : canvasMenuItems

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      style={{
        position: 'fixed',
        left: x,
        top: y,
        zIndex: 50
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="backdrop-blur-md bg-black/95 border border-white/12 rounded-xl shadow-2xl overflow-hidden min-w-48">
        {items.map((item, idx) => {
          const Icon = item.icon
          return (
            <motion.button
              key={idx}
              whileHover={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
              onClick={() => {
                item.onClick()
                onClose()
              }}
              className={`
                w-full px-4 py-3 flex items-center gap-3 text-left transition-colors
                ${item.danger ? 'text-red-400 hover:bg-red-500/10' : 'text-white hover:bg-white/8'}
                ${idx < items.length - 1 ? 'border-b border-white/5' : ''}
              `}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm font-medium">{item.label}</span>
            </motion.button>
          )
        })}
      </div>
    </motion.div>
  )
}
