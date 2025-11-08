'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Search, Database, Layers, GitBranch, Settings, Star } from 'lucide-react'
import Link from 'next/link'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  project: any
}

export default function Sidebar({ collapsed, onToggle, project }: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'collections' | 'relationships'>('collections')

  const collections = project.schema?.collections || project.schemaCache?.collections || []
  const relationships = project.schema?.relationships || project.schemaCache?.relationships || []

  const filteredCollections = collections.filter((col: any) =>
    col.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <motion.div
      initial={false}
      animate={{ width: collapsed ? 60 : 280 }}
      className="h-full backdrop-blur-md bg-black/50 border-r border-white/10 flex flex-col"
    >
      {/* Header */}
      <div className="h-16 border-b border-white/10 flex items-center justify-between px-4">
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center space-x-2"
          >
            <Database className="w-5 h-5 text-primary" />
            <span className="font-medium">Explorer</span>
          </motion.div>
        )}
        <button
          onClick={onToggle}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {/* Search */}
            <div className="p-4 border-b border-white/10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-primary focus:outline-none transition-colors text-sm"
                />
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/10">
              <button
                onClick={() => setActiveTab('collections')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'collections'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Layers className="w-4 h-4" />
                  <span>Collections</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('relationships')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'relationships'
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <GitBranch className="w-4 h-4" />
                  <span>Relations</span>
                </div>
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeTab === 'collections' ? (
                <div className="space-y-2">
                  {filteredCollections.length > 0 ? (
                    filteredCollections.map((collection: any, index: number) => (
                      <motion.div
                        key={collection.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="group p-3 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Database className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium">{collection.name}</span>
                          </div>
                          <Star className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                          <span>{collection.fields?.length || 0} fields</span>
                          <span>{collection.documentCount?.toLocaleString() || 0} docs</span>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      No collections found
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {relationships.length > 0 ? (
                    relationships.map((rel: any, index: number) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="p-3 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer transition-all"
                      >
                        <div className="flex items-center space-x-2 mb-2">
                          <GitBranch className="w-4 h-4 text-primary" />
                          <span className="text-xs text-gray-400">{rel.type}</span>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">{rel.from}</span>
                          <span className="text-gray-400 mx-2">→</span>
                          <span className="font-medium">{rel.to}</span>
                        </div>
                        <div className="mt-1 text-xs text-gray-400 font-mono">{rel.field}</div>
                      </motion.div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-400 text-sm">
                      No relationships found
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-white/10 p-4">
              <Link
                href="/dashboard"
                className="block w-full py-2 text-center text-sm text-gray-400 hover:text-white transition-colors"
              >
                Back to Dashboard
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Collapsed Icons */}
      {collapsed && (
        <div className="flex-1 flex flex-col items-center py-4 space-y-4">
          <button className="p-3 hover:bg-white/10 rounded-lg transition-colors">
            <Layers className="w-5 h-5" />
          </button>
          <button className="p-3 hover:bg-white/10 rounded-lg transition-colors">
            <GitBranch className="w-5 h-5" />
          </button>
        </div>
      )}
    </motion.div>
  )
}