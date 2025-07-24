(function() {
    const SCRIPT_ID = 'agent-connect-widget-script';
    const scriptTag = document.getElementById(SCRIPT_ID);

    if (!scriptTag) {
        console.error('AgentConnect: Widget script tag not found.');
        return;
    }

    const agentId = scriptTag.getAttribute('data-agent-id');
    const companyId = scriptTag.getAttribute('data-company-id');
    const httpBackendUrl = 'http://localhost:8000';
    const wsBackendUrl = 'ws://localhost:8000';

    if (!agentId || !companyId) {
        console.error('AgentConnect: data-agent-id and data-company-id are required.');
        return;
    }

    let ws = null;
    let sessionId = null;
    let chatContainer, chatWindow, chatMessages, chatInput, widgetButton;
    let isProactiveSession = false;

    const widgetSizes = {
        small: { width: '300px', height: '400px' },
        medium: { width: '350px', height: '500px' },
        large: { width: '400px', height: '600px' },
    };

    let widgetSettings = {
        primary_color: "#3B82F6",
        header_title: "Customer Support",
        welcome_message: "Hi! How can I help you today?",
        position: "bottom-right",
        border_radius: 12,
        font_family: "Inter, sans-serif",
        agent_avatar_url: "",
        input_placeholder: "Type a message...",
        user_message_color: "#3B82F6",
        user_message_text_color: "#FFFFFF",
        bot_message_color: "#E0E7FF", // Light gray for bot messages
        bot_message_text_color: "#1F2937",
        widget_size: "medium",
        show_header: true,
    };

    function generateSessionId() {
        return 'session_' + Math.random().toString(36).substring(2, 15);
    }

    async function fetchAndApplySettings() {
        try {
            const response = await fetch(`${httpBackendUrl}/api/v1/agents/${agentId}/widget-settings`);
            if (response.ok) {
                const customSettings = await response.json();
                widgetSettings = { ...widgetSettings, ...customSettings };
                console.log('AgentConnect: Fetched widget settings:', widgetSettings);
            }
        } catch (error) {
            console.error('AgentConnect: Error fetching settings:', error);
        } finally {
            createChatWidget();
            if (widgetSettings.proactive_message_enabled) {
                console.log('AgentConnect: Proactive messaging is enabled. Delay:', widgetSettings.proactive_message_delay);
                setTimeout(triggerProactiveChat, widgetSettings.proactive_message_delay * 1000);
            }
        }
    }

    function triggerProactiveChat() {
        if (chatWindow.style.display === 'none') { // Only trigger if chat is not open
            isProactiveSession = true;
            toggleChatWindow();
        }
    }

    function createChatWidget() {
        chatContainer = document.createElement('div');
        chatContainer.style.position = 'fixed';
        chatContainer.style.zIndex = '9999';
        const [vertical, horizontal] = widgetSettings.position.split('-');
        chatContainer.style[vertical] = '20px';
        chatContainer.style[horizontal] = '20px';
        document.body.appendChild(chatContainer);

        const { width, height } = widgetSizes[widgetSettings.widget_size] || widgetSizes.medium;

        widgetButton = document.createElement('button');
        widgetButton.style.width = '60px';
        widgetButton.style.height = '60px';
        widgetButton.style.borderRadius = '50%';
        widgetButton.style.backgroundColor = widgetSettings.primary_color;
        widgetButton.style.border = 'none';
        widgetButton.style.cursor = 'pointer';
        widgetButton.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
        widgetButton.style.display = 'flex';
        widgetButton.style.alignItems = 'center';
        widgetButton.style.justifyContent = 'center';
        widgetButton.innerHTML = widgetSettings.agent_avatar_url 
            ? `<img src="${widgetSettings.agent_avatar_url}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">` 
            : '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
        chatContainer.appendChild(widgetButton);

        chatWindow = document.createElement('div');
        chatWindow.style.width = width;
        chatWindow.style.height = height;
        chatWindow.style.backgroundColor = 'white';
        chatWindow.style.borderRadius = `${widgetSettings.border_radius}px`;
        chatWindow.style.fontFamily = widgetSettings.font_family;
        chatWindow.style.boxShadow = '0 10px 25px rgba(0,0,0,0.2)';
        chatWindow.style.display = 'none';
        chatWindow.style.flexDirection = 'column';
        chatWindow.style.overflow = 'hidden';
        chatWindow.style.position = 'absolute';
        chatWindow.style[vertical === 'bottom' ? 'bottom' : 'top'] = '80px';
        chatWindow.style[horizontal === 'right' ? 'right' : 'left'] = '0';

        const headerDisplay = widgetSettings.show_header ? 'flex' : 'none';
        const headerBorderRadius = `${widgetSettings.border_radius}px ${widgetSettings.border_radius}px 0 0`;

        chatWindow.innerHTML = `
            <div class="agent-connect-header" style="background-color:${widgetSettings.primary_color}; color:white; padding:1rem; font-weight:bold; display:${headerDisplay}; justify-content:space-between; align-items:center; border-top-left-radius:${headerBorderRadius}; border-top-right-radius:${headerBorderRadius};">
                <span>${widgetSettings.header_title}</span>
                <button class="agent-connect-close" style="background:none; border:none; color:white; font-size:1.5rem; cursor:pointer; line-height:1;">&times;</button>
            </div>
            <div class="chat-messages" style="flex-grow:1; padding:0.75rem; overflow-y:auto; display:flex; flex-direction:column; gap:0.5rem;"></div>
            <div class="chat-options" style="padding: 0 0.75rem 0.75rem; display: flex; flex-wrap: wrap; gap: 0.5rem;"></div>
            <div style="padding:0.75rem; border-top:1px solid #eee; display:flex; gap:0.5rem;">
                <input type="text" placeholder="${widgetSettings.input_placeholder}" class="chat-input" style="flex-grow:1; padding:0.5rem; border:1px solid #ddd; border-radius:5px;">
                <button class="send-button" style="background-color:${widgetSettings.primary_color}; color:white; border:none; padding:0.5rem 1rem; border-radius:5px; cursor:pointer;">Send</button>
            </div>
        `;
        chatContainer.appendChild(chatWindow);

        chatMessages = chatWindow.querySelector('.chat-messages');
        chatInput = chatWindow.querySelector('.chat-input');
        const sendButton = chatWindow.querySelector('.send-button');
        const closeButton = chatWindow.querySelector('.agent-connect-close');

        widgetButton.onclick = toggleChatWindow;
        closeButton.onclick = toggleChatWindow;
        sendButton.onclick = () => sendMessage(chatInput.value);
        chatInput.onkeypress = (e) => { if (e.key === 'Enter') sendMessage(chatInput.value); };
    }

    function toggleChatWindow() {
        const isHidden = chatWindow.style.display === 'none';
        chatWindow.style.display = isHidden ? 'flex' : 'none';
        widgetButton.style.display = isHidden ? 'none' : 'flex';
        if (isHidden) {
          initWebSocket();
        } else if (ws) {
          ws.close();
          ws = null;
        }
    }

    function initWebSocket() {
        if (ws && ws.readyState === WebSocket.OPEN) return;
        sessionId = generateSessionId();
        ws = new WebSocket(`${wsBackendUrl}/api/v1/ws/public/${companyId}/${agentId}/${sessionId}?user_type=user`);

        ws.onopen = () => {
            if (isProactiveSession) {
                addMessage('Agent', widgetSettings.proactive_message, 'agent');
                isProactiveSession = false; // Reset the flag
            } else if (widgetSettings.welcome_message) {
                addMessage('Agent', widgetSettings.welcome_message, 'agent');
            }
        };
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            // Ignore echoed user messages
            if (data.sender === 'user') {
                return;
            }

            if (data.message_type === 'message') {
                addMessage(data.sender, data.message, data.sender_type || 'agent');
            } else if (data.message_type === 'prompt') {
                addMessage(data.sender, data.message, data.sender_type || 'agent');
                if (data.options && data.options.length > 0) {
                    addOptionsButtons(data.options);
                }
            } else if (data.message_type === 'video_call_invitation') {
                addVideoCallInvitation(data.message);
            }
        };
        ws.onerror = (error) => console.error('AgentConnect: WebSocket error:', error);
    }

    function addMessage(senderName, messageText, senderType) {
        const msgDiv = document.createElement('div');
        const isUser = senderType === 'user';
        
        msgDiv.style.display = 'flex';
        msgDiv.style.justifyContent = isUser ? 'flex-end' : 'flex-start';
        msgDiv.style.width = '100%';
        msgDiv.style.marginBottom = '8px';

        const bubble = document.createElement('div');
        bubble.style.maxWidth = '80%';
        bubble.style.padding = '10px 14px';
        bubble.style.wordWrap = 'break-word';
        bubble.style.backgroundColor = isUser ? widgetSettings.user_message_color : widgetSettings.bot_message_color;
        bubble.style.color = isUser ? widgetSettings.user_message_text_color : widgetSettings.bot_message_text_color;
        
        bubble.style.borderRadius = '18px';
        if (isUser) {
            bubble.style.borderBottomRightRadius = '4px';
        } else {
            bubble.style.borderBottomLeftRadius = '4px';
        }
        
        bubble.textContent = messageText;

        msgDiv.appendChild(bubble);
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function addOptionsButtons(options) {
        const optionsContainer = chatWindow.querySelector('.chat-options');
        optionsContainer.innerHTML = ''; // Clear previous options

        options.forEach(optionText => {
            const button = document.createElement('button');
            button.textContent = optionText;
            button.style.backgroundColor = 'transparent';
            button.style.color = widgetSettings.primary_color;
            button.style.border = `1px solid ${widgetSettings.primary_color}`;
            button.style.padding = '8px 12px';
            button.style.borderRadius = '20px';
            button.style.cursor = 'pointer';
            button.style.transition = 'background-color 0.2s, color 0.2s';
            
            button.onmouseover = () => {
                button.style.backgroundColor = widgetSettings.primary_color;
                button.style.color = 'white';
            };
            button.onmouseout = () => {
                button.style.backgroundColor = 'transparent';
                button.style.color = widgetSettings.primary_color;
            };

            button.onclick = () => {
                sendMessage(optionText);
            };
            optionsContainer.appendChild(button);
        });
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function addVideoCallInvitation(messageText) {
        const msgDiv = document.createElement('div');
        msgDiv.style.alignSelf = 'center';
        msgDiv.style.textAlign = 'center';
        msgDiv.style.margin = '10px 0';

        const bubble = document.createElement('div');
        bubble.style.maxWidth = '85%';
        bubble.style.padding = '12px';
        bubble.style.borderRadius = '12px';
        bubble.style.backgroundColor = '#f0f0f0';
        bubble.style.border = '1px solid #ddd';

        const message = document.createElement('p');
        message.textContent = messageText;
        message.style.margin = '0 0 10px 0';

        const joinButton = document.createElement('button');
        joinButton.textContent = 'Join Video Call';
        joinButton.style.backgroundColor = widgetSettings.primary_color;
        joinButton.style.color = 'white';
        joinButton.style.border = 'none';
        joinButton.style.padding = '10px 15px';
        joinButton.style.borderRadius = '8px';
        joinButton.style.cursor = 'pointer';

        joinButton.onclick = () => {
            fetch(`${httpBackendUrl}/api/v1/calls/token?session_id=${sessionId}&user_id=${sessionId}`)
                .then(res => res.json())
                .then(data => {
                    const livekitURL = widgetSettings.livekit_url;
                    const videoCallPageURL = `${widgetSettings.frontend_url}/video-call?token=${data.token}&livekitUrl=${encodeURIComponent(livekitURL)}&sessionId=${sessionId}`;
                    window.open(videoCallPageURL, '_blank', 'width=800,height=600');
                })
                .catch(err => {
                    console.error('Failed to get join token', err);
                    alert('Failed to start video call. Please try again.');
                });
        };

        bubble.appendChild(message);
        bubble.appendChild(joinButton);
        msgDiv.appendChild(bubble);
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function sendMessage(messageText) {
        const message = messageText.trim();
        if (message) {
            addMessage('user', message, 'user'); // Optimistically add message to UI
            
            // Clear any existing option buttons
            const optionsContainer = chatWindow.querySelector('.chat-options');
            optionsContainer.innerHTML = '';

            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ message, message_type: 'message', sender: 'user' }));
            }
            chatInput.value = '';
        }
    }

    fetchAndApplySettings();
})();
