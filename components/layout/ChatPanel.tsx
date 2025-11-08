'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, Send, Sparkles, Loader2, Database, Copy, Check, X, GripVertical } from 'lucide-react'
import { apiClient } from '@/lib/api/client'
import toast from 'react-hot-toast'
import ReactMarkdown from 'react-markdown'

interface ChatPanelProps {
  collapsed: boolean
  onToggle: () => void
  project: any
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  metadata?: any
}

export default function ChatPanel({ collapsed, onToggle, project }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [activeSuggestions, setActiveSuggestions] = useState<string[]>([])
  const [width, setWidth] = useState(380)
  const [isResizing, setIsResizing] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchChatHistory()
    fetchSuggestions()
  }, [project.id])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return

      const newWidth = window.innerWidth - e.clientX
      if (newWidth > 300 && newWidth < 600) {
        setWidth(newWidth)
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isResizing])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchChatHistory = async () => {
    try {
      const response = await apiClient.get(`/chat/history/${project.id}`)
      const history = response.data.data.messages.map((msg: any) => ({
        id: msg._id,
        role: msg.userId ? 'user' : 'assistant',
        content: msg.userId ? msg.message : msg.aiResponse,
        timestamp: new Date(msg.createdAt),
        metadata: msg.metadata
      }))
      setMessages(history)
    } catch (error) {
      console.error('Failed to fetch chat history:', error)
    }
  }

  const fetchSuggestions = async () => {
    try {
      const response = await apiClient.post('/chat/suggestions', {
        projectId: project.id,
        context: 'general'
      })
      const newSuggestions = response.data.data.suggestions.slice(0, 4)
      setSuggestions(newSuggestions)
      setActiveSuggestions(newSuggestions)
    } catch (error) {
      console.error('Failed to fetch suggestions:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      const response = await apiClient.post('/chat/message', {
        projectId: project.id,
        message: userMessage.content
      })

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.data.response,
        timestamp: new Date(),
        metadata: response.data.data.metadata
      }

      setMessages(prev => [...prev, aiMessage])
      
      if (response.data.data.suggestions) {
        setActiveSuggestions(response.data.data.suggestions)
      }
    } catch (error: any) {
      toast.error('Failed to send message')
      console.error('Chat error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)
    setTimeout(() => {
      inputRef.current?.focus()
    }, 0)
  }

  const removeSuggestion = (suggestion: string) => {
    setActiveSuggestions(prev => prev.filter(s => s !== suggestion))
  }

  return (
    <motion.div
      ref={panelRef}
      className="h-full flex flex-col relative group"
      style={{
        width: collapsed ? 60 : width,
        background: 'linear-gradient(135deg, rgba(5, 5, 5, 0.98) 0%, rgba(15, 15, 15, 0.99) 100%)',
        backdropFilter: 'blur(20px)',
        borderLeft: '1px solid rgba(255, 255, 255, 0.06)',
        transition: 'width 0.3s ease-out'
      }}
    >
      {/* Resize Handle */}
      {!collapsed && (
        <motion.div
          onMouseDown={() => setIsResizing(true)}
          className="absolute left-0 top-0 w-1 h-full cursor-col-resize hover:bg-white/20 transition-colors duration-200 group-hover:bg-white/15"
          style={{
            background: isResizing ? 'rgba(255, 255, 255, 0.3)' : 'transparent'
          }}
        />
      )}

      {/* Header */}
      <div 
        className="h-16 flex items-center justify-between px-4 border-b"
        style={{ borderColor: 'rgba(255, 255, 255, 0.06)' }}
      >
        <button
          onClick={onToggle}
          className="p-2 hover:bg-white/8 rounded-lg transition-colors duration-200"
        >
          {collapsed ? <ChevronLeft className="w-4 h-4 text-white/50" /> : <ChevronRight className="w-4 h-4 text-white/50" />}
        </button>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center space-x-2"
          >
            <div className="w-2 h-2 bg-white/30 rounded-full animate-pulse" />
            <span className="font-semibold text-white text-sm">Dataverse AI</span>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <Sparkles className="w-8 h-8 text-white/60" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2 text-white/80">Database AI</h3>
                  <p className="text-xs text-white/40 mb-6 max-w-xs leading-relaxed">
                    Ask me anything about your database schema, relationships, or data
                  </p>
                </div>
              ) : (
                messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))
              )}

              {loading && (
                <div className="flex items-start space-x-3">
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <Sparkles className="w-4 h-4 text-white/60" />
                  </div>
                  <div 
                    className="flex-1 rounded-lg p-3"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.1)'
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin text-white/60" />
                      <span className="text-sm text-white/50">Analyzing your database...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions Pills */}
            {activeSuggestions.length > 0 && (
              <div className="px-4 pb-4">
                <div className="text-xs text-white/40 mb-3 font-medium">Suggestions</div>
                <div className="flex flex-wrap gap-2">
                  {activeSuggestions.map((suggestion, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="group relative px-3 py-1.5 rounded-full text-xs transition-all duration-200 hover:scale-105"
                      style={{
                        background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: 'rgba(255, 255, 255, 0.7)'
                      }}
                    >
                      <span className="truncate">{suggestion}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          removeSuggestion(suggestion)
                        }}
                        className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3 text-white/40 hover:text-white/60" />
                      </button>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div 
              className="border-t p-4"
              style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}
            >
              <div className="relative">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about your database..."
                  rows={3}
                  className="w-full px-4 py-3 pr-12 rounded-lg focus:outline-none transition-all duration-200 resize-none text-sm text-white placeholder-white/30"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)'
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.05) 100%)'
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)'
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || loading}
                  className="absolute right-2 bottom-2 p-2 rounded-lg transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.08) 100%)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: 'rgba(255, 255, 255, 0.8)'
                  }}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-2 text-xs text-white/30">
                Press Enter to send, Shift+Enter for new line
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed Icon */}
      {collapsed && (
        <div className="flex-1 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-white/40" />
        </div>
      )}
    </motion.div>
  )
}

