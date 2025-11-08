'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, ArrowLeft } from 'lucide-react'
import toast from 'react-hot-toast'
import { apiClient } from '@/lib/api/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await apiClient.post('/auth/forgot-password', { email })
      setSent(true)
      toast.success('Reset instructions sent to your email')
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Mail className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold mb-2">Check Your Email</h1>
        <p className="text-gray-400 mb-6">
          We've sent password reset instructions to <strong>{email}</strong>
        </p>
        <Link
          href="/login"
          className="inline-flex items-center space-x-2 text-primary hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Sign In</span>
        </Link>
      </div>
    )
  }

  return (
    <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Reset Password</h1>
        <p className="text-gray-400">Enter your email to receive reset instructions</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Email</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-black/20 border border-white/10 rounded-lg focus:border-primary focus:outline-none transition-colors"
              placeholder="you@example.com"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-primary hover:bg-primary-hover rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
          ) : (
            'Send Reset Instructions'
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link
          href="/login"
          className="inline-flex items-center space-x-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Sign In</span>
        </Link>
      </div>
    </div>
  )
}