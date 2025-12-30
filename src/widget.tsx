import React from 'react';
import ReactDOM from 'react-dom/client';
import Widget from './Widget';
import tailwindStyles from './index.css?inline';

// A self-invoking function to encapsulate our code and avoid global scope pollution
(function() {
  const SCRIPT_ID = 'agent-connect-widget-script';
  const WIDGET_ROOT_ID = 'agentconnect-widget';

  const scriptTag = document.currentScript || document.getElementById(SCRIPT_ID);
  const widgetRoot = document.getElementById(WIDGET_ROOT_ID);

  if (!scriptTag) {
    console.error('AgentConnect Widget: Could not find the script tag. Please add id="agent-connect-widget-script" to your script tag.');
    return;
  }

  if (!widgetRoot) {
    console.error(`AgentConnect Widget: Root element with id "${WIDGET_ROOT_ID}" not found.`);
    return;
  }

  const agentId = scriptTag.getAttribute('data-agent-id');
  const companyId = scriptTag.getAttribute('data-company-id');
  const backendUrl = scriptTag.getAttribute('data-backend-url');

  // Only set rtlEnabled if data-rtl attribute is explicitly provided
  const rtlAttr = scriptTag.getAttribute('data-rtl');
  const rtlEnabled = rtlAttr === null ? null : rtlAttr === 'true';

  const language = scriptTag.getAttribute('data-language') || null;
  const position = scriptTag.getAttribute('data-position') || null; // e.g., 'bottom-right', 'top-left', etc.

  if (!agentId || !companyId) {
    console.error('AgentConnect Widget: data-agent-id and data-company-id attributes are required on the script tag.');
    return;
  }

  // Create a shadow root to encapsulate styles
  const shadowRoot = widgetRoot.attachShadow({ mode: 'open' });

  // Create a container for the React app inside the shadow root
  const appContainer = document.createElement('div');
  shadowRoot.appendChild(appContainer);

  // Inject TailwindCSS styles into the shadow DOM
  const styleElement = document.createElement('style');
  styleElement.innerHTML = tailwindStyles;
  shadowRoot.appendChild(styleElement);

  // Render the React widget into the container
  const root = ReactDOM.createRoot(appContainer);
  root.render(
    <React.StrictMode>
      <Widget
        agentId={agentId}
        companyId={companyId}
        backendUrl={backendUrl}
        rtlOverride={rtlEnabled}
        languageOverride={language}
        positionOverride={position}
      />
    </React.StrictMode>
  );
})();
