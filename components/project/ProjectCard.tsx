'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Database, Clock, MoreVertical, Trash2, Copy, Edit, ExternalLink, Circle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import { useProjects } from '@/lib/hooks/useProjects'

interface ProjectCardProps {
  project: any
  index: number
}

export default function ProjectCard({ project, index }: ProjectCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const { deleteProject } = useProjects()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-500'
      case 'idle': return 'text-yellow-500'
      default: return 'text-gray-500'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      className="relative group"
    >
      <Link href={`/projects/${project.id}`}>
        <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6 hover:border-primary/50 transition-all cursor-pointer">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Database className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg">{project.name}</h3>
                <p className="text-sm text-gray-400">{project.databaseName}</p>
              </div>
            </div>
            
            <button
              onClick={(e) => {
                e.preventDefault()
                setShowMenu(!showMenu)
              }}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="backdrop-blur-md bg-white/5 rounded-lg p-3">
              <div className="text-2xl font-bold text-primary">
                {project.collectionsCount || 0}
              </div>
              <div className="text-xs text-gray-400">Collections</div>
            </div>
            <div className="backdrop-blur-md bg-white/5 rounded-lg p-3">
              <div className={`flex items-center space-x-1 ${getStatusColor(project.connectionStatus)}`}>
                <Circle className="w-2 h-2 fill-current" />
                <span className="text-xs capitalize">{project.connectionStatus}</span>
              </div>
              <div className="text-xs text-gray-400 mt-1">Status</div>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-gray-400">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{formatDistanceToNow(new Date(project.lastAccessed), { addSuffix: true })}</span>
            </div>
            <ExternalLink className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </Link>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute right-0 top-16 z-50 w-48 backdrop-blur-md bg-black/80 border border-white/10 rounded-lg shadow-xl overflow-hidden"
          >
            <button className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors flex items-center space-x-2">
              <Edit className="w-4 h-4" />
              <span>Rename</span>
            </button>
            <button className="w-full px-4 py-3 text-left hover:bg-white/10 transition-colors flex items-center space-x-2">
              <Copy className="w-4 h-4" />
              <span>Duplicate</span>
            </button>
            <div className="border-t border-white/10" />
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this project?')) {
                  deleteProject(project.id)
                }
                setShowMenu(false)
              }}
              className="w-full px-4 py-3 text-left hover:bg-red-500/10 text-red-500 transition-colors flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </motion.div>
        </>
      )}
    </motion.div>
  )
}