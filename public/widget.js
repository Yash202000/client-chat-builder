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
        dark_mode: false,
        typing_indicator_enabled: false,
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
            ? `<img src="${httpBackendUrl}/api/v1/proxy/image-proxy?url=${encodeURIComponent(widgetSettings.agent_avatar_url)}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">` 
            : '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>';
        chatContainer.appendChild(widgetButton);

        chatWindow = document.createElement('div');
        chatWindow.style.width = width;
        chatWindow.style.height = height;
        chatWindow.style.backgroundColor = widgetSettings.dark_mode ? '#262626' : 'white';
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
                <div style="display:flex; align-items:center; gap:8px;">
                    <img src="${httpBackendUrl}/api/v1/proxy/image-proxy?url=${encodeURIComponent(widgetSettings.agent_avatar_url)}" style="width:32px; height:32px; border-radius:50%; object-fit:cover;">
                    <span>${widgetSettings.header_title}</span>
                </div>
                <button class="agent-connect-close" style="background:none; border:none; color:white; font-size:1.5rem; cursor:pointer; line-height:1;">&times;</button>
            </div>
            <div class="chat-messages" style="flex-grow:1; padding:0.75rem; overflow-y:auto; display:flex; flex-direction:column; gap:0.5rem;"></div>
            <div class="typing-indicator" style="display:none; padding:0.75rem; font-style:italic; color:#888;">Agent is typing...</div>
            <div class="chat-options" style="padding: 0 0.75rem 0.75rem; display: flex; flex-wrap: wrap; gap: 0.5rem;"></div>
            <div class="chat-form" style="padding: 0 0.75rem 0.75rem;"></div>
            <div class="chat-input-container" style="padding:0.75rem; border-top:1px solid #eee; display:flex; gap:0.5rem;">
                <input type="text" placeholder="${widgetSettings.input_placeholder}" class="chat-input" style="flex-grow:1; padding:0.5rem; border:1px solid #ddd; border-radius:5px;">
                <button class="send-button" style="background-color:${widgetSettings.primary_color}; color:white; border:none; padding:0.5rem 1rem; border-radius:5px; cursor:pointer;">Send</button>
            </div>
        `;
        chatContainer.appendChild(chatWindow);

        chatMessages = chatWindow.querySelector('.chat-messages');
        chatInput = chatWindow.querySelector('.chat-input');
        const sendButton = chatWindow.querySelector('.send-button');
        const closeButton = chatWindow.querySelector('.agent-connect-close');
        const typingIndicator = chatWindow.querySelector('.typing-indicator');

        function showTypingIndicator() {
            if (widgetSettings.typing_indicator_enabled) {
                typingIndicator.style.display = 'block';
                typingIndicator.style.padding = '10px';
                typingIndicator.style.textAlign = 'center';
                typingIndicator.style.color = '#555';
                typingIndicator.textContent = 'Agent is typing...';
                chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to bottom
            }
        }

        function hideTypingIndicator() {
            typingIndicator.style.display = 'none';
            typingIndicator.textContent = '';
        }

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
            } else if (data.message_type === 'form') {
                addMessage(data.sender, data.message, data.sender_type || 'agent');
                renderForm(data.fields);
            } else if (data.message_type === 'typing_on') {
                showTypingIndicator();
            } else if (data.message_type === 'typing_off') {
                hideTypingIndicator();
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
        
        bubble.style.borderRadius = `${widgetSettings.border_radius}px`;
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

    function renderForm(fields) {
        const formContainer = chatWindow.querySelector('.chat-form');
        const inputContainer = chatWindow.querySelector('.chat-input-container');
        const optionsContainer = chatWindow.querySelector('.chat-options');
        
        // Clear previous form/options and hide the regular input
        formContainer.innerHTML = '';
        optionsContainer.innerHTML = '';
        inputContainer.style.display = 'none';

        const form = document.createElement('form');
        
        fields.forEach(field => {
            const fieldDiv = document.createElement('div');
            fieldDiv.style.marginBottom = '10px';

            const label = document.createElement('label');
            label.textContent = field.label;
            label.style.display = 'block';
            label.style.marginBottom = '4px';
            label.style.fontSize = '14px';
            label.style.color = widgetSettings.dark_mode ? '#f0f0f0' : '#333';
            fieldDiv.appendChild(label);

            const input = document.createElement('input');
            input.type = field.type || 'text';
            input.name = field.name;
            input.required = true;
            input.style.width = '100%';
            input.style.padding = '8px';
            input.style.borderRadius = '4px';
            input.style.border = '1px solid #ccc';
            input.style.boxSizing = 'border-box';
            fieldDiv.appendChild(input);

            form.appendChild(fieldDiv);
        });

        const submitButton = document.createElement('button');
        submitButton.type = 'submit';
        submitButton.textContent = 'Submit';
        submitButton.style.width = '100%';
        submitButton.style.padding = '10px';
        submitButton.style.border = 'none';
        submitButton.style.borderRadius = '5px';
        submitButton.style.cursor = 'pointer';
        submitButton.style.backgroundColor = widgetSettings.primary_color;
        submitButton.style.color = 'white';
        form.appendChild(submitButton);

        form.onsubmit = (e) => {
            e.preventDefault();
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            
            // Use a different message text to indicate form submission
            sendMessage(JSON.stringify(data)); 
            
            // Clean up UI
            formContainer.innerHTML = '';
            inputContainer.style.display = 'flex';
        };

        formContainer.appendChild(form);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function sendMessage(messageText) {
        const message = messageText.trim();
        if (message) {
            // Check if the message is a JSON object (from form submission)
            let isFormSubmission = false;
            try {
                const parsed = JSON.parse(message);
                if (typeof parsed === 'object' && parsed !== null) {
                    isFormSubmission = true;
                    addMessage('user', 'Form submitted', 'user');
                }
            } catch (e) {
                // Not a JSON string, treat as regular message
            }

            if (!isFormSubmission) {
                addMessage('user', message, 'user'); // Optimistically add message to UI
            }
            
            // Clear any existing option buttons
            const optionsContainer = chatWindow.querySelector('.chat-options');
            optionsContainer.innerHTML = '';

            if (ws && ws.readyState === WebSocket.OPEN) {
                // The backend expects a JSON object with message and sender
                const payload = {
                    message: isFormSubmission ? JSON.parse(message) : message,
                    message_type: 'message',
                    sender: 'user'
                };
                ws.send(JSON.stringify(payload));
            }
            chatInput.value = '';
        }
    }
    
    fetchAndApplySettings();
})();
