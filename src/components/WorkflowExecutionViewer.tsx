import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactFlow, {
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { toast } from "sonner";
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play } from 'lucide-react';

import { LlmNode, ToolNode, ConditionNode, OutputNode, StartNode, ListenNode, PromptNode, KnowledgeNode, CodeNode, DataManipulationNode, HttpRequestNode, FormNode } from './CustomNodes';
import { useAuth } from "@/hooks/useAuth";
import { useWebSocket } from '@/hooks/use-websocket';

const initialNodes = [
  { id: 'start-node', type: 'start', data: { label: 'Start' }, position: { x: 250, y: 5 } },
];

const WorkflowExecutionViewer = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [workflow, setWorkflow] = useState(null);
  const [executionState, setExecutionState] = useState({}); // Tracks the state of each node
  const [sessionId, setSessionId] = useState(null);

  const { workflowId } = useParams();
  const navigate = useNavigate();
  const { authFetch } = useAuth();

  const nodeTypes = useMemo(() => ({ 
    llm: LlmNode, tool: ToolNode, condition: ConditionNode, output: OutputNode, 
    start: StartNode, listen: ListenNode, prompt: PromptNode, knowledge: KnowledgeNode, 
    code: CodeNode, data_manipulation: DataManipulationNode, http_request: HttpRequestNode, form: FormNode
  }), []);

  // Fetch the workflow structure
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

  // WebSocket connection for real-time updates
  const wsUrl = sessionId ? `ws://localhost:8000/ws/workflow-execution/${sessionId}` : null;
  useWebSocket(wsUrl, {
    onMessage: (event) => {
      const data = JSON.parse(event.data);
      toast.info(`Node ${data.node_id} is ${data.status}`);
      setExecutionState(prevState => ({
        ...prevState,
        [data.node_id]: data.status, // e.g., 'running', 'completed', 'failed'
      }));
    },
  });

  const handleTestWorkflow = async () => {
    try {
      // Reset previous state
      setExecutionState({});
      
      // Get a new session ID from the backend
      const response = await authFetch(`/api/v1/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initial_input: "Start" }), // Or some initial context
      });
      if (!response.ok) throw new Error('Failed to start workflow execution');
      const data = await response.json();
      
      setSessionId(data.session_id);
      toast.success("Workflow execution started. Listening for updates...");

    } catch (error) {
      toast.error(`Execution failed to start: ${error.message}`);
    }
  };

  // Add execution state to each node's data
  const nodesWithExecutionState = useMemo(() => {
    return nodes.map(node => ({
      ...node,
      data: {
        ...node.data,
        executionStatus: executionState[node.id],
      },
    }));
  }, [nodes, executionState]);

  if (!workflow) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '10px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '10px', background: 'white' }}>
          <Button onClick={() => navigate(`/dashboard/workflows/${workflowId}`)} variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Builder
          </Button>
          <div className="flex-grow">
              <h2 className="text-lg font-semibold">{workflow.name} - Execution Viewer</h2>
              <p className="text-sm text-gray-600">{workflow.description || "No description provided."}</p>
          </div>
          <Button onClick={handleTestWorkflow} variant="default">
            <Play className="h-4 w-4 mr-2" />
            Test Workflow
          </Button>
      </div>
      
      <div style={{ flexGrow: 1 }}>
        <ReactFlowProvider>
          <ReactFlow
            nodes={nodesWithExecutionState}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            fitView
            nodeTypes={nodeTypes}
            prohibitZoom
            prohibitPan
            nodesDraggable={false}
            nodesConnectable={false}
          >
            <Controls showInteractive={false} />
            <MiniMap />
            <Background variant="dots" gap={12} size={1} />
          </ReactFlow>
        </ReactFlowProvider>
      </div>
    </div>
  );
};

export default WorkflowExecutionViewer;
