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
import { Edit, ArrowLeft } from 'lucide-react';

import Sidebar from './Sidebar';
import PropertiesPanel from './PropertiesPanel';
import { WorkflowDetailsDialog } from './WorkflowDetailsDialog';
import { LlmNode, ToolNode, ConditionNode, OutputNode, StartNode, ListenNode, PromptNode, KnowledgeNode, CodeNode, DataManipulationNode, HttpRequestNode, FormNode } from './CustomNodes';
import { useAuth } from "@/hooks/useAuth";

const initialNodes = [
  { id: 'start-node', type: 'start', data: { label: 'Start' }, position: { x: 250, y: 5 } },
];

const VisualWorkflowBuilder = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [workflow, setWorkflow] = useState(null);
  const [isDetailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const { workflowId } = useParams();
  const navigate = useNavigate();
  const reactFlowWrapper = useRef(null);
  const { authFetch } = useAuth();

  const nodeTypes = useMemo(() => ({ 
    llm: LlmNode, tool: ToolNode, condition: ConditionNode, output: OutputNode, 
    start: StartNode, listen: ListenNode, prompt: PromptNode, knowledge: KnowledgeNode, 
    code: CodeNode, data_manipulation: DataManipulationNode, http_request: HttpRequestNode, form: FormNode
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
        toast.error("Failed to load workflow.");
        navigate('/dashboard/workflows');
      }
    };
    fetchWorkflow();
  }, [workflowId, authFetch, navigate, setNodes, setEdges]);

  const saveWorkflow = async (details) => {
    if (!workflow) return toast.error("No workflow selected.");

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
      toast.success("Workflow saved successfully.");
    } catch (error) {
      toast.error(`Save failed: ${error.message}`);
    }
  };
  
  const onConnect = useCallback((params) => setEdges((eds) => addEdge(params, eds)), [setEdges]);
  const onDragOver = useCallback((event) => { event.preventDefault(); event.dataTransfer.dropEffect = 'move'; }, []);
  const onDrop = useCallback((event) => {
    event.preventDefault();
    if (!reactFlowInstance) return;
    const type = event.dataTransfer.getData('application/reactflow');
    if (typeof type === 'undefined' || !type) return;
    const position = reactFlowInstance.screenToFlowPosition({ x: event.clientX, y: event.clientY });
    const newNode = { id: `${type}-${+new Date()}`, type, position, data: { label: `${type} node` } };
    setNodes((nds) => nds.concat(newNode));
  }, [reactFlowInstance, setNodes]);
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

  if (!workflow) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <WorkflowDetailsDialog
        isOpen={isDetailsDialogOpen}
        onClose={() => setDetailsDialogOpen(false)}
        workflow={workflow}
        onSave={saveWorkflow}
      />
      <div className="dndflow" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '10px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', background: 'white' }}>
            <Button onClick={() => navigate('/dashboard/workflows')} variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Workflows
            </Button>
            <div className="flex-grow">
                <h2 className="text-lg font-semibold">{workflow.name} - v{workflow.version}</h2>
                <p className="text-sm text-gray-600">{workflow.description || "No description provided."}</p>
            </div>
            <Button onClick={() => saveWorkflow()} variant="default">Save Current</Button>
            <Button onClick={() => setDetailsDialogOpen(true)} variant="ghost" size="icon">
              <Edit className="h-4 w-4" />
            </Button>
        </div>
        
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