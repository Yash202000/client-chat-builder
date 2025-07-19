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

import Sidebar from './Sidebar';
import PropertiesPanel from './PropertiesPanel';
import CreateWorkflowDialog from './CreateWorkflowDialog';
import { LlmNode, ToolNode, ConditionNode, OutputNode, StartNode } from './CustomNodes'; // Import custom nodes

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

  const reactFlowWrapper = useRef(null);

  // Define custom node types
  const nodeTypes = useMemo(() => ({ 
    llm: LlmNode, 
    tool: ToolNode, 
    condition: ConditionNode, 
    output: OutputNode, 
    start: StartNode
  }), []);

  const fetchWorkflows = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/workflows/?company_id=1', {
        headers: { 'X-Company-ID': '1' },
      });
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

  // Keep selectedNode in sync with nodes array
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
      // Prioritize visual_steps for rendering if available
      if (workflow.visual_steps) {
        try {
          const visualFlow = JSON.parse(workflow.visual_steps);
          setNodes(visualFlow.nodes || initialNodes);
          setEdges(visualFlow.edges || []);
        } catch (e) {
          console.error("Error parsing visual_steps:", e);
          setNodes(initialNodes);
          setEdges([]);
          toast.info("Error loading visual layout. Please redesign and save.");
        }
      } else if (workflow.steps) {
        // If no visual_steps but steps exist (old format), show initial node and prompt user
        setNodes(initialNodes);
        setEdges([]);
        toast.info("This workflow was created in an older format. Please design its visual layout.");
      } else {
        // Empty workflow
        setNodes(initialNodes);
        setEdges([]);
      }
    } else {
      setNodes(initialNodes);
      setEdges([]);
    }
  };
  
  const onConnect = useCallback((params) => {
    setEdges((eds) => addEdge(params, eds));

    // If a connection is made to a target handle (input parameter)
    if (params.targetHandle) {
      const sourceNode = nodes.find(node => node.id === params.source);

      // The source node's output should be linked to the target node's input parameter.
      // The 'start' node provides the initial user message. Other nodes provide their execution result.
      if (sourceNode) {
        setNodes((nds) =>
          nds.map((node) => {
            if (node.id === params.target) {
              // Ensure the params object exists before trying to modify it
              const currentParams = node.data.params || {};
              const newParams = {
                ...currentParams,
                [params.targetHandle]: `{{${params.source}.output}}`, // e.g., {{start-node.output}}
              };
              return {
                ...node,
                data: {
                  ...node.data,
                  params: newParams,
                },
              };
            }
            return node;
          }),
        );
      }
    }
  }, [setEdges, setNodes, nodes]);
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
      const newNode = { id: `${type}-${+new Date()}`, type, position, data: { label: `${type} node` } };
      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance]
  );

  const onNodeClick = useCallback((_, node) => setSelectedNode(node), []);
  const onPaneClick = useCallback(() => setSelectedNode(null), []);

  const deleteNode = useCallback(() => {
    if (selectedNode) {
      const deletedNodeId = selectedNode.id;

      // Update nodes: remove the selected node and clear references in other nodes' params
      setNodes((nds) =>
        nds.filter((node) => node.id !== deletedNodeId).map((node) => {
          if (node.data.params) {
            const newParams = { ...node.data.params };
            let paramsChanged = false;
            for (const paramName in newParams) {
              // Check if the parameter value is a reference to the deleted node's output
              if (typeof newParams[paramName] === 'string' && newParams[paramName].includes(`{{${deletedNodeId}.output}}`)) {
                newParams[paramName] = ''; // Clear the parameter value
                paramsChanged = true;
              }
            }
            if (paramsChanged) {
              return { ...node, data: { ...node.data, params: newParams } };
            }
          }
          return node;
        }),
      );

      // Update edges: remove edges connected to the deleted node
      setEdges((eds) => eds.filter((edge) => edge.source !== deletedNodeId && edge.target !== deletedNodeId));

      setSelectedNode(null);
      toast.success("Node deleted.");
    }
  }, [selectedNode, setNodes, setEdges]);

  const saveWorkflow = async () => {
    if (!selectedWorkflow) return toast.error("No workflow selected.");

    // --- Transformation Logic: Convert React Flow data to backend executable steps ---
    const backendSteps = { steps: {} };
    const nodeMap = new Map(nodes.map(node => [node.id, node]));

    nodes.forEach(node => {
      // Use the unique node ID as the step name (key) for the backend
      const stepName = node.id;

      // Start nodes are the entry point and don't become an executable step themselves
      if (node.type === 'start') return;

      let stepConfig: { tool: string; params: any; next_step_on_success?: string | null; next_step_on_failure?: string | null; } = {
        tool: '',
        params: {},
      };

      if (node.type === 'llm') {
        stepConfig.tool = 'llm_tool';
        stepConfig.params = {
          model: node.data.model,
          prompt: node.data.prompt,
        };
      } else if (node.type === 'tool') {
        stepConfig.tool = node.data.tool;
        stepConfig.params = node.data.params || {};
      } else if (node.type === 'condition') {
        stepConfig.tool = 'condition_tool';
        stepConfig.params = {}; // Future-proofing
      }

      // Find outgoing edges to determine the next step's unique ID
      const outgoingEdges = edges.filter(edge => edge.source === node.id);

      if (node.type === 'condition') {
        const trueEdge = outgoingEdges.find(edge => edge.sourceHandle === 'true');
        const falseEdge = outgoingEdges.find(edge => edge.sourceHandle === 'false');
        if (trueEdge) stepConfig.next_step_on_success = trueEdge.target; // Use target node ID
        if (falseEdge) stepConfig.next_step_on_failure = falseEdge.target; // Use target node ID
      } else {
        // For non-condition nodes, find the next step by the edge connection
        const nextEdge = outgoingEdges[0];
        if (nextEdge) stepConfig.next_step_on_success = nextEdge.target; // Use target node ID
      }

      backendSteps.steps[stepName] = stepConfig;
    });

    // Determine the very first step of the workflow
    const startNode = nodes.find(node => node.type === 'start');
    if (startNode) {
      const firstEdge = edges.find(edge => edge.source === startNode.id);
      if (firstEdge) {
        backendSteps.first_step = first_step.target; // The ID of the node connected to the start node
      }
    }


    const flowVisualData = { nodes, edges };

    const updatedWorkflow = {
      ...selectedWorkflow,
      steps: backendSteps, // Backend executable steps
      visual_steps: JSON.stringify(flowVisualData) // Frontend visual data
    };

    try {
      const response = await fetch(`http://localhost:8000/api/v1/workflows/${selectedWorkflow.id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'X-Company-ID': '1' },
          body: JSON.stringify(updatedWorkflow),
        });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Save failed');
      }
      toast.success("Workflow saved successfully.");
      setWorkflows(workflows.map(w => w.id === updatedWorkflow.id ? updatedWorkflow : w));
    } catch (error) {
      toast.error(`Save failed: ${error.message}`);
    }
  };

  const createWorkflow = async ({ name, description }) => {
    const newWorkflowPayload = {
      name,
      description,
      agent_id: 1,
      steps: { nodes: initialNodes, edges: [] }, // Initial backend steps (empty for now)
      visual_steps: JSON.stringify({ nodes: initialNodes, edges: [] }) // Initial visual steps
    };

    try {
      const response = await fetch('http://localhost:8000/api/v1/workflows/?company_id=1', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Company-ID': '1' },
        body: JSON.stringify(newWorkflowPayload),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Creation failed');
      }
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
        const response = await fetch(`http://localhost:8000/api/v1/workflows/${selectedWorkflow.id}`, {
          method: 'DELETE',
          headers: { 'X-Company-ID': '1' },
        });
        if (!response.ok) throw new Error('Deletion failed');
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
      <div className="dndflow" style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '10px', borderBottom: '1px solid #eee', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <select 
            onChange={(e) => handleWorkflowSelection(workflows.find(w => w.id === parseInt(e.target.value)))}
            value={selectedWorkflow ? selectedWorkflow.id : ''}
            style={{ padding: '8px' }}
          >
            {workflows.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
          <button onClick={() => setCreateDialogOpen(true)} style={{ padding: '8px', background: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px' }}>Create New</button>
          <button onClick={saveWorkflow} style={{ padding: '8px', background: '#3B82F6', color: 'white', border: 'none', borderRadius: '5px' }}>Save Current</button>
          <button onClick={deleteWorkflow} style={{ padding: '8px', background: '#f44336', color: 'white', border: 'none', borderRadius: '5px' }}>Delete Current</button>
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
                nodeTypes={nodeTypes} // Register custom node types
                deleteKeyCode={['Backspace', 'Delete']}
              >
                <Controls />
                <MiniMap />
                <Background variant="dots" gap={12} size={1} />
              </ReactFlow>
            </div>
            <div style={{ width: '300px', borderLeft: '1px solid #eee', background: '#fcfcfc' }}>
              <PropertiesPanel selectedNode={selectedNode} setNodes={setNodes} deleteNode={deleteNode} />
            </div>
          </ReactFlowProvider>
        </div>
      </div>
    </>
  );
};

export default VisualWorkflowBuilder;