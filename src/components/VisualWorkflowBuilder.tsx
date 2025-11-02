import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { toast } from "sonner";
import { Button } from '@/components/ui/button';
import { Edit, ArrowLeft, Workflow as WorkflowIcon, Sparkles, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

import Sidebar from './Sidebar';
import PropertiesPanel from './PropertiesPanel';
import { WorkflowDetailsDialog } from './WorkflowDetailsDialog';
import { WorkflowSettings } from './WorkflowSettings';
import {
  LlmNode, ToolNode, ConditionNode, OutputNode, StartNode, ListenNode, PromptNode,
  KnowledgeNode, CodeNode, DataManipulationNode, HttpRequestNode, FormNode,
  IntentRouterNode, EntityCollectorNode, CheckEntityNode, UpdateContextNode,
  TagConversationNode, AssignToAgentNode, SetStatusNode,
  TriggerWebSocketNode, TriggerWhatsAppNode, TriggerTelegramNode, TriggerInstagramNode
} from './CustomNodes';
import { useAuth } from "@/hooks/useAuth";
import { Comments } from './Comments';
import { useI18n } from '@/hooks/useI18n';

const initialNodes = [
  { id: 'start-node', type: 'start', data: { label: 'Start' }, position: { x: 250, y: 5 } },
];

const VisualWorkflowBuilder = () => {
  const { t, isRTL } = useI18n();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [workflow, setWorkflow] = useState(null);
  const [isDetailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const { workflowId } = useParams();
  const navigate = useNavigate();
  const reactFlowWrapper = useRef(null);
  const { authFetch } = useAuth();

  const nodeTypes = useMemo(() => ({
    llm: LlmNode, tool: ToolNode, condition: ConditionNode, output: OutputNode,
    start: StartNode, listen: ListenNode, prompt: PromptNode, knowledge: KnowledgeNode,
    code: CodeNode, data_manipulation: DataManipulationNode, http_request: HttpRequestNode, form: FormNode,
    // Chat-specific nodes
    intent_router: IntentRouterNode, entity_collector: EntityCollectorNode, check_entity: CheckEntityNode,
    update_context: UpdateContextNode, tag_conversation: TagConversationNode,
    assign_to_agent: AssignToAgentNode, set_status: SetStatusNode,
    // Trigger nodes
    trigger_websocket: TriggerWebSocketNode, trigger_whatsapp: TriggerWhatsAppNode,
    trigger_telegram: TriggerTelegramNode, trigger_instagram: TriggerInstagramNode
  }), []);

  useEffect(() => {
    const fetchWorkflow = async () => {
      if (!workflowId) return;
      try {
        const response = await authFetch(`/api/v1/workflows/${workflowId}`);
        if (!response.ok) throw new Error('Failed to fetch workflow');
        const data = await response.json();
        setWorkflow(data);
        if (data.visual_steps) {
          setNodes(data.visual_steps.nodes || initialNodes);
          setEdges(data.visual_steps.edges || []);
        }
      } catch (error) {
        toast.error(t("workflows.editor.toasts.loadFailed"));
        navigate('/dashboard/workflows');
      }
    };
    fetchWorkflow();
  }, [workflowId, authFetch, navigate, setNodes, setEdges]);

  const validateWorkflow = () => {
    const errors = [];

    // Trigger node types that can start a workflow
    const triggerTypes = ['trigger_websocket', 'trigger_whatsapp', 'trigger_telegram', 'trigger_instagram'];

    // Check for start node OR trigger node
    const hasStartNode = nodes.some(node => node.type === 'start');
    const hasTriggerNode = nodes.some(node => triggerTypes.includes(node.type));

    if (!hasStartNode && !hasTriggerNode) {
      errors.push(t("workflows.editor.validation.missingStartNode"));
    }

    // Check for output node
    const hasOutputNode = nodes.some(node => node.type === 'output');
    if (!hasOutputNode) {
      errors.push(t("workflows.editor.validation.missingOutputNode"));
    }

    // Check each node for required connections
    nodes.forEach(node => {
      const outgoingEdges = edges.filter(edge => edge.source === node.id);

      // Skip validation for output nodes (they don't need outgoing edges)
      if (node.type === 'output') return;

      // Check condition nodes for both true and false edges
      if (node.type === 'condition') {
        const hasTrueEdge = outgoingEdges.some(edge => edge.sourceHandle === 'true');
        const hasFalseEdge = outgoingEdges.some(edge => edge.sourceHandle === 'false');

        if (!hasTrueEdge) {
          errors.push(t("workflows.editor.validation.missingTrueEdge", { label: node.data.label || node.id }));
        }
        if (!hasFalseEdge) {
          errors.push(t("workflows.editor.validation.missingFalseEdge", { label: node.data.label || node.id }));
        }
      }
      // Check all other nodes (except start, triggers, and output) have at least one outgoing edge
      else if (node.type !== 'start' && !triggerTypes.includes(node.type) && outgoingEdges.length === 0) {
        errors.push(t("workflows.editor.validation.noOutgoingConnection", { label: node.data.label || node.id }));
      }
    });

    // Check for orphaned nodes (nodes not connected to the workflow)
    const connectedNodeIds = new Set();

    // Find all entry points (start node or trigger nodes)
    const entryNodes = nodes.filter(n => n.type === 'start' || triggerTypes.includes(n.type));

    if (entryNodes.length > 0) {
      const visited = new Set();
      const queue = entryNodes.map(n => n.id);

      while (queue.length > 0) {
        const currentId = queue.shift();
        if (visited.has(currentId)) continue;
        visited.add(currentId);
        connectedNodeIds.add(currentId);

        edges.forEach(edge => {
          if (edge.source === currentId && !visited.has(edge.target)) {
            queue.push(edge.target);
          }
        });
      }

      // Check for orphaned nodes (excluding entry points)
      nodes.forEach(node => {
        const isEntryPoint = node.type === 'start' || triggerTypes.includes(node.type);
        if (!connectedNodeIds.has(node.id) && !isEntryPoint) {
          errors.push(t("workflows.editor.validation.notConnected", { label: node.data.label || node.id }));
        }
      });
    }

    return errors;
  };

  const saveWorkflow = async (details) => {
    if (!workflow) return toast.error(t("workflows.editor.toasts.loadFailed"));

    // Validate workflow before saving
    const validationErrors = validateWorkflow();
    if (validationErrors.length > 0) {
      toast.error(
        <div className="space-y-2" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="font-semibold">{t("workflows.editor.validation.cannotSave")}</div>
          <ul className={`list-disc ${isRTL ? 'list-inside pr-4' : 'list-inside pl-4'} space-y-1`}>
            {validationErrors.map((error, index) => (
              <li key={index} className="text-sm">{error}</li>
            ))}
          </ul>
        </div>,
        { duration: 8000 }
      );
      return;
    }

    const flowVisualData = { nodes, edges };
    const updatedWorkflow = {
      name: details?.name || workflow.name,
      description: details?.description || workflow.description,
      visual_steps: flowVisualData
    };

    try {
      const response = await authFetch(`/api/v1/workflows/${workflow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedWorkflow),
      });
      if (!response.ok) throw new Error('Save failed');
      const savedWorkflow = await response.json();
      setWorkflow(savedWorkflow);
      toast.success(t("workflows.editor.toasts.saveSuccess"));
    } catch (error) {
      toast.error(t("workflows.editor.toasts.saveFailed", { message: error.message }));
    }
  };
  
  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);
  const onDragOver = useCallback((event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; }, []);
  const onDrop = useCallback((event) => {
    event.preventDefault();
    if (!reactFlowInstance) return;
    
    const type = event.dataTransfer.getData('application/reactflow');
    const dataString = event.dataTransfer.getData('application/reactflow-data');
    const data = dataString ? JSON.parse(dataString) : { label: `${type} node` };

    if (typeof type === 'undefined' || !type) return;
    
    const position = reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
    const newNode = { 
      id: `${type}-${+new Date()}`, 
      type, 
      position, 
      data
    };
    
    setNodes((nds) => nds.concat(newNode));
  }, [reactFlowInstance, setNodes]);
  const onNodeClick = useCallback((_, node) => setSelectedNode(node), []);
  const onPaneClick = useCallback(() => setSelectedNode(null), []);
  const deleteNode = useCallback(() => {
    if (selectedNode) {
      setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
      setEdges((eds) => eds.filter((edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id));
      setSelectedNode(null);
      toast.success(t("workflows.editor.toasts.nodeDeleted"));
    }
  }, [selectedNode, setNodes, setEdges, t]);

  if (!workflow) {
    return <div className="text-center p-8 dark:text-white">{t("workflows.editor.loading")}</div>;
  }

  return (
    <>
      <WorkflowDetailsDialog
        isOpen={isDetailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        workflow={workflow}
        onSave={saveWorkflow}
      />
      <WorkflowSettings
        open={showSettings}
        onOpenChange={setShowSettings}
        workflowId={workflow?.id}
      />
      <div className="dndflow h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-950">
        {/* Enhanced Toolbar */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className={`flex items-center gap-4 flex-wrap `}>
            <Button onClick={() => navigate('/dashboard/workflows')} variant="outline" size="sm" className="btn-hover-lift">
              <ArrowLeft className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t("workflows.editor.backButton")}
            </Button>
            <div className="flex-grow min-w-0">
              <div className={`flex items-center gap-3 `}>
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <WorkflowIcon className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold truncate dark:text-white">{workflow.name}</h2>
                  <div className={`flex items-center gap-2 `}>
                    <Badge variant="outline" className="text-xs dark:border-slate-600 dark:text-slate-300">{t("workflows.editor.versionBadge", { version: workflow.version })}</Badge>
                    {workflow.is_active && (
                      <Badge className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 border-green-200 dark:border-green-800 text-xs">
                        <Sparkles className={`h-3 w-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                        {t("workflows.editor.activebadge")}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className={`flex items-center gap-2 `}>
              <Button onClick={() => setDetailsDialogOpen(true)} variant="outline" size="sm" className="btn-hover-lift">
                <Edit className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t("workflows.editor.editDetailsButton")}
              </Button>
              <Button onClick={() => setShowSettings(true)} variant="outline" size="sm" className="btn-hover-lift">
                <Settings className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t("workflows.editor.settingsButton")}
              </Button>
              <Button
                onClick={() => saveWorkflow()}
                size="sm"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 btn-hover-lift"
              >
                {t("workflows.editor.saveButton")}
              </Button>
            </div>
          </div>
        </div>

        {/* Main Workflow Canvas */}
        <div className="flex-grow flex overflow-hidden">
          <ReactFlowProvider>
            <Sidebar />
            <div className="flex-grow h-full workflow-canvas" ref={reactFlowWrapper}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onInit={setReactFlowInstance}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onNodeClick={onNodeClick}
                onPaneClick={onPaneClick}
                fitView
                nodeTypes={nodeTypes}
                deleteKeyCode={['Backspace', 'Delete']}
                defaultEdgeOptions={{
                  type: 'smoothstep',
                  animated: true,
                  style: { stroke: '#8b5cf6', strokeWidth: 2.5 },
                }}
                className="dark:bg-slate-900"
              >
                <Controls className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 [&_button]:dark:text-white [&_button]:dark:hover:bg-slate-700" />
                <MiniMap
                  className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700"
                  nodeColor={(node) => {
                    if (node.type === 'start') return '#10b981';
                    if (node.type === 'output') return '#ef4444';
                    if (node.type === 'llm') return '#6366f1';
                    if (node.type === 'tool') return '#10b981';
                    if (node.type === 'condition') return '#f59e0b';
                    return '#8b5cf6';
                  }}
                  maskColor="rgb(15, 23, 42, 0.7)"
                />
                <Background variant="dots" gap={20} size={1} color="#94a3b8" className="dark:opacity-30" />
              </ReactFlow>
            </div>
            {/* Enhanced Properties Panel */}
            <div className="w-80 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg overflow-y-auto">
              <PropertiesPanel selectedNode={selectedNode} nodes={nodes} setNodes={setNodes} deleteNode={deleteNode} />
              {workflow && workflow.id && (
                <Comments workflowId={workflow.id} />
              )}
            </div>
          </ReactFlowProvider>
        </div>
      </div>
    </>
  );
};

export default VisualWorkflowBuilder;