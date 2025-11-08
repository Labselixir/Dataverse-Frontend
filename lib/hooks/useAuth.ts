import { useAuthStore } from '../store/authStore'
import { apiClient } from '../api/client'
import Cookies from 'js-cookie'

export function useAuth() {
  const { user, organization, setUser, setOrganization, setTokens, clearAuth } = useAuthStore()

  const login = async (email: string, password: string) => {
    const response = await apiClient.post('/auth/login', { email, password })
    const { user, organizations, accessToken, refreshToken } = response.data.data

    setUser(user)
    setOrganization(organizations[0])
    setTokens(accessToken, refreshToken)
    
    Cookies.set('accessToken', accessToken)
    Cookies.set('refreshToken', refreshToken)
  }

  const signup = async (name: string, email: string, password: string) => {
    const response = await apiClient.post('/auth/signup', { name, email, password })
    const { user, organization, accessToken, refreshToken } = response.data.data

    setUser(user)
    setOrganization(organization)
    setTokens(accessToken, refreshToken)
    
    Cookies.set('accessToken', accessToken)
    Cookies.set('refreshToken', refreshToken)
  }

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      clearAuth()
      Cookies.remove('accessToken')
      Cookies.remove('refreshToken')
    }
  }

  const updateProfile = async (updates: { name?: string; profileImage?: string }) => {
    const response = await apiClient.patch('/auth/profile', updates)
    setUser(response.data.data.user)
  }

  return {
    user,
    organization,
    login,
    signup,
    logout,
    updateProfile,
    isAuthenticated: !!user,
  }
}