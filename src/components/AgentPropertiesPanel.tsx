import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Settings, Palette, KeyRound, Trash2 } from 'lucide-react';

export const AgentPropertiesPanel = ({ agent, selectedNode, onNodeDelete }) => {
  const navigate = useNavigate();

  if (!selectedNode) {
    return (
      <div className="w-80 p-4 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 mb-3">
            <Settings className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">Select a node to see its properties.</p>
        </div>
      </div>
    );
  }

  const handleDelete = () => {
    if (onNodeDelete && selectedNode) {
      onNodeDelete(selectedNode.id);
    }
  };

  const selectedTool = selectedNode?.type === 'tools'
    ? agent.tools.find(t => t.id === selectedNode.data.id)
    : null;

  const selectedKb = selectedNode?.type === 'knowledge'
    ? agent.knowledge_bases.find(kb => kb.id === selectedNode.data.id)
    : null;

  return (
    <aside className="w-80 p-4 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-bold dark:text-white">{selectedNode.data.label}</h3>
        {(selectedNode.type === 'tools' || selectedNode.type === 'knowledge') && (
          <Button size="sm" variant="destructive" onClick={handleDelete} className="hover:scale-105 transition-transform">
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {selectedNode.type === 'agent' && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Agent Configuration</p>
          <Button className="w-full justify-start hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors" variant="ghost" onClick={() => navigate(`/dashboard/builder/${agent.id}/settings`)}>
            <Settings className="mr-2 h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="dark:text-white">Settings</span>
          </Button>
          <Button className="w-full justify-start hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors" variant="ghost" onClick={() => navigate('/dashboard/designer')}>
            <Palette className="mr-2 h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="dark:text-white">Designer</span>
          </Button>
          <Button className="w-full justify-start hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors" variant="ghost" onClick={() => navigate(`/dashboard/builder/${agent.id}/credentials`)}>
            <KeyRound className="mr-2 h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="dark:text-white">Credentials</span>
          </Button>
        </div>
      )}

      {selectedTool && (
        <div className="space-y-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Tool Details</p>
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">ID</p>
            <p className="text-sm dark:text-white font-mono">#{selectedTool.id}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Description</p>
            <p className="text-sm dark:text-white">{selectedTool.description}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Type</p>
            <p className="text-sm dark:text-white capitalize">{selectedTool.tool_type}</p>
          </div>
          {selectedTool.tool_type === 'custom' && selectedTool.parameters && (
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Parameters</p>
              <pre className="text-xs bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-600 overflow-x-auto dark:text-white">
                {JSON.stringify(selectedTool.parameters, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {selectedKb && (
        <div className="space-y-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-4">Knowledge Base Details</p>
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">ID</p>
            <p className="text-sm dark:text-white font-mono">#{selectedKb.id}</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Description</p>
            <p className="text-sm dark:text-white">{selectedKb.description}</p>
          </div>
        </div>
      )}
    </aside>
  );
};