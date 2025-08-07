import React, { useState } from 'react';

// A simple, reusable modal component
const Modal = ({ children, onClose }) => (
  <div style={{
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
  }} onClick={onClose}>
    <div style={{
      backgroundColor: 'white', padding: '25px', borderRadius: '8px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', width: '400px'
    }} onClick={e => e.stopPropagation()}>
      {children}
    </div>
  </div>
);

const CreateWorkflowDialog = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (name.trim()) {
      onSubmit({ name, description });
      onClose(); // Close dialog after submission
      setName('');
      setDescription('');
    } else {
      alert('Workflow name is required.');
    }
  };

  return (
    <Modal onClose={onClose}>
      <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.5rem' }}>Create New Workflow</h2>
      <div style={{ marginBottom: '15px' }}>
        <label htmlFor="workflow-name" style={{ display: 'block', marginBottom: '5px' }}>Name</label>
        <input
          id="workflow-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Customer Onboarding"
          style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc' }}
        />
      </div>
      <div style={{ marginBottom: '25px' }}>
        <label htmlFor="workflow-desc" style={{ display: 'block', marginBottom: '5px' }}>Description (Optional)</label>
        <textarea
          id="workflow-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="A brief description of what this workflow does."
          style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ccc', resize: 'vertical' }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
        <button onClick={onClose} style={{ padding: '10px 20px', borderRadius: '5px', border: '1px solid #ccc', background: '#f0f0f0' }}>
          Cancel
        </button>
        <button onClick={handleSubmit} style={{ padding: '10px 20px', borderRadius: '5px', border: 'none', background: '#3B82F6', color: 'white' }}>
          Create
        </button>
      </div>
    </Modal>
  );
};

export default CreateWorkflowDialog;