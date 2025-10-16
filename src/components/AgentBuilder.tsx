import React, { useState, useCallback, useMemo, useEffect, createContext } from 'react';
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

import { Agent, Tool, KnowledgeBase } from '@/types';
import { AgentComponentSidebar } from './AgentComponentSidebar';
import { AgentPropertiesPanel } from './AgentPropertiesPanel';
import { AgentNode, ToolsNode, KnowledgeNode, McpSubToolNode, ChatMessageNode } from './AgentCustomNodes';
import { useAuth } from '@/hooks/useAuth';

interface AgentBuilderProps {
  agent: Agent;
}

const initialNodes = (agentName) => [
  {
    id: 'agent-node',
    type: 'agent',
    data: { label: agentName },
    position: { x: 250, y: 80 },
    deletable: false,
  },
  {
    id: 'chat-message-node',
    type: 'chat_message',
    data: { label: 'Chat Message' },
    position: { x: 250, y: 0 },
    deletable: false,
  },
];

export const AgentBuilderContext = createContext(null);

export const AgentBuilder = ({ agent }: AgentBuilderProps) => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes(agent.name));
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const { authFetch } = useAuth();
  const queryClient = useQueryClient();
  const [inspectedMcpTools, setInspectedMcpTools] = useState<number[]>([]);

  useEffect(() => {
    const nodesToAdd = [];
    const edgesToAdd = [
      { id: 'chat-agent-edge', source: 'chat-message-node', target: 'agent-node', animated: true }
    ];

    if (agent.knowledge_bases?.length > 0) {
        agent.knowledge_bases.forEach((kb, index) => {
            const kbNode = {
                id: `knowledge-${kb.id}`,
                type: 'knowledge',
                data: { label: kb.name, id: kb.id },
                position: { x: 450 + index * 200, y: 250 },
            };
            nodesToAdd.push(kbNode);
            edgesToAdd.push({ id: `agent-kb-edge-${kb.id}`, source: 'agent-node', target: kbNode.id, animated: true });
        });
    }

    if (agent.tools?.length > 0) {
        agent.tools.forEach((tool, index) => {
            const toolNode = {
                id: `tools-${tool.id}`,
                type: 'tools',
                data: { label: tool.name, id: tool.id, tool_type: tool.tool_type, mcp_server_url: tool.mcp_server_url },
                position: { x: 50 + index * 250, y: 200 },
            };
            nodesToAdd.push(toolNode);
            edgesToAdd.push({ id: `agent-tool-edge-${tool.id}`, source: 'agent-node', target: toolNode.id, animated: true });
        });
    }
    
    const finalNodes = [...initialNodes(agent.name), ...nodesToAdd];
    console.log("Setting nodes:", finalNodes);
    setNodes(finalNodes);

    console.log("Setting edges:", edgesToAdd);
    setEdges(edgesToAdd);
  }, [agent, setNodes, setEdges]);

  const nodeTypes = useMemo(() => ({
    agent: AgentNode,
    tools: ToolsNode,
    knowledge: KnowledgeNode,
    mcp_sub_tool: McpSubToolNode,
    chat_message: ChatMessageNode,
  }), []);

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
      toast.success("Agent updated successfully!");
    },
    onError: (error) => {
      toast.error("Failed to update agent.");
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
            }
        }
    }
  }, [onNodesChange, nodes, mutation, agent]);

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
        }
      }
    }
  }, [onEdgesChange, nodes, edges, mutation, agent]);

  const onDrop = useCallback((event) => {
    event.preventDefault();
    if (!reactFlowInstance) return;

    const dataString = event.dataTransfer.getData('application/reactflow');
    if (typeof dataString === 'undefined' || !dataString) return;

    const { nodeType, id, label, toolType, mcpServerUrl } = JSON.parse(dataString);

    if (nodes.some(n => n.id === `${nodeType}-${id}`)) {
      toast.warning(`This ${nodeType} has already been added.`);
      return;
    }

    if (nodeType === 'knowledge') {
      const existingKbIds = agent.knowledge_base_ids || [];
      mutation.mutate({ knowledge_base_ids: [...new Set([...existingKbIds, id])] });
    }
    if (nodeType === 'tools') {
      console.log("Agent object before update:", agent);
      const existingToolIds = agent.tools?.map(t => t.id) || [];
      console.log("Existing tool IDs:", existingToolIds);
      const newToolIds = [...new Set([...existingToolIds, id])];
      console.log("New tool IDs to be sent:", newToolIds);
      mutation.mutate({ tool_ids: newToolIds });
    }
  }, [reactFlowInstance, nodes, agent, mutation]);

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

        const newNodes = mcpToolsData.tools.map((subTool, index) => ({
          id: `mcp-sub-tool-${tool.id}-${subTool.name}`,
          type: 'mcp_sub_tool',
          data: { label: subTool.name },
          position: { x: mcpToolNode.position.x + 300, y: mcpToolNode.position.y + index * 70 },
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
    setSelectedNode(node);
  }, []);

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
    <div className="flex h-[80vh] w-full border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden card-shadow-lg bg-white dark:bg-slate-800">
      <AgentBuilderContext.Provider value={contextValue}>
        <ReactFlowProvider>
          <AgentComponentSidebar agent={agent} />
          <div className="flex-grow workflow-canvas bg-slate-50 dark:bg-slate-900">
            <ReactFlow
              nodes={nodes}
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
              defaultEdgeOptions={{
                type: 'smoothstep',
                animated: true,
                style: { stroke: '#10b981', strokeWidth: 2 },
              }}
            >
              <Background
                variant="dots"
                gap={20}
                size={1}
                color="#cbd5e1"
                className="dark:opacity-30"
              />
              <Controls className="bg-white dark:bg-slate-800 rounded-lg shadow-lg border dark:border-slate-700" />
            </ReactFlow>
          </div>
          <AgentPropertiesPanel agent={agent} selectedNode={selectedNode} onNodeDelete={onNodeDelete} />
        </ReactFlowProvider>
      </AgentBuilderContext.Provider>
    </div>
  );
};