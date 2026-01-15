import React, { useState, useContext } from 'react';
import { useStore } from 'reactflow';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AddNodePopover } from './AddNodePopover';
import { WorkflowBuilderContext } from './WorkflowBuilderContext';

interface AddNodeButtonProps {
  nodeId: string;
  handleId: string;
  position: 'bottom' | 'right';
  handleOffset?: { left?: string; top?: string };
}

export const AddNodeButton: React.FC<AddNodeButtonProps> = ({
  nodeId,
  handleId,
  position,
  handleOffset
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const context = useContext(WorkflowBuilderContext);

  // Check if this handle already has an outgoing connection
  // Handle cases where sourceHandle might be null/undefined for single-handle nodes
  const edges = useStore((state) => state.edges);

  const hasOutgoingEdge = edges.some((edge) => {
    if (edge.source !== nodeId) return false;

    // Exact match
    if (edge.sourceHandle === handleId) return true;

    // If edge.sourceHandle is null/undefined, it connects to the default handle
    // For most nodes, this is "output" or "message" for trigger nodes
    if (edge.sourceHandle == null) {
      return handleId === 'output' || handleId === 'message';
    }

    return false;
  });

  // Don't render if there's already a connection
  if (hasOutgoingEdge) {
    return null;
  }

  const handleSelectNode = (nodeType: string, nodeData: Record<string, any>) => {
    if (context?.addNodeWithConnection) {
      context.addNodeWithConnection(nodeId, handleId, nodeType, nodeData, position);
    }
  };

  // Position styles based on handle position
  // Use CSS calc to position outside the node box
  const getPositionStyles = (): React.CSSProperties => {
    if (position === 'bottom') {
      return {
        position: 'absolute' as const,
        bottom: '-28px',
        left: handleOffset?.left || '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
      };
    } else {
      // right position
      return {
        position: 'absolute' as const,
        right: '-28px',
        top: handleOffset?.top || '50%',
        transform: 'translateY(-50%)',
        zIndex: 1000,
      };
    }
  };

  return (
    <div className="add-node-btn-wrapper" style={getPositionStyles()}>
      <AddNodePopover
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        onSelectNode={handleSelectNode}
        side={position === 'bottom' ? 'bottom' : 'right'}
        align="center"
      >
        <button
          className={cn(
            "w-6 h-6 rounded-full",
            "bg-gradient-to-br from-purple-500 to-indigo-600",
            "border-2 border-white dark:border-slate-800",
            "shadow-md shadow-purple-500/30",
            "hover:scale-110 hover:shadow-lg hover:shadow-purple-500/40",
            "transition-all duration-200",
            "flex items-center justify-center",
            "cursor-pointer",
            "focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2"
          )}
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(true);
          }}
          title="Add node"
        >
          <Plus className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
        </button>
      </AddNodePopover>
    </div>
  );
};

export default AddNodeButton;
