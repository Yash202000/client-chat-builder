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
import { Edit, ArrowLeft, Workflow as WorkflowIcon, Sparkles, Settings, LayoutTemplate, Layers, AlertTriangle, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { ImperativePanelHandle } from 'react-resizable-panels';

import Sidebar from './Sidebar';
import PropertiesPanel from './PropertiesPanel';
import { WorkflowDetailsDialog } from './WorkflowDetailsDialog';
import { WorkflowSettings } from './WorkflowSettings';
import SaveAsTemplateModal from './SaveAsTemplateModal';
import {
  LlmNode, ToolNode, ConditionNode, OutputNode, StartNode, ListenNode, PromptNode,
  KnowledgeNode, CodeNode, DataManipulationNode, HttpRequestNode, FormNode,
  IntentRouterNode, EntityCollectorNode, CheckEntityNode, UpdateContextNode,
  TagConversationNode, AssignToAgentNode, SetStatusNode, ChannelRedirectNode, QuestionClassifierNode,
  ExtractEntitiesNode, SubworkflowNode,
  TriggerWebSocketNode, TriggerWhatsAppNode, TriggerTelegramNode, TriggerInstagramNode,
  TriggerTwilioVoiceNode, TriggerFreeSwitchNode,
  ForEachLoopNode, WhileLoopNode
} from './CustomNodes';
import { useAuth } from "@/hooks/useAuth";
import { Comments } from './Comments';
import { useI18n } from '@/hooks/useI18n';
import { WorkflowBuilderContext } from './workflow/WorkflowBuilderContext';

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
  const [isSaveAsTemplateOpen, setSaveAsTemplateOpen] = useState(false);
  const [usedByWorkflows, setUsedByWorkflows] = useState<{id: number, name: string}[]>([]);

  const { workflowId } = useParams();
  const navigate = useNavigate();
  const reactFlowWrapper = useRef(null);
  const { authFetch } = useAuth();

  // Properties Panel resize state
  const propertiesPanelRef = useRef<ImperativePanelHandle>(null);
  const [isPropertiesPanelCollapsed, setIsPropertiesPanelCollapsed] = useState(() => {
    const saved = localStorage.getItem('workflowBuilder.propertiesPanel.collapsed');
    return saved === 'true';
  });

  // Properties Panel constants
  const PROPERTIES_PANEL_STORAGE_KEY = 'workflowBuilder.propertiesPanel.size';
  const DEFAULT_PANEL_SIZE = 25;
  const MIN_PANEL_SIZE = 15;
  const MAX_PANEL_SIZE = 40;

  // Get saved panel size
  const getSavedPanelSize = useCallback(() => {
    const saved = localStorage.getItem(PROPERTIES_PANEL_STORAGE_KEY);
    return saved ? parseFloat(saved) : DEFAULT_PANEL_SIZE;
  }, []);

  // Handle panel resize
  const handlePanelResize = useCallback((size: number) => {
    localStorage.setItem(PROPERTIES_PANEL_STORAGE_KEY, String(size));
  }, []);

  // Toggle properties panel collapse/expand
  const togglePropertiesPanel = useCallback(() => {
    const panel = propertiesPanelRef.current;
    if (panel) {
      if (panel.isCollapsed()) {
        panel.expand();
        setIsPropertiesPanelCollapsed(false);
        localStorage.setItem('workflowBuilder.propertiesPanel.collapsed', 'false');
      } else {
        panel.collapse();
        setIsPropertiesPanelCollapsed(true);
        localStorage.setItem('workflowBuilder.propertiesPanel.collapsed', 'true');
      }
    }
  }, []);

  const nodeTypes = useMemo(() => ({
    llm: LlmNode, tool: ToolNode, condition: ConditionNode, response: OutputNode,
    start: StartNode, listen: ListenNode, prompt: PromptNode, knowledge: KnowledgeNode,
    code: CodeNode, data_manipulation: DataManipulationNode, http_request: HttpRequestNode, form: FormNode,
    // Chat-specific nodes
    intent_router: IntentRouterNode, entity_collector: EntityCollectorNode, check_entity: CheckEntityNode,
    update_context: UpdateContextNode, tag_conversation: TagConversationNode,
    assign_to_agent: AssignToAgentNode, set_status: SetStatusNode, channel_redirect: ChannelRedirectNode,
    question_classifier: QuestionClassifierNode, extract_entities: ExtractEntitiesNode,
    // Subworkflow node
    subworkflow: SubworkflowNode,
    // Loop nodes
    foreach_loop: ForEachLoopNode, while_loop: WhileLoopNode,
    // Trigger nodes
    trigger_websocket: TriggerWebSocketNode, trigger_whatsapp: TriggerWhatsAppNode,
    trigger_telegram: TriggerTelegramNode, trigger_instagram: TriggerInstagramNode,
    trigger_twilio_voice: TriggerTwilioVoiceNode, trigger_freeswitch: TriggerFreeSwitchNode
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

        // Fetch workflows that use this as a subworkflow
        const usedByResponse = await authFetch(`/api/v1/workflows/${workflowId}/used-by`);
        if (usedByResponse.ok) {
          const usedByData = await usedByResponse.json();
          setUsedByWorkflows(usedByData);
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
    const triggerTypes = ['trigger_websocket', 'trigger_whatsapp', 'trigger_telegram', 'trigger_instagram', 'trigger_twilio_voice', 'trigger_freeswitch'];

    // Check for start node OR trigger node
    const hasStartNode = nodes.some(node => node.type === 'start');
    const hasTriggerNode = nodes.some(node => triggerTypes.includes(node.type));

    if (!hasStartNode && !hasTriggerNode) {
      errors.push(t("workflows.editor.validation.missingStartNode"));
    }

    // Check for output node
    const hasOutputNode = nodes.some(node => node.type === 'response');
    if (!hasOutputNode) {
      errors.push(t("workflows.editor.validation.missingOutputNode"));
    }

    // Check each node for required connections
    nodes.forEach(node => {
      const outgoingEdges = edges.filter(edge => edge.source === node.id);

      // Skip validation for output nodes (they don't need outgoing edges)
      if (node.type === 'response') return;

      // Check condition nodes for required edges
      if (node.type === 'condition') {
        const conditions = node.data.conditions || [];
        const isMultiCondition = conditions.length > 0;

        // Debug logging
        console.log('[Condition Validation] Node:', node.id);
        console.log('[Condition Validation] conditions array:', conditions);
        console.log('[Condition Validation] isMultiCondition:', isMultiCondition);
        console.log('[Condition Validation] outgoingEdges:', outgoingEdges);
        console.log('[Condition Validation] outgoingEdges sourceHandles:', outgoingEdges.map(e => e.sourceHandle));

        if (isMultiCondition) {
          // Multi-condition format: check for numeric handles (0, 1, 2, ...) and 'else'
          const missingHandles = [];

          // Check each condition has an edge
          conditions.forEach((_, index) => {
            const hasEdge = outgoingEdges.some(edge => edge.sourceHandle === String(index));
            console.log(`[Condition Validation] Checking handle "${index}" (string: "${String(index)}") - hasEdge:`, hasEdge);
            if (!hasEdge) {
              missingHandles.push(index);
            }
          });

          // Check for else edge
          const hasElseEdge = outgoingEdges.some(edge => edge.sourceHandle === 'else');
          console.log('[Condition Validation] hasElseEdge:', hasElseEdge);
          console.log('[Condition Validation] missingHandles:', missingHandles);

          if (missingHandles.length > 0) {
            errors.push(`Condition node "${node.data.label || node.id}" is missing edges for conditions: ${missingHandles.join(', ')}`);
          }
          if (!hasElseEdge) {
            errors.push(`Condition node "${node.data.label || node.id}" is missing ELSE edge`);
          }
        } else {
          // Legacy format: check for true/false edges
          const hasTrueEdge = outgoingEdges.some(edge => edge.sourceHandle === 'true');
          const hasFalseEdge = outgoingEdges.some(edge => edge.sourceHandle === 'false');

          if (!hasTrueEdge) {
            errors.push(t("workflows.editor.validation.missingTrueEdge", { label: node.data.label || node.id }));
          }
          if (!hasFalseEdge) {
            errors.push(t("workflows.editor.validation.missingFalseEdge", { label: node.data.label || node.id }));
          }
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

  // Add node with automatic connection from a source handle
  const addNodeWithConnection = useCallback((
    sourceId: string,
    sourceHandle: string,
    nodeType: string,
    nodeData: Record<string, any>,
    handlePosition: 'bottom' | 'right'
  ): string | null => {
    const sourceNode = nodes.find(n => n.id === sourceId);
    if (!sourceNode) return null;

    // Calculate position based on handle position
    let position;
    if (handlePosition === 'bottom') {
      position = {
        x: sourceNode.position.x,
        y: sourceNode.position.y + 150
      };
    } else {
      position = {
        x: sourceNode.position.x + 250,
        y: sourceNode.position.y
      };
    }

    const newNodeId = `${nodeType}-${Date.now()}`;
    const newNode = {
      id: newNodeId,
      type: nodeType,
      position,
      data: nodeData.label ? nodeData : { ...nodeData, label: `${nodeType} node` }
    };

    // Add the new node
    setNodes((nds) => [...nds, newNode]);

    // Create edge connecting source to new node
    const newEdge = {
      id: `e-${sourceId}-${newNodeId}-${Date.now()}`,
      source: sourceId,
      sourceHandle,
      target: newNodeId,
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#8b5cf6', strokeWidth: 2.5 }
    };
    setEdges((eds) => addEdge(newEdge, eds));

    // Select the new node
    setSelectedNode(newNode);

    return newNodeId;
  }, [nodes, setNodes, setEdges]);
  const onNodeClick = useCallback((_, node) => {
    setSelectedNode(node);
    // Auto-expand properties panel if collapsed
    if (isPropertiesPanelCollapsed && propertiesPanelRef.current) {
      propertiesPanelRef.current.expand();
      setIsPropertiesPanelCollapsed(false);
      localStorage.setItem('workflowBuilder.propertiesPanel.collapsed', 'false');
    }
  }, [isPropertiesPanelCollapsed]);
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
      {workflow?.id && (
        <SaveAsTemplateModal
          isOpen={isSaveAsTemplateOpen}
          onClose={() => setSaveAsTemplateOpen(false)}
          workflowId={workflow.id}
          workflowName={workflow.name || ''}
        />
      )}
      <div className="dndflow h-screen flex flex-col bg-gradient-to-br from-slate-100 via-slate-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-900">
        {/* Modern Toolbar */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-slate-200/80 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm shadow-sm" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className={`flex items-center gap-4 flex-wrap`}>
            <Button onClick={() => navigate('/dashboard/workflows')} variant="outline" size="sm" className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200">
              <ArrowLeft className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t("workflows.editor.backButton")}
            </Button>
            <div className="flex-grow min-w-0">
              <div className={`flex items-center gap-3`}>
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-500/20">
                  <WorkflowIcon className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold truncate text-slate-900 dark:text-white">{workflow.name}</h2>
                  <div className={`flex items-center gap-2`}>
                    <Badge variant="outline" className="text-xs border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">{t("workflows.editor.versionBadge", { version: workflow.version })}</Badge>
                    {workflow.is_active && (
                      <Badge className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-0 text-xs flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        {t("workflows.editor.activebadge")}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className={`flex items-center gap-2`}>
              <Button onClick={() => setDetailsDialogOpen(true)} variant="outline" size="sm" className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200">
                <Edit className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t("workflows.editor.editDetailsButton")}
              </Button>
              <Button onClick={() => setShowSettings(true)} variant="outline" size="sm" className="border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200">
                <Settings className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t("workflows.editor.settingsButton")}
              </Button>
              {workflow?.id && (
                <Button
                  onClick={() => setSaveAsTemplateOpen(true)}
                  variant="outline"
                  size="sm"
                  className="border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-all duration-200"
                >
                  <LayoutTemplate className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                  {t("workflowTemplates.saveAsTemplate")}
                </Button>
              )}
              <Button
                onClick={() => saveWorkflow()}
                size="sm"
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white shadow-md shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-200"
              >
                {t("workflows.editor.saveButton")}
              </Button>
            </div>
          </div>
        </div>

        {/* Subworkflow Usage Banner */}
        {usedByWorkflows.length > 0 && (
          <div className="mx-4 mt-2 p-4 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 border border-violet-200 dark:border-violet-700 rounded-xl flex items-center gap-3 shadow-sm">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-md shadow-violet-500/25 flex-shrink-0">
              <Layers className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <span className="text-sm font-semibold text-violet-800 dark:text-violet-200">
                {t("workflows.editor.usedAsSubworkflow") || "This workflow is used as a subworkflow by"}:
              </span>
              <span className="text-sm text-violet-600 dark:text-violet-300 ml-1">
                {usedByWorkflows.map(w => w.name).join(', ')}
              </span>
            </div>
            <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 flex-shrink-0">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs font-medium hidden sm:inline">{t("workflows.editor.subworkflowWarning") || "Changes affect parent workflows"}</span>
            </div>
          </div>
        )}

        {/* Main Workflow Canvas */}
        <div className="flex-grow flex overflow-hidden relative">
          <ReactFlowProvider>
            <WorkflowBuilderContext.Provider value={{ addNodeWithConnection, nodes, edges }}>
            <Sidebar />
            <ResizablePanelGroup direction="horizontal" className="flex-grow">

              {/* ReactFlow Canvas Panel */}
              <ResizablePanel defaultSize={100 - getSavedPanelSize()} minSize={50}>
                <div className="h-full workflow-canvas" ref={reactFlowWrapper}>
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
                    className="bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800"
                  >
                    <Controls className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden [&_button]:dark:text-white [&_button]:dark:hover:bg-slate-700 [&_button]:transition-colors" />
                    <MiniMap
                      className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
                      nodeColor={(node) => {
                        if (node.type === 'start') return '#10b981';
                        if (node.type === 'response') return '#ef4444';
                        if (node.type === 'llm') return '#6366f1';
                        if (node.type === 'tool') return '#10b981';
                        if (node.type === 'condition') return '#f59e0b';
                        return '#8b5cf6';
                      }}
                      maskColor="rgb(15, 23, 42, 0.6)"
                    />
                    <Background variant="dots" gap={24} size={1.5} color="#94a3b8" className="dark:opacity-20" />
                  </ReactFlow>
                </div>
              </ResizablePanel>

              {/* Resize Handle */}
              <ResizableHandle withHandle className="bg-slate-200 dark:bg-slate-700 hover:bg-blue-500 dark:hover:bg-blue-600 transition-colors" />

              {/* Properties Panel */}
              <ResizablePanel
                ref={propertiesPanelRef}
                defaultSize={getSavedPanelSize()}
                minSize={MIN_PANEL_SIZE}
                maxSize={MAX_PANEL_SIZE}
                collapsible
                collapsedSize={0}
                onResize={handlePanelResize}
                onCollapse={() => {
                  setIsPropertiesPanelCollapsed(true);
                  localStorage.setItem('workflowBuilder.propertiesPanel.collapsed', 'true');
                }}
                onExpand={() => {
                  setIsPropertiesPanelCollapsed(false);
                  localStorage.setItem('workflowBuilder.propertiesPanel.collapsed', 'false');
                }}
              >
                <div className="h-full border-l border-slate-200/80 dark:border-slate-700 bg-gradient-to-b from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 shadow-xl overflow-hidden flex flex-col">
                  {/* Panel Content */}
                  <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-700">
                    <PropertiesPanel selectedNode={selectedNode} nodes={nodes} setNodes={setNodes} deleteNode={deleteNode} workflowId={workflowId} />
                    {workflow && workflow.id && (
                      <Comments workflowId={workflow.id} />
                    )}
                  </div>
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>

            {/* Collapse Toggle Button - Always visible on the edge */}
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePropertiesPanel}
              className={`absolute top-4 z-20 h-8 w-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md hover:bg-slate-100 dark:hover:bg-slate-700 ${isRTL ? 'left-0 rounded-r-md rounded-l-none' : 'right-0 rounded-l-md rounded-r-none'}`}
              title={isPropertiesPanelCollapsed ? t("workflows.editor.properties.expand") : t("workflows.editor.properties.collapse")}
            >
              {isRTL
                ? (isPropertiesPanelCollapsed ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />)
                : (isPropertiesPanelCollapsed ? <PanelRightOpen className="h-4 w-4" /> : <PanelRightClose className="h-4 w-4" />)
              }
            </Button>
            </WorkflowBuilderContext.Provider>
          </ReactFlowProvider>
        </div>
      </div>
    </>
  );
};

export default VisualWorkflowBuilder;