function ChatMessage({ message }: { message: Message }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className={`flex items-start space-x-3 ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
      <div 
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={{
          background: message.role === 'user' 
            ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.05) 100%)'
            : 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.03) 100%)',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        {message.role === 'user' ? (
          <Database className="w-4 h-4 text-white/70" />
        ) : (
          <Sparkles className="w-4 h-4 text-white/60" />
        )}
      </div>
      
      <div className={`flex-1 group ${message.role === 'user' ? 'flex justify-end' : ''}`}>
        <div
          className="relative max-w-2xl rounded-lg p-4"
          style={{
            background: message.role === 'user'
              ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.12) 0%, rgba(255, 255, 255, 0.05) 100%)'
              : 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.03) 100%)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.05)'
          }}
        >
          <div className="prose prose-invert max-w-none text-white/90">
            {message.role === 'assistant' ? (
              <ReactMarkdown
                components={{
                  h1: ({node, ...props}) => <h1 className="text-xl font-bold mt-4 mb-3 text-white" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-lg font-semibold mt-3 mb-2 text-white/95" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-base font-medium mt-3 mb-2 text-white/90" {...props} />,
                  p: ({node, ...props}) => <p className="text-sm mb-3 text-white/85 leading-relaxed" {...props} />,
                  ul: ({node, ...props}) => <ul className="text-sm mb-3 ml-4 space-y-2 text-white/80" {...props} />,
                  ol: ({node, ...props}) => <ol className="text-sm mb-3 ml-4 space-y-2 text-white/80" {...props} />,
                  li: ({node, ...props}) => <li className="text-sm text-white/80 leading-relaxed" {...props} />,
                  table: ({node, ...props}) => (
                    <div className="mb-4 overflow-x-auto">
                      <table className="min-w-full text-sm border-collapse bg-white/5 rounded-lg overflow-hidden shadow-lg" {...props} />
                    </div>
                  ),
                  th: ({node, ...props}) => (
                    <th className="border border-white/15 px-4 py-3 text-white font-semibold text-left bg-gradient-to-r from-white/10 to-white/5" {...props} />
                  ),
                  td: ({node, ...props}) => (
                    <td className="border border-white/10 px-4 py-3 text-white/85" {...props} />
                  ),
                  code: ({node, ...props}) => <code className="bg-white/15 px-2 py-1 rounded text-sm text-white font-mono" {...props} />,
                  blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-white/30 pl-4 italic text-white/70 text-sm my-3 bg-white/5 py-2 px-3 rounded-r" {...props} />,
                  strong: ({node, ...props}) => <strong className="text-white font-semibold" {...props} />,
                  em: ({node, ...props}) => <em className="text-white/90 italic" {...props} />,
                }}
              >
                {message.content}
              </ReactMarkdown>
            ) : (
              <p className="text-sm text-white/85 leading-relaxed">{message.content}</p>
            )}
          </div>
          
          {message.role === 'assistant' && (
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 p-1 opacity-0 group-hover:opacity-100 hover:bg-white/10 rounded transition-all"
              title="Copy to clipboard"
            >
              {copied ? (
                <Check className="w-3 h-3 text-white/60" />
              ) : (
                <Copy className="w-3 h-3 text-white/40" />
              )}
            </button>
          )}
          
          <div className="mt-2 text-xs text-white/30">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </div>
  )
}