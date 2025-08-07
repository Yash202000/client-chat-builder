
import React from 'react';
import { Handle, Position } from 'react-flow-renderer';

export const ConditionalNode = ({ data }) => {
  return (
    <div style={{ background: '#f0f0f0', border: '1px solid #333', padding: '10px', borderRadius: '5px' }}>
      <Handle type="target" position={Position.Top} />
      <div>
        <strong>Conditional Node</strong>
      </div>
      <div>
        <p>{data.label}</p>
      </div>
      <Handle type="source" id="true" style={{ left: '25%', background: '#55dd55' }} position={Position.Bottom} />
      <Handle type="source" id="false" style={{ left: '75%', background: '#dd5555' }} position={Position.Bottom} />
    </div>
  );
};
