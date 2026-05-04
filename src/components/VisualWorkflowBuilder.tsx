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
import { Edit, ArrowLeft, Workflow as WorkflowIcon, Sparkles, Settings, LayoutTemplate, Layers, AlertTriangle, PanelRightClose, PanelRightOpen, PanelLeft, PanelRight, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { ImperativePanelHandle } from 'react-resizable-panels';

import Sidebar from './Sidebar';
import { useTheme } from '@/hooks/useTheme';
import WorkflowAISidebar, { WorkflowAISidebarHandle } from './WorkflowAISidebar';
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
import { useI18n } from '@/hooks/useI18n';
import { WorkflowBuilderContext } from './workflow/WorkflowBuilderContext';

const initialNodes = [
  { id: 'start-node', type: 'start', data: { label: 'Start' }, position: { x: 250, y: 5 } },
];

const VisualWorkflowBuilder = () => {
  const { t, isRTL } = useI18n();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
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

  // AI Sidebar ref
  const sidebarRef = useRef<WorkflowAISidebarHandle>(null);

  // Simulation visual state — accumulates across turns, cleared only on reset
  const [simNodeStates, setSimNodeStates] = useState<Map<string, string>>(new Map());
  const [simEdgeIds, setSimEdgeIds] = useState<Set<string>>(new Set());
  const [animatingEdgeId, setAnimatingEdgeId] = useState<string | null>(null);
  const simTimers = useRef<ReturnType<typeof setTimeout>[]>([]);

  // box-shadow: border hug (0 0 0 2px) + outer bloom + inset interior tint
  const SIM_STYLE: Record<string, React.CSSProperties> = {
    running: { boxShadow: '0 0 0 2px #facc15, 0 0 18px 6px rgba(250,204,21,0.55), inset 0 0 28px rgba(250,204,21,0.14)' },
    success: { boxShadow: '0 0 0 2px #22c55e, 0 0 14px 4px rgba(34,197,94,0.50), inset 0 0 24px rgba(34,197,94,0.12)' },
    error:   { boxShadow: '0 0 0 2px #ef4444, 0 0 14px 4px rgba(239,68,68,0.50), inset 0 0 24px rgba(239,68,68,0.12)' },
    warning: { boxShadow: '0 0 0 2px #fb923c, 0 0 14px 4px rgba(251,146,60,0.50), inset 0 0 24px rgba(251,146,60,0.12)' },
    paused:  { boxShadow: '0 0 0 2px #60a5fa, 0 0 18px 6px rgba(96,165,250,0.55), inset 0 0 28px rgba(96,165,250,0.14)' },
    skipped: {},
  };
  // Extra CSS classes per sim status (no ring/offset — visuals live in SIM_STYLE)
  const SIM_ANIM: Record<string, string> = {
    running: 'node-sim-running',   // shimmer scan sweep (defined in index.css)
    paused:  'animate-pulse',
    skipped: 'opacity-40 grayscale',
  };

  // Nodes with simulation glow applied
  const displayNodes = useMemo(
    () => nodes.map((n) => {
      const simStatus = simNodeStates.get(n.id);
      if (!simStatus) return n;
      const animCls = SIM_ANIM[simStatus] ?? '';
      const simStyle = SIM_STYLE[simStatus] ?? {};
      return {
        ...n,
        className: (n.className ? n.className + ' ' : '') + animCls,
        style: { ...n.style, ...simStyle },
      };
    }),
    [nodes, simNodeStates] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Edges:
  //   • traversed edges → persistent green glow (no animation)
  //   • currently animating edge → brighter green with dash animation
  const displayEdges = useMemo(
    () => edges.map(e => {
      if (e.id === animatingEdgeId) {
        // Active traversal — animated bright green
        return { ...e, animated: true, style: { stroke: '#22c55e', strokeWidth: 3, filter: 'drop-shadow(0 0 6px #22c55e)' } };
      }
      if (simEdgeIds.has(e.id)) {
        // Already traversed — steady green glow, not animated
        return { ...e, animated: false, style: { stroke: '#22c55e', strokeWidth: 2.5, opacity: 0.85, filter: 'drop-shadow(0 0 4px rgba(34,197,94,0.6))' } };
      }
      // Override baked-in colors with theme-appropriate stroke
      return {
        ...e,
        style: {
          ...e.style,
          stroke: isDark ? 'rgba(255,255,255,0.35)' : '#8b5cf6',
          strokeWidth: isDark ? 1.5 : 2.5,
        },
      };
    }),
    [edges, simEdgeIds, animatingEdgeId, isDark]
  );

  // Clear all simulation visuals (called on test reset)
  const clearSimulation = useCallback(() => {
    simTimers.current.forEach(clearTimeout);
    simTimers.current = [];
    setSimNodeStates(new Map());
    setSimEdgeIds(new Set());
    setAnimatingEdgeId(null);
  }, []);

  // Run simulation canvas animation — accumulates on top of existing state (multi-turn)
  const runSimAnimation = useCallback((
    steps: Array<{ node_id: string; status: string }>
  ) => {
    // Cancel any in-flight animation timers (but keep already-settled states)
    simTimers.current.forEach(clearTimeout);
    simTimers.current = [];

    // Build a lookup: "sourceId:targetId" → edge id
    const edgeLookup = new Map<string, string>();
    edges.forEach(e => edgeLookup.set(`${e.source}:${e.target}`, e.id));

    const RUNNING_MS = 520;
    const SETTLE_MS  = 220;
    let delay = 60;

    steps.forEach((step, i) => {
      const nodeId = step.node_id;
      if (nodeId.startsWith('__')) return;

      // 1. Flash the connecting edge as "animating" just before the node lights up
      if (i > 0) {
        const prevId = steps[i - 1].node_id;
        if (!prevId.startsWith('__')) {
          const edgeId = edgeLookup.get(`${prevId}:${nodeId}`);
          if (edgeId) {
            // Start animating this edge
            const tStart = setTimeout(() => setAnimatingEdgeId(edgeId), Math.max(0, delay - 80));
            simTimers.current.push(tStart);
            // Settle it into persistent green once the node starts
            const tSettle = setTimeout(() => {
              setSimEdgeIds(prev => new Set([...prev, edgeId]));
              setAnimatingEdgeId(null);
            }, delay + RUNNING_MS);
            simTimers.current.push(tSettle);
          }
        }
      }

      // 2. "Running" glow on the node
      const t1 = setTimeout(() => {
        setSimNodeStates(prev => new Map([...prev, [nodeId, 'running']]));
      }, delay);
      simTimers.current.push(t1);
      delay += RUNNING_MS;

      // 3. Settle to final status — PERSISTS (no cleanup timer)
      const t2 = setTimeout(() => {
        setSimNodeStates(prev => new Map([...prev, [nodeId, step.status]]));
      }, delay);
      simTimers.current.push(t2);
      delay += SETTLE_MS;
    });

    // Clear the "animating" edge indicator after everything settles
    const tDone = setTimeout(() => setAnimatingEdgeId(null), delay + 100);
    simTimers.current.push(tDone);
  }, [edges]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mobile overlay state
  const [mobileNodePaletteOpen, setMobileNodePaletteOpen] = useState(false);
  const [mobilePropsPanelOpen, setMobilePropsPanelOpen] = useState(false);

  // Properties Panel resize state
  const propertiesPanelRef = useRef<ImperativePanelHandle>(null);
  const [isPropertiesPanelCollapsed, setIsPropertiesPanelCollapsed] = useState(() => {
    const saved = localStorage.getItem('workflowBuilder.propertiesPanel.collapsed');
    if (saved !== null) return saved === 'true';
    return window.innerWidth < 768; // auto-collapse on mobile
  });

  // Properties Panel constants
  const PROPERTIES_PANEL_STORAGE_KEY = 'workflowBuilder.propertiesPanel.size';
  const DEFAULT_PANEL_SIZE = 25;
  const MIN_PANEL_SIZE = 15;
  const MAX_PANEL_SIZE = 40;

  // Get saved panel size — always 0 on mobile (panel is handled via overlay)
  const getSavedPanelSize = useCallback(() => {
    if (window.innerWidth < 768) return 0;
    const saved = localStorage.getItem(PROPERTIES_PANEL_STORAGE_KEY);
    return saved ? parseFloat(saved) : DEFAULT_PANEL_SIZE;
  }, []);

  // Handle panel resize
  const handlePanelResize = useCallback((size: number) => {
    localStorage.setItem(PROPERTIES_PANEL_STORAGE_KEY, String(size));
  }, []);

  // Collapse the panel on mobile after mount
  useEffect(() => {
    if (window.innerWidth < 768 && propertiesPanelRef.current) {
      propertiesPanelRef.current.collapse();
    }
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
    const newNodeId = `${type}-${+new Date()}`;
    const newNode = {
      id: newNodeId,
      type,
      position,
      data,
      style: { opacity: 0 }
    };

    setNodes((nds) => nds.concat(newNode));

    // Start animation after a brief delay to ensure position is set
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setNodes((nds) =>
          nds.map((node) =>
            node.id === newNodeId
              ? { ...node, className: 'workflow-node-enter', style: {} }
              : node
          )
        );
      });
    });

    // Remove animation class after animation completes (800ms)
    setTimeout(() => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === newNodeId
            ? { ...node, className: '' }
            : node
        )
      );
    }, 800);
  }, [reactFlowInstance, setNodes]);

  // Estimated node dimensions for collision detection
  const getNodeDimensions = useCallback((nodeType: string) => {
    // Approximate dimensions based on node type
    const dimensions: Record<string, { width: number; height: number }> = {
      start: { width: 180, height: 60 },
      response: { width: 200, height: 80 },
      llm: { width: 220, height: 100 },
      condition: { width: 200, height: 120 },
      tool: { width: 200, height: 80 },
      knowledge: { width: 200, height: 80 },
      code: { width: 200, height: 80 },
      form: { width: 200, height: 100 },
      listen: { width: 180, height: 70 },
      prompt: { width: 200, height: 80 },
      question_classifier: { width: 220, height: 120 },
    };
    return dimensions[nodeType] || { width: 200, height: 80 };
  }, []);

  // Check if a position overlaps with existing nodes
  const checkOverlap = useCallback((
    position: { x: number; y: number },
    nodeWidth: number,
    nodeHeight: number,
    excludeNodeId?: string
  ) => {
    const padding = 20; // Minimum gap between nodes
    return nodes.some(node => {
      if (excludeNodeId && node.id === excludeNodeId) return false;
      const existingDim = getNodeDimensions(node.type);
      const overlapX = Math.abs(position.x - node.position.x) < (nodeWidth + existingDim.width) / 2 + padding;
      const overlapY = Math.abs(position.y - node.position.y) < (nodeHeight + existingDim.height) / 2 + padding;
      return overlapX && overlapY;
    });
  }, [nodes, getNodeDimensions]);

  // Find a free position near the ideal position
  const findFreePosition = useCallback((
    idealPosition: { x: number; y: number },
    nodeWidth: number,
    nodeHeight: number,
    direction: 'vertical' | 'horizontal'
  ) => {
    const step = direction === 'vertical' ? 100 : 120;
    const maxAttempts = 10;

    // Try ideal position first
    if (!checkOverlap(idealPosition, nodeWidth, nodeHeight)) {
      return idealPosition;
    }

    // Try positions in alternating directions
    for (let i = 1; i <= maxAttempts; i++) {
      // Try positive direction
      const posOffset = direction === 'vertical'
        ? { x: idealPosition.x + (i * step), y: idealPosition.y }
        : { x: idealPosition.x, y: idealPosition.y + (i * step) };

      if (!checkOverlap(posOffset, nodeWidth, nodeHeight)) {
        return posOffset;
      }

      // Try negative direction
      const negOffset = direction === 'vertical'
        ? { x: idealPosition.x - (i * step), y: idealPosition.y }
        : { x: idealPosition.x, y: idealPosition.y - (i * step) };

      if (!checkOverlap(negOffset, nodeWidth, nodeHeight)) {
        return negOffset;
      }
    }

    // Fallback: return ideal position with additional offset
    return {
      x: idealPosition.x + (direction === 'vertical' ? 150 : 0),
      y: idealPosition.y + (direction === 'horizontal' ? 150 : 0)
    };
  }, [checkOverlap]);

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

    const sourceDim = getNodeDimensions(sourceNode.type);
    const newNodeDim = getNodeDimensions(nodeType);

    // Vertical spacing between nodes
    const verticalGap = 80;
    // Horizontal spacing for right-positioned nodes
    const horizontalGap = 100;

    // Calculate ideal position based on handle position
    let idealPosition;
    if (handlePosition === 'bottom') {
      // Center the new node below the source node
      idealPosition = {
        x: sourceNode.position.x + (sourceDim.width - newNodeDim.width) / 2,
        y: sourceNode.position.y + sourceDim.height + verticalGap
      };
    } else {
      // Position to the right, vertically centered
      idealPosition = {
        x: sourceNode.position.x + sourceDim.width + horizontalGap,
        y: sourceNode.position.y + (sourceDim.height - newNodeDim.height) / 2
      };
    }

    // Find a free position that doesn't overlap with existing nodes
    const position = findFreePosition(
      idealPosition,
      newNodeDim.width,
      newNodeDim.height,
      handlePosition === 'bottom' ? 'vertical' : 'horizontal'
    );

    const newNodeId = `${nodeType}-${Date.now()}`;
    const newNode = {
      id: newNodeId,
      type: nodeType,
      position,
      data: nodeData.label ? nodeData : { ...nodeData, label: `${nodeType} node` },
      style: { opacity: 0 }
    };

    // Add the new node (invisible first)
    setNodes((nds) => [...nds, newNode]);

    // Start animation after a brief delay to ensure position is set
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setNodes((nds) =>
          nds.map((node) =>
            node.id === newNodeId
              ? { ...node, className: 'workflow-node-enter', style: {} }
              : node
          )
        );
      });
    });

    // Remove animation class after animation completes (800ms)
    setTimeout(() => {
      setNodes((nds) =>
        nds.map((node) =>
          node.id === newNodeId
            ? { ...node, className: '' }
            : node
        )
      );
    }, 800);

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
  }, [nodes, setNodes, setEdges, getNodeDimensions, findFreePosition]);
  const onNodeClick = useCallback((_, node) => {
    setSelectedNode(node);
    sidebarRef.current?.switchToProperties();
    // Auto-expand properties panel if collapsed
    if (isPropertiesPanelCollapsed && propertiesPanelRef.current) {
      propertiesPanelRef.current.expand();
      setIsPropertiesPanelCollapsed(false);
      localStorage.setItem('workflowBuilder.propertiesPanel.collapsed', 'false');
    }
  }, [isPropertiesPanelCollapsed]);
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    sidebarRef.current?.switchToChat();
  }, []);
  const deleteNode = useCallback(() => {
    if (selectedNode) {
      setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
      setEdges((eds) => eds.filter((edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id));
      setSelectedNode(null);
      toast.success(t("workflows.editor.toasts.nodeDeleted"));
    }
  }, [selectedNode, setNodes, setEdges, t]);

  if (!workflow) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center animate-pulse">
            <WorkflowIcon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
          </div>
          <p className="text-sm text-muted-foreground font-mono">{t("workflows.editor.loading")}</p>
        </div>
      </div>
    );
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
      <div className="dndflow h-screen flex flex-col bg-background">
        {/* Toolbar */}
        <div className="flex-shrink-0 px-3 sm:px-4 py-2.5 border-b border-border bg-card" dir={isRTL ? 'rtl' : 'ltr'}>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              onClick={() => navigate('/dashboard/workflows')}
              variant="ghost"
              size="sm"
              className="h-8 px-2 sm:px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1.5 flex-shrink-0"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("workflows.editor.backButton")}</span>
            </Button>

            <div className="w-px h-5 bg-border flex-shrink-0" />

            <div className="flex-grow min-w-0">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                  <WorkflowIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-xs sm:text-sm font-semibold truncate text-foreground font-mono leading-tight">{workflow.name}</h2>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Badge variant="outline" className="text-[10px] font-mono border-border text-muted-foreground h-4 px-1.5">{t("workflows.editor.versionBadge", { version: workflow.version })}</Badge>
                    {workflow.is_active && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="hidden sm:inline">{t("workflows.editor.activebadge")}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
              <Button
                onClick={() => setDetailsDialogOpen(true)}
                variant="outline"
                size="sm"
                className="h-8 px-2 sm:px-3 text-xs border-border text-muted-foreground hover:text-foreground gap-1.5"
                title={t("workflows.editor.editDetailsButton")}
              >
                <Edit className="h-3 w-3" />
                <span className="hidden sm:inline">{t("workflows.editor.editDetailsButton")}</span>
              </Button>
              <Button
                onClick={() => setShowSettings(true)}
                variant="outline"
                size="sm"
                className="h-8 px-2 sm:px-3 text-xs border-border text-muted-foreground hover:text-foreground gap-1.5"
                title={t("workflows.editor.settingsButton")}
              >
                <Settings className="h-3 w-3" />
                <span className="hidden sm:inline">{t("workflows.editor.settingsButton")}</span>
              </Button>
              {workflow?.id && (
                <Button
                  onClick={() => setSaveAsTemplateOpen(true)}
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 sm:px-3 text-xs border-border text-muted-foreground hover:text-foreground gap-1.5 hidden sm:inline-flex"
                  title={t("workflowTemplates.saveAsTemplate")}
                >
                  <LayoutTemplate className="h-3 w-3" />
                  <span className="hidden lg:inline">{t("workflowTemplates.saveAsTemplate")}</span>
                </Button>
              )}
              <Button
                onClick={() => saveWorkflow()}
                size="sm"
                className="h-8 px-3 sm:px-4 text-xs bg-violet-500 hover:bg-violet-600 text-white shadow-sm font-medium"
              >
                {t("workflows.editor.saveButton")}
              </Button>
            </div>
          </div>
        </div>

        {/* Subworkflow Usage Banner */}
        {usedByWorkflows.length > 0 && (
          <div className="mx-4 mt-2 p-3 bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800 rounded-lg flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center flex-shrink-0">
              <Layers className="h-3.5 w-3.5 text-violet-600 dark:text-violet-500" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-xs font-semibold text-violet-800 dark:text-violet-200">
                {t("workflows.editor.usedAsSubworkflow") || "Used as subworkflow by"}:
              </span>
              <span className="text-xs text-violet-700 dark:text-violet-300 ml-1 truncate">
                {usedByWorkflows.map(w => w.name).join(', ')}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-violet-600 dark:text-violet-400 flex-shrink-0">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span className="text-[11px] font-medium hidden sm:inline">{t("workflows.editor.subworkflowWarning") || "Changes affect parent workflows"}</span>
            </div>
          </div>
        )}

        {/* Main Workflow Canvas */}
        <div className="flex-grow flex overflow-hidden relative">
          <ReactFlowProvider>
            <WorkflowBuilderContext.Provider value={{ addNodeWithConnection, nodes, edges }}>

            {/* Mobile backdrops */}
            {(mobileNodePaletteOpen || mobilePropsPanelOpen) && (
              <div
                className="md:hidden fixed inset-0 bg-black/50 z-40"
                onClick={() => {
                  setMobileNodePaletteOpen(false);
                  setMobilePropsPanelOpen(false);
                }}
              />
            )}

            <Sidebar
              mobileOpen={mobileNodePaletteOpen}
              onMobileClose={() => setMobileNodePaletteOpen(false)}
            />
            <ResizablePanelGroup direction="horizontal" className="flex-grow">

              {/* ReactFlow Canvas Panel */}
              <ResizablePanel defaultSize={100 - getSavedPanelSize()} minSize={50}>
                <div className="h-full workflow-canvas relative" ref={reactFlowWrapper}>
                  {/* Mobile floating toggles */}
                  {!mobileNodePaletteOpen && (
                    <button
                      onClick={() => { setMobileNodePaletteOpen(true); setMobilePropsPanelOpen(false); }}
                      className="md:hidden absolute left-2 top-2 z-10 h-8 w-8 rounded-lg bg-card/90 backdrop-blur border border-border shadow-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                      title="Node Palette"
                    >
                      <PanelLeft className="h-4 w-4" />
                    </button>
                  )}
                  {!mobilePropsPanelOpen && (
                    <button
                      onClick={() => { setMobilePropsPanelOpen(true); setMobileNodePaletteOpen(false); }}
                      className="md:hidden absolute right-2 top-2 z-10 h-8 w-8 rounded-lg bg-card/90 backdrop-blur border border-border shadow-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                      title="Properties"
                    >
                      <PanelRight className="h-4 w-4" />
                    </button>
                  )}
                  <ReactFlow
                    nodes={displayNodes}
                    edges={displayEdges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onInit={setReactFlowInstance}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    onNodeClick={onNodeClick}
                    onPaneClick={onPaneClick}
                    fitView
                    minZoom={0.1}
                    maxZoom={5}
                    fitViewOptions={{
                      padding: 0.1,
                      maxZoom: 5,
                      minZoom: 0.5
                    }}
                    nodeTypes={nodeTypes}
                    deleteKeyCode={['Backspace', 'Delete']}
                    defaultEdgeOptions={{
                      type: 'smoothstep',
                      animated: true,
                      style: {
                        stroke: isDark ? 'rgba(255,255,255,0.35)' : '#8b5cf6',
                        strokeWidth: isDark ? 1.5 : 2.5,
                      },
                    }}
                    connectionLineStyle={{
                      stroke: isDark ? 'rgba(255,255,255,0.50)' : '#8b5cf6',
                      strokeWidth: isDark ? 1.5 : 2,
                      strokeDasharray: '5 4',
                    }}
                    className="bg-background"
                  >
                    <Controls className="bg-card border-border rounded-lg shadow-sm overflow-hidden [&_button]:text-foreground [&_button]:hover:bg-muted [&_button]:transition-colors [&_button_svg]:fill-foreground" />
                    <MiniMap
                      className="hidden sm:block bg-card border-border rounded-lg shadow-sm overflow-hidden"
                      nodeColor={(node) => {
                        if (node.type === 'start') return '#10b981';
                        if (node.type === 'response') return '#ef4444';
                        if (node.type === 'llm') return '#6366f1';
                        if (node.type === 'tool') return '#10b981';
                        if (node.type === 'condition') return '#f59e0b';
                        return isDark ? 'rgba(255,255,255,0.4)' : '#8b5cf6';
                      }}
                    />
                    <Background
                      variant="dots"
                      gap={24}
                      size={1}
                      color={isDark ? 'rgba(255,255,255,0.18)' : '#94a3b8'}
                      className="opacity-100"
                    />
                  </ReactFlow>
                </div>
              </ResizablePanel>

              {/* Resize Handle — hidden on mobile */}
              <ResizableHandle withHandle className="hidden md:flex bg-border hover:bg-violet-400 dark:hover:bg-violet-500 transition-colors" />

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
                <div className={mobilePropsPanelOpen
                    ? 'fixed top-0 right-0 bottom-0 w-[min(90vw,400px)] z-50 shadow-2xl md:relative md:top-auto md:right-auto md:bottom-auto md:w-auto md:z-auto md:shadow-none h-full overflow-hidden'
                    : 'relative h-full overflow-hidden'
                  }
                >
                  <WorkflowAISidebar
                    ref={sidebarRef}
                    selectedNode={selectedNode}
                    nodes={nodes}
                    edges={edges}
                    setNodes={setNodes}
                    setEdges={setEdges}
                    deleteNode={deleteNode}
                    workflowId={workflowId}
                    workflowDbId={workflow?.id}
                    onMobileClose={mobilePropsPanelOpen ? () => setMobilePropsPanelOpen(false) : undefined}
                    onNodesUpdated={(ids, simSteps) => {
                      if (simSteps !== undefined && ids.length === 0 && simSteps.length === 0) {
                        clearSimulation(); // reset signal from sidebar
                      } else if (simSteps && simSteps.length > 0) {
                        runSimAnimation(simSteps);
                      } else {
                        // AI-edit flash: brief green ring
                        setSimNodeStates(new Map(ids.map(id => [id, 'success'] as [string, string])));
                        const t = setTimeout(() => setSimNodeStates(new Map()), 2000);
                        simTimers.current.push(t);
                      }
                    }}
                  />
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>

            {/* Collapse Toggle Button - Desktop only */}
            <Button
              variant="ghost"
              size="icon"
              onClick={togglePropertiesPanel}
              className={`hidden md:flex absolute top-4 z-20 h-8 w-8 bg-card border border-border shadow-sm hover:bg-muted transition-colors ${isRTL ? 'left-0 rounded-r-md rounded-l-none' : 'right-0 rounded-l-md rounded-r-none'}`}
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