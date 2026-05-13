import React, { useState, useCallback, useMemo, useEffect, createContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactFlow, {
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { toast } from "sonner";
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { PanelLeft, PanelRight } from 'lucide-react';
import { Agent, Tool, KnowledgeBase } from '@/types';
import { AgentComponentSidebar } from './AgentComponentSidebar';
import { AgentPropertiesPanel } from './AgentPropertiesPanel';
import { AgentTesterPanel } from './AgentTesterPanel';
import { AgentNode, ToolsNode, KnowledgeNode, WorkflowNode, McpSubToolNode, ChatMessageNode } from './AgentCustomNodes';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';

interface AgentBuilderProps {
  agent: Agent;
  showTester?: boolean;
}

const SIM_STYLE: Record<string, React.CSSProperties> = {
  running: { boxShadow: '0 0 0 2px #facc15, 0 0 18px 6px rgba(250,204,21,0.55), inset 0 0 28px rgba(250,204,21,0.14)', zIndex: 10 },
  success: { boxShadow: '0 0 0 2px #22c55e, 0 0 14px 4px rgba(34,197,94,0.50), inset 0 0 24px rgba(34,197,94,0.12)', zIndex: 10 },
  error:   { boxShadow: '0 0 0 2px #ef4444, 0 0 14px 4px rgba(239,68,68,0.50), inset 0 0 24px rgba(239,68,68,0.12)', zIndex: 10 },
};
const SIM_CLASS: Record<string, string> = {
  running: 'node-sim-running',
};

// Layout constants for better organization
const LAYOUT = {
  centerX: 400,
  chatMessageY: 50,
  agentNodeY: 180,
  toolsY: 350,
  knowledgeY: 350,
  workflowY: 500,
  nodeSpacingX: 220,
  nodeSpacingY: 80,
};

const initialNodes = (agentName) => [
  {
    id: 'chat-message-node',
    type: 'chat_message',
    data: { label: 'Chat Message' },
    position: { x: LAYOUT.centerX, y: LAYOUT.chatMessageY },
    deletable: false,
  },
  {
    id: 'agent-node',
    type: 'agent',
    data: { label: agentName },
    position: { x: LAYOUT.centerX, y: LAYOUT.agentNodeY },
    deletable: false,
  },
];

export const AgentBuilderContext = createContext(null);

export const AgentBuilder = ({ agent, showTester = false }: AgentBuilderProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes(agent.name));
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const { authFetch } = useAuth();
  const queryClient = useQueryClient();
  const [inspectedMcpTools, setInspectedMcpTools] = useState<number[]>([]);
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(() => window.innerWidth < 768);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(() => window.innerWidth < 768);
  const [simStates, setSimStates] = useState<Record<string, string>>({});
  const simClearTimer = useRef<ReturnType<typeof setTimeout>>();

  const handleExecution = useCallback((steps: Array<{ node_id: string; status: string }>) => {
    if (simClearTimer.current) clearTimeout(simClearTimer.current);
    if (steps.length === 0) { setSimStates({}); return; }
    // Cascade: reveal each step 350ms apart so the flow is visible
    steps.forEach((step, i) => {
      setTimeout(() => {
        setSimStates(prev => ({ ...prev, [step.node_id]: step.status }));
      }, i * 350);
    });
    // Auto-clear 2.5s after the last step
    simClearTimer.current = setTimeout(() => setSimStates({}), steps.length * 350 + 2500);
  }, []);

  useEffect(() => {
    const nodesToAdd = [];
    const edgesToAdd = [
      { id: 'chat-agent-edge', source: 'chat-message-node', target: 'agent-node', animated: true }
    ];

    const toolCount = agent.tools?.length || 0;
    const kbCount = agent.knowledge_bases?.length || 0;
    const workflowCount = agent.workflows?.length || 0;

    // Position tools on the LEFT side of the agent node
    if (toolCount > 0) {
        const toolsStartX = LAYOUT.centerX - ((toolCount - 1) * LAYOUT.nodeSpacingX) / 2 - 150;
        agent.tools.forEach((tool, index) => {
            const toolNode = {
                id: `tools-${tool.id}`,
                type: 'tools',
                data: { label: tool.name, id: tool.id, tool_type: tool.tool_type, mcp_server_url: tool.mcp_server_url },
                position: {
                  x: toolsStartX + index * LAYOUT.nodeSpacingX,
                  y: LAYOUT.toolsY
                },
            };
            nodesToAdd.push(toolNode);
            edgesToAdd.push({ id: `agent-tool-edge-${tool.id}`, source: 'agent-node', target: toolNode.id, animated: true });
        });
    }

    // Position knowledge bases on the RIGHT side of the agent node
    if (kbCount > 0) {
        const kbStartX = LAYOUT.centerX - ((kbCount - 1) * LAYOUT.nodeSpacingX) / 2 + 150;
        agent.knowledge_bases.forEach((kb, index) => {
            const kbNode = {
                id: `knowledge-${kb.id}`,
                type: 'knowledge',
                data: { label: kb.name, id: kb.id },
                position: {
                  x: kbStartX + index * LAYOUT.nodeSpacingX,
                  y: LAYOUT.knowledgeY
                },
            };
            nodesToAdd.push(kbNode);
            edgesToAdd.push({ id: `agent-kb-edge-${kb.id}`, source: 'agent-node', target: kbNode.id, animated: true });
        });
    }

    // Position workflows BELOW the agent node, centered
    if (workflowCount > 0) {
        const workflowStartX = LAYOUT.centerX - ((workflowCount - 1) * LAYOUT.nodeSpacingX) / 2;
        agent.workflows.forEach((workflow, index) => {
            const workflowNode = {
                id: `workflow-${workflow.id}`,
                type: 'workflow',
                data: { label: workflow.name, id: workflow.id },
                position: {
                  x: workflowStartX + index * LAYOUT.nodeSpacingX,
                  y: LAYOUT.workflowY
                },
            };
            nodesToAdd.push(workflowNode);
            edgesToAdd.push({ id: `agent-workflow-edge-${workflow.id}`, source: 'agent-node', target: workflowNode.id, animated: true });
        });
    }

    const finalNodes = [...initialNodes(agent.name), ...nodesToAdd];
    setNodes(finalNodes);

    setEdges(edgesToAdd);
  }, [agent, setNodes, setEdges]);

  const nodeTypes = useMemo(() => ({
    agent: AgentNode,
    tools: ToolsNode,
    knowledge: KnowledgeNode,
    workflow: WorkflowNode,
    mcp_sub_tool: McpSubToolNode,
    chat_message: ChatMessageNode,
  }), []);

  const displayNodes = useMemo(() => nodes.map(n => {
    const state = simStates[n.id];
    if (!state) return n;
    return {
      ...n,
      style: { ...n.style, ...SIM_STYLE[state] },
      className: cn(n.className, SIM_CLASS[state] ?? ''),
    };
  }), [nodes, simStates]);

  const mutation = useMutation({
    mutationFn: (updatedAgent: Partial<Agent>) => {
      return authFetch(`/api/v1/agents/${agent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedAgent),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['agent', agent.id.toString()] });
      toast.success(t('builder.agentUpdated'));
    },
    onError: (error) => {
      toast.error(t('builder.failedUpdateAgent'));
    },
  });

  const onConnect = useCallback((params) => {
    setEdges((eds) => addEdge(params, eds));
  }, [setEdges]);

  const handleNodesChange = useCallback((changes) => {
    onNodesChange(changes);
    for (const change of changes) {
        if (change.type === 'remove') {
            const nodeToRemove = nodes.find(n => n.id === change.id);
            if (nodeToRemove) {
                if (nodeToRemove.type === 'knowledge') {
                    const kbId = parseInt(nodeToRemove.id.split('-')[1]);
                    const newKbIds = (agent.knowledge_base_ids || []).filter(id => id !== kbId);
                    mutation.mutate({ knowledge_base_ids: newKbIds });
                }
                if (nodeToRemove.type === 'tools') {
                    const toolId = parseInt(nodeToRemove.id.split('-')[1]);
                    const newToolIds = (agent.tools?.map(t => t.id) || []).filter(id => id !== toolId);
                    mutation.mutate({ tool_ids: newToolIds });
                }
                if (nodeToRemove.type === 'workflow') {
                    // Remove agent from workflow's agent_ids (many-to-many)
                    const workflowId = parseInt(nodeToRemove.id.split('-')[1]);
                    authFetch(`/api/v1/workflows/${workflowId}`).then(async (response) => {
                        if (response.ok) {
                            const workflow = await response.json();
                            const currentAgentIds = workflow.agent_ids || [];
                            const newAgentIds = currentAgentIds.filter((id: number) => id !== agent.id);
                            await authFetch(`/api/v1/workflows/${workflowId}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ agent_ids: newAgentIds }),
                            });
                            await queryClient.invalidateQueries({ queryKey: ['agent', agent.id.toString()] });
                            await queryClient.invalidateQueries({ queryKey: ['workflows'] });
                        }
                    });
                }
            }
        }
    }
  }, [onNodesChange, nodes, mutation, agent, authFetch, queryClient]);

  const handleEdgesChange = useCallback((changes) => {
    onEdgesChange(changes);
    for (const change of changes) {
      if (change.type === 'remove') {
        const edgeToRemove = edges.find(e => e.id === change.id);
        if (edgeToRemove) {
          const targetNode = nodes.find(n => n.id === edgeToRemove.target);
          if (targetNode?.type === 'knowledge') {
            const kbId = parseInt(targetNode.id.split('-')[1]);
            const newKbIds = (agent.knowledge_base_ids || []).filter(id => id !== kbId);
            mutation.mutate({ knowledge_base_ids: newKbIds });
          }
          if (targetNode?.type === 'tools') {
            const toolId = parseInt(targetNode.id.split('-')[1]);
            const newToolIds = (agent.tools?.map(t => t.id) || []).filter(id => id !== toolId);
            mutation.mutate({ tool_ids: newToolIds });
          }
          if (targetNode?.type === 'workflow') {
            // Remove agent from workflow's agent_ids (many-to-many)
            const workflowId = parseInt(targetNode.id.split('-')[1]);
            authFetch(`/api/v1/workflows/${workflowId}`).then(async (response) => {
                if (response.ok) {
                    const workflow = await response.json();
                    const currentAgentIds = workflow.agent_ids || [];
                    const newAgentIds = currentAgentIds.filter((id: number) => id !== agent.id);
                    await authFetch(`/api/v1/workflows/${workflowId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ agent_ids: newAgentIds }),
                    });
                    await queryClient.invalidateQueries({ queryKey: ['agent', agent.id.toString()] });
                    await queryClient.invalidateQueries({ queryKey: ['workflows'] });
                }
            });
          }
        }
      }
    }
  }, [onEdgesChange, nodes, edges, mutation, agent, authFetch, queryClient]);

  const onDrop = useCallback((event) => {
    event.preventDefault();
    if (!reactFlowInstance) return;

    const dataString = event.dataTransfer.getData('application/reactflow');
    if (typeof dataString === 'undefined' || !dataString) return;

    const { nodeType, id, label, toolType, mcpServerUrl } = JSON.parse(dataString);

    if (nodes.some(n => n.id === `${nodeType}-${id}`)) {
      toast.warning(t('builder.alreadyAdded', { type: nodeType }));
      return;
    }

    if (nodeType === 'knowledge') {
      const existingKbIds = agent.knowledge_base_ids || [];
      mutation.mutate({ knowledge_base_ids: [...new Set([...existingKbIds, id])] });
    }
    if (nodeType === 'tools') {
      const existingToolIds = agent.tools?.map(t => t.id) || [];
      const newToolIds = [...new Set([...existingToolIds, id])];
      mutation.mutate({ tool_ids: newToolIds });
    }
    if (nodeType === 'workflow') {
      // Add agent to workflow's agent_ids (many-to-many)
      authFetch(`/api/v1/workflows/${id}`).then(async (response) => {
        if (response.ok) {
          const workflow = await response.json();
          const currentAgentIds = workflow.agent_ids || [];
          // Add current agent if not already present
          if (!currentAgentIds.includes(agent.id)) {
            const newAgentIds = [...currentAgentIds, agent.id];
            const updateResponse = await authFetch(`/api/v1/workflows/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ agent_ids: newAgentIds }),
            });
            if (updateResponse.ok) {
              await queryClient.invalidateQueries({ queryKey: ['agent', agent.id.toString()] });
              await queryClient.invalidateQueries({ queryKey: ['workflows'] });
              toast.success(t('builder.workflowAssigned', { defaultValue: 'Workflow assigned to agent' }));
            } else {
              toast.error(t('builder.failedAssignWorkflow', { defaultValue: 'Failed to assign workflow' }));
            }
          }
        } else {
          toast.error(t('builder.failedAssignWorkflow', { defaultValue: 'Failed to assign workflow' }));
        }
      });
    }
  }, [reactFlowInstance, nodes, agent, mutation, authFetch, queryClient, t]);

  useEffect(() => {
    const mcpToolNodesToInspect = nodes.filter(
      n => n.type === 'tools' && n.data.tool_type === 'mcp' && !inspectedMcpTools.includes(n.data.id)
    );

    if (mcpToolNodesToInspect.length === 0) return;

    const inspectPromises = mcpToolNodesToInspect.map(async (mcpToolNode) => {
      try {
        const tool = agent.tools.find(t => t.id === mcpToolNode.data.id);
        if (!tool || !tool.mcp_server_url) {
          // Mark as inspected even if no URL to prevent retry
          return { newNodes: [], newEdges: [], inspectedToolId: mcpToolNode.data.id };
        }

        const response = await authFetch(`/api/v1/mcp/inspect`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: tool.mcp_server_url }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`MCP server inspection failed for ${tool.name}:`, errorText);
          toast.error(`Failed to inspect MCP server "${tool.name}": ${response.status} ${response.statusText}`);
          // Mark as inspected even on failure to prevent infinite retries
          return { newNodes: [], newEdges: [], inspectedToolId: mcpToolNode.data.id };
        }

        const mcpToolsData = await response.json();

        // Position MCP sub-tools in a fan pattern below the parent tool
        const subToolCount = mcpToolsData.tools.length;
        const subToolSpacing = 180;
        const subToolStartX = mcpToolNode.position.x - ((subToolCount - 1) * subToolSpacing) / 2;

        const newNodes = mcpToolsData.tools.map((subTool, index) => ({
          id: `mcp-sub-tool-${tool.id}-${subTool.name}`,
          type: 'mcp_sub_tool',
          data: { label: subTool.name },
          position: {
            x: subToolStartX + index * subToolSpacing,
            y: mcpToolNode.position.y + 120
          },
        }));

        const newEdges = mcpToolsData.tools.map(subTool => ({
          id: `edge-mcp-sub-${tool.id}-${subTool.name}`,
          source: `tools-${tool.id}`,
          target: `mcp-sub-tool-${tool.id}-${subTool.name}`,
          animated: true,
        }));

        return { newNodes, newEdges, inspectedToolId: mcpToolNode.data.id };
      } catch (error) {
        console.error(`Error inspecting MCP tool ${mcpToolNode.data.id}:`, error);
        toast.error(`Error connecting to MCP server: ${error.message}`);
        // Mark as inspected even on error to prevent infinite retries
        return { newNodes: [], newEdges: [], inspectedToolId: mcpToolNode.data.id };
      }
    });

    Promise.all(inspectPromises).then(results => {
      const allNewNodes = [];
      const allNewEdges = [];
      const allInspectedToolIds = [];

      results.forEach(result => {
        if (result) {
          allNewNodes.push(...result.newNodes);
          allNewEdges.push(...result.newEdges);
          allInspectedToolIds.push(result.inspectedToolId);
        }
      });

      if (allNewNodes.length > 0) {
        setNodes((nds) => {
          const existingNodeIds = new Set(nds.map(n => n.id));
          const filteredNewNodes = allNewNodes.filter(n => !existingNodeIds.has(n.id));
          return [...nds, ...filteredNewNodes];
        });
      }
      if (allNewEdges.length > 0) {
        setEdges((eds) => {
          const existingEdgeIds = new Set(eds.map(e => e.id));
          const filteredNewEdges = allNewEdges.filter(e => !existingEdgeIds.has(e.id));
          return [...eds, ...filteredNewEdges];
        });
      }
      if (allInspectedToolIds.length > 0) {
        setInspectedMcpTools(prev => [...prev, ...allInspectedToolIds]);
      }
    });

  }, [nodes, agent.tools, authFetch, setNodes, setEdges, inspectedMcpTools]);

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onNodeClick = useCallback((_, node) => {
    if (node.type === 'chat_message') {
      navigate(`/dashboard/designer?agentId=${agent.id}`);
      return;
    }
    if (node.type === 'workflow') {
      const workflowId = node.id.split('-')[1];
      navigate(`/dashboard/workflows/${workflowId}`);
      return;
    }
    setSelectedNode(node);
  }, [navigate, agent.id]);

  const onPaneClick = useCallback(() => setSelectedNode(null), []);

  const onNodeDelete = useCallback((nodeId) => {
    const nodeToRemove = nodes.find(n => n.id === nodeId);
    if (nodeToRemove) {
        if (nodeToRemove.type === 'knowledge') {
            const kbId = parseInt(nodeToRemove.id.split('-')[1]);
            const newKbIds = (agent.knowledge_base_ids || []).filter(id => id !== kbId);
            mutation.mutate({ knowledge_base_ids: newKbIds });
        }
        if (nodeToRemove.type === 'tools') {
            const toolId = parseInt(nodeToRemove.id.split('-')[1]);
            const newToolIds = (agent.tools?.map(t => t.id) || []).filter(id => id !== toolId);
            mutation.mutate({ tool_ids: newToolIds });
        }
    }
    setSelectedNode(null);
  }, [nodes, mutation, agent]);

  const contextValue = { handleInspect: () => {} }; // handleInspect is not used anymore

  return (
    <div className="relative flex h-[calc(100vh-9rem)] sm:h-[calc(100vh-11rem)] w-full rounded-xl overflow-hidden border border-border bg-card">
      <AgentBuilderContext.Provider value={contextValue}>
        <ReactFlowProvider>

            {/* Mobile backdrop — closes both sidebars when tapped */}
            {(!leftSidebarCollapsed || !rightSidebarCollapsed) && (
              <div
                className="md:hidden fixed inset-0 bg-black/50 z-40"
                onClick={() => { setLeftSidebarCollapsed(true); setRightSidebarCollapsed(true); }}
              />
            )}

            <AgentComponentSidebar
              agent={agent}
              isCollapsed={leftSidebarCollapsed}
              onToggle={() => setLeftSidebarCollapsed(!leftSidebarCollapsed)}
            />
            <div className="flex-grow workflow-canvas relative">
              {/* Mobile floating sidebar toggles */}
              {leftSidebarCollapsed && (
                <button
                  onClick={() => { setLeftSidebarCollapsed(false); setRightSidebarCollapsed(true); }}
                  className="md:hidden absolute left-2 top-2 z-10 h-8 w-8 rounded-lg bg-card/90 backdrop-blur border border-border shadow-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  title="Components"
                >
                  <PanelLeft className="h-4 w-4" />
                </button>
              )}
              {rightSidebarCollapsed && !showTester && (
                <button
                  onClick={() => { setRightSidebarCollapsed(false); setLeftSidebarCollapsed(true); }}
                  className="md:hidden absolute right-2 top-2 z-10 h-8 w-8 rounded-lg bg-card/90 backdrop-blur border border-border shadow-sm flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  title="Properties"
                >
                  <PanelRight className="h-4 w-4" />
                </button>
              )}

              {/* Gradient overlay at top */}
              <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-card/60 to-transparent pointer-events-none z-10" />
              <ReactFlow
                nodes={displayNodes}
                edges={edges}
                onNodesChange={handleNodesChange}
                onEdgesChange={handleEdgesChange}
                onConnect={onConnect}
                onInit={setReactFlowInstance}
                onDrop={onDrop}
                onDragOver={onDragOver}
                onNodeClick={onNodeClick}
                onPaneClick={onPaneClick}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ maxZoom: 0.75, padding: 0.3 }}
                defaultEdgeOptions={{
                  type: 'smoothstep',
                  animated: true,
                  style: { stroke: '#8b5cf6', strokeWidth: 2 },
                }}
                className="bg-background"
              >
                <Background
                  variant="dots"
                  gap={24}
                  size={1.5}
                  color="hsl(var(--muted-foreground))"
                  className="dark:opacity-20"
                />
                <Controls className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden" />
              </ReactFlow>
            </div>
            {showTester ? (
              <div className="w-64 sm:w-72 flex-shrink-0 overflow-hidden">
                <AgentTesterPanel agentId={agent.id} agentName={agent.name} onExecution={handleExecution} />
              </div>
            ) : (
              <AgentPropertiesPanel
                agent={agent}
                selectedNode={selectedNode}
                onNodeDelete={onNodeDelete}
                isCollapsed={rightSidebarCollapsed}
                onToggle={() => setRightSidebarCollapsed(!rightSidebarCollapsed)}
                onTestExecution={handleExecution}
              />
            )}
        </ReactFlowProvider>
      </AgentBuilderContext.Provider>
    </div>
  );
};