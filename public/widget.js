
(function() {
    const SCRIPT_ID = 'agent-connect-widget-script';
    const scriptTag = document.getElementById(SCRIPT_ID);

    if (!scriptTag) {
        console.error('AgentConnect widget script tag not found with ID:', SCRIPT_ID);
        return;
    }

    const agentId = scriptTag.getAttribute('data-agent-id');
    const companyId = scriptTag.getAttribute('data-company-id');
    const backendUrl = 'ws://localhost:8000'; // Your backend WebSocket URL

    if (!agentId || !companyId) {
        console.error('AgentConnect widget requires data-agent-id and data-company-id attributes on the script tag.');
        return;
    }

    let ws = null;
    let sessionId = null;
    let chatWindow = null;
    let chatMessages = null;
    let chatInput = null;

    function generateSessionId() {
        return 'session_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    }

    function createChatWidget() {
        // Create floating button
        const button = document.createElement('button');
        button.style.position = 'fixed';
        button.style.bottom = '20px';
        button.style.right = '20px';
        button.style.width = '60px';
        button.style.height = '60px';
        button.style.borderRadius = '50%';
        button.style.backgroundColor = '#6366F1'; // Indigo-500
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.cursor = 'pointer';
        button.style.fontSize = '24px';
        button.style.display = 'flex';
        button.style.alignItems = 'center';
        button.style.justifyContent = 'center';
        button.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
        button.style.zIndex = '9999';
        button.innerHTML = '💬'; // Chat icon
        document.body.appendChild(button);

        // Create chat window
        chatWindow = document.createElement('div');
        chatWindow.style.position = 'fixed';
        chatWindow.style.bottom = '90px';
        chatWindow.style.right = '20px';
        chatWindow.style.width = '350px';
        chatWindow.style.height = '450px';
        chatWindow.style.backgroundColor = 'white';
        chatWindow.style.borderRadius = '10px';
        chatWindow.style.boxShadow = '0 10px 20px rgba(0, 0, 0, 0.2)';
        chatWindow.style.zIndex = '9998';
        chatWindow.style.display = 'none'; // Hidden by default
        chatWindow.style.flexDirection = 'column';
        chatWindow.style.overflow = 'hidden';

        chatWindow.innerHTML = `
            <div style="background-color: #6366F1; color: white; padding: 15px; border-top-left-radius: 10px; border-top-right-radius: 10px; font-weight: bold;">
                Agent Chat
            </div>
            <div class="chat-messages" style="flex-grow: 1; padding: 10px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px;">
                <!-- Messages will go here -->
            </div>
            <div style="padding: 10px; border-top: 1px solid #eee; display: flex;">
                <input type="text" placeholder="Type a message..." class="chat-input" style="flex-grow: 1; padding: 8px; border: 1px solid #ddd; border-radius: 5px; margin-right: 10px;">
                <button class="send-button" style="background-color: #6366F1; color: white; border: none; padding: 8px 15px; border-radius: 5px; cursor: pointer;">Send</button>
            </div>
        `;
        document.body.appendChild(chatWindow);

        chatMessages = chatWindow.querySelector('.chat-messages');
        chatInput = chatWindow.querySelector('.chat-input');
        const sendButton = chatWindow.querySelector('.send-button');

        button.onclick = toggleChatWindow;
        sendButton.onclick = sendMessage;
        chatInput.onkeypress = (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        };
    }

    function toggleChatWindow() {
        if (chatWindow.style.display === 'none') {
            chatWindow.style.display = 'flex';
            initWebSocket();
        } else {
            chatWindow.style.display = 'none';
            if (ws) {
                ws.close();
                ws = null;
            }
        }
    }

    function initWebSocket() {
        if (ws && ws.readyState === WebSocket.OPEN) {
            return;
        }
        sessionId = generateSessionId();
        // Corrected WebSocket URL
        ws = new WebSocket(`${backendUrl}/ws/${companyId}/${agentId}/${sessionId}`);

        ws.onopen = () => {
            console.log('WebSocket connected');
        };

        ws.onmessage = (event) => {
            // The agent's response is now a direct string
            const messageText = event.data;
            addMessage('Agent', messageText, 'agent');
        };

        ws.onclose = () => {
            console.log('WebSocket disconnected');
        };

        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            addMessage('System', 'Connection error. Please try again later.', 'agent');
        };
    }

    function addMessage(senderName, messageText, senderType) {
        const messageElement = document.createElement('div');
        messageElement.style.display = 'flex';
        messageElement.style.justifyContent = senderType === 'user' ? 'flex-end' : 'flex-start';

        const bubble = document.createElement('div');
        bubble.style.maxWidth = '70%';
        bubble.style.padding = '8px 12px';
        bubble.style.borderRadius = '15px';
        bubble.style.wordWrap = 'break-word';

        if (senderType === 'user') {
            bubble.style.backgroundColor = '#6366F1'; // Indigo-500
            bubble.style.color = 'white';
            bubble.style.borderBottomRightRadius = '2px';
        } else {
            bubble.style.backgroundColor = '#E0E7FF'; // Indigo-100
            bubble.style.color = '#1F2937'; // Gray-800
            bubble.style.borderBottomLeftRadius = '2px';
        }

        bubble.innerHTML = `<strong>${senderName}:</strong> ${messageText}`;
        messageElement.appendChild(bubble);
        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to bottom
    }

    function sendMessage() {
        const message = chatInput.value.trim();
        if (message && ws && ws.readyState === WebSocket.OPEN) {
            ws.send(message);
            addMessage('You', message, 'user');
            chatInput.value = '';
        }
    }

    // Initialize the widget
    createChatWidget();
})();
