'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Search, MoreVertical, Database, Clock, Star, Trash2, Copy, Edit, Settings } from 'lucide-react'
import { useProjects } from '@/lib/hooks/useProjects'
import { useAuth } from '@/lib/hooks/useAuth'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'
import CreateProjectModal from '@/components/project/CreateProjectModal'
import ProjectCard from '@/components/project/ProjectCard'
import Header from '@/components/layout/Header'

export default function DashboardPage() {
  const { user, organization } = useAuth()
  const { projects, isLoading, refetchProjects } = useProjects()
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)

  const handleCreateSuccess = () => {
    // Refetch projects after creation
    refetchProjects()
    setShowCreateModal(false)
  }

  const filteredProjects = projects?.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.databaseName.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-black">
      <Header />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl font-bold mb-2">
              Welcome back, {user?.name?.split(' ')[0]}! 👋
            </h1>
            <p className="text-gray-400">
              Manage your MongoDB projects in <span className="text-primary">{organization?.name}</span>
            </p>
          </motion.div>
        </div>

        {/* Search and Actions */}
        <div className="flex items-center justify-between mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg focus:border-primary focus:outline-none transition-colors"
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowCreateModal(true)}
            className="ml-4 px-6 py-3 bg-primary hover:bg-primary-hover rounded-lg font-medium flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>New Project</span>
          </motion.button>
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="backdrop-blur-md bg-white/5 border border-white/10 rounded-xl p-6 animate-pulse">
                <div className="h-6 bg-white/10 rounded mb-4" />
                <div className="h-4 bg-white/10 rounded mb-2" />
                <div className="h-4 bg-white/10 rounded w-3/4" />
              </div>
            ))}
          </div>
        ) : filteredProjects && filteredProjects.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredProjects.map((project, index) => (
              <ProjectCard key={project.id} project={project} index={index} />
            ))}
          </motion.div>
        ) : (
          <EmptyState onCreateProject={() => setShowCreateModal(true)} />
        )}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <CreateProjectModal 
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleCreateSuccess}
        />
      )}
    </div>
  )
}

function EmptyState({ onCreateProject }: { onCreateProject: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-20"
    >
      <div className="mb-6">
        <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
          <Database className="w-12 h-12 text-primary" />
        </div>
        <h3 className="text-2xl font-bold mb-2">No projects yet</h3>
        <p className="text-gray-400 max-w-md mx-auto">
          Create your first project to start exploring your MongoDB databases with beautiful visualizations
        </p>
      </div>
      <button
        onClick={onCreateProject}
        className="px-6 py-3 bg-primary hover:bg-primary-hover rounded-lg font-medium inline-flex items-center space-x-2 transition-colors"
      >
        <Plus className="w-5 h-5" />
        <span>Create First Project</span>
      </button>
    </motion.div>
  )
}