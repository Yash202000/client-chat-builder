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
import { Edit, ArrowLeft, Workflow as WorkflowIcon, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

import Sidebar from './Sidebar';
import PropertiesPanel from './PropertiesPanel';
import { WorkflowDetailsDialog } from './WorkflowDetailsDialog';
import { LlmNode, ToolNode, ConditionNode, OutputNode, StartNode, ListenNode, PromptNode, KnowledgeNode, CodeNode, DataManipulationNode, HttpRequestNode, FormNode } from './CustomNodes';
import { useAuth } from "@/hooks/useAuth";
import { Comments } from './Comments';

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
      <div className="dndflow h-screen flex flex-col bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Enhanced Toolbar */}
        <div className="flex-shrink-0 px-6 py-4 border-b bg-white shadow-sm">
          <div className="flex items-center gap-4 flex-wrap">
            <Button onClick={() => navigate('/dashboard/workflows')} variant="outline" size="sm" className="btn-hover-lift">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div className="flex-grow min-w-0">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                  <WorkflowIcon className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-lg font-bold truncate">{workflow.name}</h2>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">v{workflow.version}</Badge>
                    {workflow.is_active && (
                      <Badge className="bg-green-100 text-green-800 border-green-200 text-xs">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button onClick={() => setDetailsDialogOpen(true)} variant="outline" size="sm" className="btn-hover-lift">
                <Edit className="h-4 w-4 mr-2" />
                Edit Details
              </Button>
              <Button
                onClick={() => saveWorkflow()}
                size="sm"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 btn-hover-lift"
              >
                Save Workflow
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
                  style: { stroke: '#6366f1', strokeWidth: 2 },
                }}
              >
                <Controls className="bg-white rounded-lg shadow-lg border" />
                <MiniMap
                  className="bg-white rounded-lg shadow-lg border"
                  nodeColor={(node) => {
                    if (node.type === 'start') return '#10b981';
                    if (node.type === 'output') return '#ef4444';
                    return '#3b82f6';
                  }}
                />
                <Background variant="dots" gap={20} size={1} color="#cbd5e1" />
              </ReactFlow>
            </div>
            {/* Enhanced Properties Panel */}
            <div className="w-80 border-l bg-white shadow-lg overflow-y-auto">
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