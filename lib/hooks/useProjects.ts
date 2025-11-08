import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '../api/client'
import { useProjectStore } from '../store/projectStore'
import toast from 'react-hot-toast'

export function useProjects() {
  const queryClient = useQueryClient()
  const { setProjects, addProject, updateProject, removeProject } = useProjectStore()

  const { data: projects, isLoading, refetch } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const response = await apiClient.get('/projects')
      const projects = response.data.data.projects
      setProjects(projects)
      return projects
    },
  })

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; mongoUri: string; apiKey?: string }) => {
      const response = await apiClient.post('/projects', data)
      return response.data.data.project
    },
    onSuccess: (project) => {
      addProject(project)
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Project created successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to create project')
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiClient.patch(`/projects/${id}`, data)
      return response.data.data.project
    },
    onSuccess: (project) => {
      updateProject(project.id, project)
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Project updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to update project')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/projects/${id}`)
      return id
    },
    onSuccess: (id) => {
      removeProject(id)
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Project deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to delete project')
    },
  })

  const validateConnection = async (mongoUri: string) => {
    const response = await apiClient.post('/projects/validate-connection', { mongoUri })
    return response.data.data
  }

  return {
    projects,
    isLoading,
    createProject: createMutation.mutate,
    updateProject: updateMutation.mutate,
    deleteProject: deleteMutation.mutate,
    validateConnection,
    refetchProjects: refetch,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}