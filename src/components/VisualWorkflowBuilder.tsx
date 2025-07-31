import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Edit } from 'lucide-react';

import Sidebar from './Sidebar';
import PropertiesPanel from './PropertiesPanel';
import CreateWorkflowDialog from './CreateWorkflowDialog';
import { WorkflowDetailsDialog } from './WorkflowDetailsDialog';
import { LlmNode, ToolNode, ConditionNode, OutputNode, StartNode, ListenNode, PromptNode, KnowledgeNode, CodeNode, DataManipulationNode, HttpRequestNode } from './CustomNodes';
import { useAuth } from "@/hooks/useAuth";

const initialNodes = [
  {
    id: 'start-node',
    type: 'start',
    data: { label: 'Start' },
    position: { x: 250, y: 5 },
  },
];

const VisualWorkflowBuilder = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [workflows, setWorkflows] = useState([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [isDetailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const reactFlowWrapper = useRef(null);
  const { authFetch } = useAuth();

  const nodeTypes = useMemo(() => ({ 
    llm: LlmNode, 
    tool: ToolNode, 
    condition: ConditionNode, 
    output: OutputNode, 
    start: StartNode,
    listen: ListenNode,
    prompt: PromptNode,
    knowledge: KnowledgeNode,
    code: CodeNode,
    data_manipulation: DataManipulationNode,
    http_request: HttpRequestNode
  }), []);

  const fetchWorkflows = async () => {
    try {
      const response = await authFetch('/api/v1/workflows/?company_id=1');
      if (!response.ok) throw new Error('Failed to fetch workflows');
      const data = await response.json();
      setWorkflows(data);
      if (data.length > 0) {
        handleWorkflowSelection(data[0]);
      }
    } catch (error) {
      toast.error("Failed to load workflows.");
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  useEffect(() => {
    if (selectedNode) {
      const updatedSelectedNode = nodes.find(node => node.id === selectedNode.id);
      if (updatedSelectedNode && updatedSelectedNode !== selectedNode) {
        setSelectedNode(updatedSelectedNode);
      }
    }
  }, [nodes, selectedNode]);

  const handleWorkflowSelection = (workflow) => {
    setSelectedWorkflow(workflow);
    if (workflow) {
      if (workflow.visual_steps) {
        try {
          const visualFlow = workflow.visual_steps;
          setNodes(visualFlow.nodes || initialNodes);
          setEdges(visualFlow.edges || []);
        } catch (e) {
          setNodes(initialNodes);
          setEdges([]);
          toast.info("Error loading visual layout.");
        }
      } else {
        setNodes(initialNodes);
        setEdges([]);
      }
    } else {
      setNodes(initialNodes);
      setEdges([]);
    }
  };
  
  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      if (!reactFlowInstance) return;
      const type = event.dataTransfer.getData('application/reactflow');
      if (typeof type === 'undefined' || !type) return;
      const position = reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
      
      let newNodeData = { label: `${type} node` };
      // ... (rest of onDrop logic remains the same)

      const newNode = { id: `${type}-${+new Date()}`, type, position, data: newNodeData };
      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const onNodeClick = useCallback((_, node) => setSelectedNode(node), []);
  const onPaneClick = useCallback(() => setSelectedNode(null), []);

  const deleteNode = useCallback(() => {
    if (selectedNode) {
      setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
      setEdges((eds) => eds.filter((edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id));
      setSelectedNode(null);
      toast.success("Node deleted.");
    }
  }, [selectedNode, setNodes, setEdges]);

  const saveWorkflow = async (details) => {
    if (!selectedWorkflow) return toast.error("No workflow selected.");

    const flowVisualData = { nodes, edges };

    const updatedWorkflow = {
      ...selectedWorkflow,
      name: details?.name || selectedWorkflow.name,
      description: details?.description || selectedWorkflow.description,
      visual_steps: flowVisualData
    };

    try {
      const response = await authFetch(`/api/v1/workflows/${selectedWorkflow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json'},
        body: JSON.stringify(updatedWorkflow),
      });
      if (!response.ok) throw new Error('Save failed');
      
      const savedWorkflow = await response.json();
      toast.success("Workflow saved successfully.");
      
      // Update state
      setWorkflows(workflows.map(w => w.id === savedWorkflow.id ? savedWorkflow : w));
      setSelectedWorkflow(savedWorkflow);

    } catch (error) {
      toast.error(`Save failed: ${error.message}`);
    }
  };

  const createWorkflow = async ({ name, description }) => {
    const newWorkflowPayload = {
      name,
      description,
      agent_id: 1,
      visual_steps: { nodes: initialNodes, edges: [] }
    };

    try {
      const response = await authFetch('/api/v1/workflows/?company_id=1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWorkflowPayload),
      });
      if (!response.ok) throw new Error('Creation failed');
      const newWorkflow = await response.json();
      setWorkflows([...workflows, newWorkflow]);
      handleWorkflowSelection(newWorkflow);
      toast.success(`Workflow "${name}" created.`);
    } catch (error) {
      toast.error(`Creation failed: ${error.message}`);
    }
  };

  const deleteWorkflow = async () => {
    if (!selectedWorkflow) return toast.error("No workflow selected.");
    if (window.confirm(`Delete "${selectedWorkflow.name}"?`)) {
      try {
        await authFetch(`/api/v1/workflows/${selectedWorkflow.id}`, { method: 'DELETE' });
        toast.success("Workflow deleted.");
        const newWorkflows = workflows.filter(w => w.id !== selectedWorkflow.id);
        setWorkflows(newWorkflows);
        handleWorkflowSelection(newWorkflows.length > 0 ? newWorkflows[0] : null);
      } catch (error) {
        toast.error("Deletion failed.");
      }
    }
  };

  return (
    <>
      <CreateWorkflowDialog 
        isOpen={isCreateDialogOpen} 
        onClose={() => setCreateDialogOpen(false)} 
        onSubmit={createWorkflow} 
      />
      <WorkflowDetailsDialog
        isOpen={isDetailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        workflow={selectedWorkflow}
        onSave={saveWorkflow}
      />
      <div className="dndflow" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '10px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <select 
              onChange={(e) => handleWorkflowSelection(workflows.find(w => w.id === parseInt(e.target.value)))}
              value={selectedWorkflow ? selectedWorkflow.id : ''}
              style={{ padding: '8px', flexShrink: 0 }}
            >
              {workflows.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
            <Button onClick={() => setCreateDialogOpen(true)} variant="outline">Create New</Button>
            <Button onClick={() => saveWorkflow()} variant="default">Save Current</Button>
            <Button onClick={deleteWorkflow} variant="destructive">Delete Current</Button>
            <Button onClick={() => setDetailsDialogOpen(true)} variant="ghost" size="icon" disabled={!selectedWorkflow}>
              <Edit className="h-4 w-4" />
            </Button>
        </div>
        
        {selectedWorkflow && (
          <div className="p-4 bg-gray-50 border-b">
            <h2 className="text-lg font-semibold">{selectedWorkflow.name}</h2>
            <p className="text-sm text-gray-600">{selectedWorkflow.description || "No description provided."}</p>
          </div>
        )}

        <div style={{ display: 'flex', flexGrow: 1 }}>
          <ReactFlowProvider>
            <Sidebar />
            <div className="reactflow-wrapper" style={{ flexGrow: 1, height: '100%' }} ref={reactFlowWrapper}>
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
              >
                <Controls />
                <MiniMap />
                <Background variant="dots" gap={12} size={1} />
              </ReactFlow>
            </div>
            <div style={{ width: '300px', borderLeft: '1px solid #eee', background: '#fcfcfc' }}>
              <PropertiesPanel selectedNode={selectedNode} nodes={nodes} setNodes={setNodes} deleteNode={deleteNode} />
            </div>
          </ReactFlowProvider>
        </div>
      </div>
    </>
  );
};

export default VisualWorkflowBuilder;