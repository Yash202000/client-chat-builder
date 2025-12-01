
import React from 'react';
import { Handle, Position } from 'react-flow-renderer';

// Color palette for condition handles
const CONDITION_COLORS = [
  '#22c55e', // green - first condition (if)
  '#3b82f6', // blue - second condition (else if)
  '#a855f7', // purple - third condition
  '#f97316', // orange - fourth condition
  '#06b6d4', // cyan - fifth condition
  '#ec4899', // pink - sixth condition
];

export const ConditionalNode = ({ data }) => {
  const conditions = data.conditions || [];
  const isMultiCondition = conditions.length > 0;

  // Calculate handle positions based on number of conditions
  const getHandlePosition = (index, total) => {
    // Distribute handles evenly across the bottom
    const spacing = 100 / (total + 1);
    return `${spacing * (index + 1)}%`;
  };

  return (
    <div style={{
      background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
      border: '2px solid #f59e0b',
      padding: '12px',
      borderRadius: '8px',
      minWidth: isMultiCondition ? `${Math.max(150, conditions.length * 60 + 60)}px` : '120px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <Handle type="target" position={Position.Top} style={{ background: '#f59e0b' }} />

      <div style={{ textAlign: 'center' }}>
        <strong style={{ color: '#92400e', fontSize: '12px' }}>
          {isMultiCondition ? '🔀 Multi-Condition' : '❓ Condition'}
        </strong>
      </div>

      <div style={{ textAlign: 'center', marginTop: '4px' }}>
        <span style={{ fontSize: '11px', color: '#78350f' }}>{data.label || 'Condition'}</span>
      </div>

      {isMultiCondition ? (
        <>
          {/* Render handles for each condition (0, 1, 2, ...) */}
          {conditions.map((condition, index) => (
            <Handle
              key={index}
              type="source"
              id={String(index)}
              position={Position.Bottom}
              style={{
                left: getHandlePosition(index, conditions.length + 1),
                background: CONDITION_COLORS[index % CONDITION_COLORS.length],
                width: '12px',
                height: '12px',
                border: '2px solid white',
              }}
              title={`Condition ${index}: ${condition.value || 'not set'}`}
            />
          ))}
          {/* Else handle */}
          <Handle
            type="source"
            id="else"
            position={Position.Bottom}
            style={{
              left: getHandlePosition(conditions.length, conditions.length + 1),
              background: '#ef4444',
              width: '12px',
              height: '12px',
              border: '2px solid white',
            }}
            title="Else (no condition matched)"
          />

          {/* Labels for handles */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-around',
            marginTop: '8px',
            fontSize: '9px',
            color: '#78350f'
          }}>
            {conditions.map((_, index) => (
              <span key={index} style={{ color: CONDITION_COLORS[index % CONDITION_COLORS.length] }}>
                {index}
              </span>
            ))}
            <span style={{ color: '#ef4444' }}>else</span>
          </div>
        </>
      ) : (
        <>
          {/* Legacy true/false handles */}
          <Handle
            type="source"
            id="true"
            position={Position.Bottom}
            style={{ left: '25%', background: '#22c55e', width: '10px', height: '10px' }}
            title="True"
          />
          <Handle
            type="source"
            id="false"
            position={Position.Bottom}
            style={{ left: '75%', background: '#ef4444', width: '10px', height: '10px' }}
            title="False"
          />
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '8px',
            fontSize: '9px',
            color: '#78350f',
            padding: '0 15%'
          }}>
            <span style={{ color: '#22c55e' }}>✓</span>
            <span style={{ color: '#ef4444' }}>✗</span>
          </div>
        </>
      )}
    </div>
  );
};
