'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Database, Key, CheckCircle, Loader2, AlertCircle, ExternalLink, Copy, Check } from 'lucide-react'
import { apiClient } from '@/lib/api/client'
import toast from 'react-hot-toast'

interface CreateProjectModalProps {
  onClose: () => void
  onSuccess?: () => void
}

export default function CreateProjectModal({ onClose, onSuccess }: CreateProjectModalProps) {
  const [step, setStep] = useState(1)
  const [validating, setValidating] = useState(false)
  const [connectionValid, setConnectionValid] = useState(false)
  const [creating, setCreating] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [copied, setCopied] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    mongoUri: '',
    apiKey: ''
  })

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleValidateConnection = async () => {
    if (!formData.mongoUri) {
      toast.error('Please enter MongoDB URI')
      return
    }

    // Check for placeholder
    if (formData.mongoUri.includes('<db_password>') || formData.mongoUri.includes('<password>')) {
      toast.error('Please replace <db_password> with your actual MongoDB password')
      return
    }

    setValidating(true)
    try {
      const response = await apiClient.post('/projects/validate-connection', { 
        mongoUri: formData.mongoUri 
      })
      setConnectionValid(true)
      toast.success(`Connected to database: ${response.data.data.databaseName}`)
      setTimeout(() => setStep(3), 500)
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.response?.data?.message || 'Connection failed'
      toast.error(errorMsg)
      setConnectionValid(false)
      
      // Show help if authentication error
      if (errorMsg.includes('auth') || errorMsg.includes('credentials')) {
        setShowHelp(true)
      }
    } finally {
      setValidating(false)
    }
  }

  const handleSubmit = async () => {
    if (!formData.name) {
      toast.error('Please enter project name')
      return
    }

    setCreating(true)
    try {
      const response = await apiClient.post('/projects', formData)
      toast.success('Project created successfully!')
      
      // Wait a moment for backend to process
      await new Promise(resolve => setTimeout(resolve, 500))
      
      onSuccess?.()
      onClose()
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create project')
    } finally {
      setCreating(false)
    }
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-2xl backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        >
          <div className="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-black/50 backdrop-blur-md z-10">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Database className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Create New Project</h2>
                <p className="text-sm text-gray-400">Step {step} of 3</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 py-4 border-b border-white/10">
            <div className="flex items-center justify-between mb-2">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`flex-1 h-1 rounded-full mx-1 transition-colors ${
                    s <= step ? 'bg-primary' : 'bg-white/10'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <h3 className="text-xl font-bold mb-2">Project Details</h3>
                  <p className="text-gray-400 mb-6">Give your project a name</p>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">Project Name</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="My MongoDB Project"
                      className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg focus:border-primary focus:outline-none transition-colors"
                      autoFocus
                    />
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <h3 className="text-xl font-bold mb-2">MongoDB Connection</h3>
                  <p className="text-gray-400 mb-6">Connect to your MongoDB database</p>
                  
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium">MongoDB URI</label>
                        <button
                          onClick={() => setShowHelp(!showHelp)}
                          className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                          {showHelp ? 'Hide' : 'Need help?'}
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={formData.mongoUri}
                        onChange={(e) => {
                          setFormData({ ...formData, mongoUri: e.target.value })
                          setConnectionValid(false)
                        }}
                        placeholder="mongodb+srv://username:password@cluster.mongodb.net/database"
                        className="w-full px-4 py-3 bg-black/20 border border-white/10 rounded-lg focus:border-primary focus:outline-none transition-colors font-mono text-sm"
                      />
                    </div>

                    {showHelp && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-start gap-2">
                          <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                          <div className="text-sm space-y-2">
                            <p className="font-semibold text-blue-400">How to get your MongoDB URI:</p>
                            <ol className="list-decimal list-inside space-y-2 text-gray-300">
                              <li>Go to <a href="https://cloud.mongodb.com" target="_blank" className="text-primary hover:underline">MongoDB Atlas</a></li>
                              <li>Click "Connect" on your cluster</li>
                              <li>Select "Connect your application"</li>
                              <li>Copy the connection string</li>
                              <li className="font-semibold text-yellow-400">Replace &lt;db_password&gt; with your actual password</li>
                              <li>Add your database name at the end: <code className="bg-black/30 px-2 py-1 rounded text-xs">/your-database-name</code></li>
                            </ol>
                            <div className="mt-3 p-3 bg-black/30 rounded">
                              <p className="text-xs text-gray-400 mb-2">Example:</p>
                              <div className="flex items-center justify-between gap-2">
                                <code className="text-xs text-green-400 break-all">
                                  mongodb+srv://user:myPass123@cluster.mongodb.net/mydb
                                </code>
                              </div>
                            </div>
                            <p className="text-yellow-400 text-xs mt-2">⚠️ Make sure to use a READ-ONLY user for security</p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Groq API Key (Optional)
                      </label>
                      <div className="relative">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="password"
                          value={formData.apiKey}
                          onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                          placeholder="gsk_..."
                          className="w-full pl-10 pr-4 py-3 bg-black/20 border border-white/10 rounded-lg focus:border-primary focus:outline-none transition-colors font-mono text-sm"
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-2">
                        Get your free API key from{' '}
                        <a href="https://console.groq.com" target="_blank" className="text-primary hover:underline">
                          console.groq.com
                        </a>
                      </p>
                    </div>

                    <button
                      onClick={handleValidateConnection}
                      disabled={validating || !formData.mongoUri}
                      className="w-full py-3 bg-primary/10 border border-primary/50 hover:bg-primary/20 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                    >
                      {validating ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>Testing Connection...</span>
                        </>
                      ) : connectionValid ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          <span>Connection Successful!</span>
                        </>
                      ) : (
                        <span>Test Connection</span>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <div className="text-center py-8">
                    <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle className="w-10 h-10 text-green-500" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">All Set!</h3>
                    <p className="text-gray-400 mb-6">
                      Your MongoDB connection is verified and ready
                    </p>
                    
                    <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-lg p-6 mb-6">
                      <div className="space-y-3 text-left">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Project Name:</span>
                          <span className="font-medium">{formData.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Connection:</span>
                          <span className="font-medium text-green-500">Verified</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">AI Queries:</span>
                          <span className="font-medium">
                            {formData.apiKey ? 'Unlimited' : 'Shared'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-between p-6 border-t border-white/10">
            <button
              onClick={() => step > 1 ? setStep(step - 1) : onClose()}
              className="px-4 py-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              {step === 1 ? 'Cancel' : 'Back'}
            </button>
            
            {step < 3 ? (
              <button
                onClick={() => {
                  if (step === 1 && !formData.name) {
                    toast.error('Please enter project name')
                    return
                  }
                  setStep(step + 1)
                }}
                disabled={step === 2 && !connectionValid}
                className="px-6 py-2 bg-primary hover:bg-primary-hover rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={creating}
                className="px-6 py-2 bg-primary hover:bg-primary-hover rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <span>Create Project</span>
                )}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}