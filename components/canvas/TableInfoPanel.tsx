'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { X, ChevronDown } from 'lucide-react'

interface TableInfoPanelProps {
  node: any
  schema: any
  onClose: () => void
}

export default function TableInfoPanel({
  node,
  schema,
  onClose
}: TableInfoPanelProps) {
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set())

  const toggleFieldExpand = (fieldName: string) => {
    setExpandedFields(prev => {
      const newSet = new Set(prev)
      if (newSet.has(fieldName)) {
        newSet.delete(fieldName)
      } else {
        newSet.add(fieldName)
      }
      return newSet
    })
  }

  const relatedCollections = schema?.relationships?.filter((rel: any) =>
    rel.from === node.name || rel.to === node.name
  ) || []

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="absolute right-6 top-24 w-96 backdrop-blur-md bg-black/80 border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-40"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">{node.name}</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-white/10 rounded transition-colors"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="max-h-96 overflow-y-auto">
        {/* Document Count */}
        <div className="px-6 py-4 border-b border-white/10">
          <div className="text-sm text-gray-400 mb-2">Documents</div>
          <div className="text-3xl font-bold text-blue-400">
            {node.documentCount?.toLocaleString() || 0}
          </div>
        </div>

        {/* Fields */}
        <div className="px-6 py-4 border-b border-white/10">
          <div className="text-sm text-gray-400 mb-3">Fields ({node.fields?.length || 0})</div>
          <div className="space-y-2">
            {node.fields?.map((field: any, idx: number) => {
              const isExpanded = expandedFields.has(field.name)

              return (
                <div key={idx} className="space-y-2">
                  <button
                    onClick={() => toggleFieldExpand(field.name)}
                    className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-left"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-xs text-white/40 flex-shrink-0">
                        {getFieldTypeIcon(field.type)}
                      </span>
                      <span className="text-sm font-mono text-white truncate">{field.name}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs px-2 py-1 bg-blue-500/15 text-blue-400 rounded">
                        {field.type}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-white/40 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </div>
                  </button>

                  {/* Expanded Field Details */}
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="ml-3 p-3 bg-black/30 rounded-lg border border-white/5"
                    >
                      <div className="text-xs text-gray-400 mb-2">Sample values:</div>
                      <div className="space-y-1">
                        {field.sampleValues?.slice(0, 3).map((value: any, i: number) => (
                          <div key={i} className="text-xs font-mono text-white/70 break-words">
                            {formatSampleValue(value)}
                          </div>
                        )) || (
                          <div className="text-xs text-white/40">No sample data</div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Relationships */}
        {relatedCollections.length > 0 && (
          <div className="px-6 py-4 border-b border-white/10">
            <div className="text-sm text-gray-400 mb-3">Relationships ({relatedCollections.length})</div>
            <div className="space-y-2">
              {relatedCollections.map((rel: any, idx: number) => (
                <div key={idx} className="p-3 bg-white/5 rounded-lg">
                  <div className="text-sm font-mono text-white mb-1">
                    {rel.from === node.name ? (
                      <>
                        <span className="text-blue-400">{rel.from}</span>
                        <span className="text-white/50"> → </span>
                        <span className="text-white/70">{rel.to}</span>
                      </>
                    ) : (
                      <>
                        <span className="text-white/70">{rel.from}</span>
                        <span className="text-white/50"> → </span>
                        <span className="text-blue-400">{rel.to}</span>
                      </>
                    )}
                  </div>
                  <div className="text-xs text-gray-400">
                    Field: <span className="text-white/70">{rel.field}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Indexes */}
        {node.indexes && node.indexes.length > 0 && (
          <div className="px-6 py-4">
            <div className="text-sm text-gray-400 mb-3">Indexes ({node.indexes.length})</div>
            <div className="space-y-2">
              {node.indexes.map((index: any, idx: number) => {
                const text = typeof index === 'string' ? index : JSON.stringify(index, null, 2)
                return (
                  <pre key={idx} className="p-2 bg-white/5 rounded text-xs font-mono text-white/70 whitespace-pre-wrap break-words">
                    {text}
                  </pre>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

function getFieldTypeIcon(type: string): string {
  const icons: { [key: string]: string } = {
    'String': '""',
    'Number': '#',
    'Boolean': '✓',
    'Date': '📅',
    'ObjectId': '🔑',
    'Array': '[]',
    'Object': '{}'
  }
  return icons[type] || '•'
}

function formatSampleValue(value: any): string {
  if (value === null || value === undefined) return 'null'
  if (typeof value === 'string') return `"${value.substring(0, 30)}${value.length > 30 ? '...' : ''}"`
  if (typeof value === 'number') return value.toLocaleString()
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (value instanceof Date) return value.toLocaleDateString()
  return JSON.stringify(value).substring(0, 30)
}
