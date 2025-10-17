import React from 'react';
import AceEditor from 'react-ace';

import 'ace-builds/src-noconflict/mode-python';
import 'ace-builds/src-noconflict/theme-monokai';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string;
  width?: string;
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  placeholder = "Write your Python code here...",
  height = "100%",
  width = "100%",
}) => {
  return (
    <AceEditor
      mode="python"
      theme="monokai"
      onChange={onChange}
      name="code-editor"
      editorProps={{ $blockScrolling: true }}
      value={value}
      placeholder={placeholder}
      height={height}
      width={width}
      setOptions={{
        useWorker: false,
        showLineNumbers: true,
        tabSize: 2,
      }}
    />
  );
};

export default CodeEditor;
