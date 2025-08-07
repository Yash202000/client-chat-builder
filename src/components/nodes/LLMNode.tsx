
import React from 'react';
import { Handle, Position } from 'react-flow-renderer';

export const LLMNode = ({ data }) => {
  return (
    <div style={{ background: '#f0f0f0', border: '1px solid #333', padding: '10px', borderRadius: '5px' }}>
      <Handle type="target" position={Position.Top} />
      <div>
        <strong>LLM Node</strong>
      </div>
      <div>
        <p>{data.label}</p>
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
};
