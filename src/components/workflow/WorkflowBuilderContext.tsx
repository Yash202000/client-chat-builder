import { createContext } from 'react';
import { Node, Edge } from 'reactflow';

export interface WorkflowBuilderContextType {
  addNodeWithConnection: (
    sourceId: string,
    sourceHandle: string,
    nodeType: string,
    nodeData: Record<string, any>,
    handlePosition: 'bottom' | 'right'
  ) => string | null;
  nodes: Node[];
  edges: Edge[];
}

export const WorkflowBuilderContext = createContext<WorkflowBuilderContextType | null>(null);
