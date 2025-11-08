'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Sidebar from '@/components/layout/Sidebar'
import Canvas from '@/components/canvas/Canvas'
import ChatPanel from '@/components/layout/ChatPanel'
import { useProjectStore } from '@/lib/store/projectStore'
import { apiClient } from '@/lib/api/client'
import { Loader2 } from 'lucide-react'

export default function ProjectPage() {
  const params = useParams()
  const { currentProject, setCurrentProject } = useProjectStore()
  const [loading, setLoading] = useState(true)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [chatCollapsed, setChatCollapsed] = useState(false)

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await apiClient.get(`/projects/${params.id}`)
        const project = response.data.data.project
        
        // Ensure schema is available
        if (!project.schema?.collections && project.schemaCache?.collections) {
          project.schema = project.schemaCache
        }
        
        setCurrentProject(project)
      } catch (error) {
        console.error('Failed to fetch project:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProject()
  }, [params.id, setCurrentProject])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!currentProject) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Project not found</h2>
          <p className="text-gray-400">The project you're looking for doesn't exist</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex overflow-hidden bg-black">
      {/* Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        project={currentProject}
      />

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden">
        <Canvas
          project={currentProject}
          onToggleSidebar={() => setSidebarCollapsed(!sidebarCollapsed)}
          onToggleChat={() => setChatCollapsed(!chatCollapsed)}
        />
      </div>

      {/* Chat Panel */}
      <ChatPanel
        collapsed={chatCollapsed}
        onToggle={() => setChatCollapsed(!chatCollapsed)}
        project={currentProject}
      />
    </div>
  )
}