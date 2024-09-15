(function() {
    let currentChatId = null;
    let socket = null;
    let demoLink = null;
    let customerName = null;
    let wsConnected = false;
    // const host = 'versus-ai-o5lra4qdya-uk.a.run.app'
    const host = '0.0.0.0:8000'
    const http_protocol = 'http';
    const style = document.createElement('style');
    const botImg = "https://uxwing.com/wp-content/themes/uxwing/download/communication-chat-call/chatbot-icon.png"
    const userImg = "https://icons.veryicon.com/png/o/internet--web/prejudice/user-128.png"
    style.textContent = `
        /* Chat bubble style */
        .chat-bubble {
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 60px;
            height: 60px;
            background-color: #000000;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
            cursor: pointer;
            z-index: 1000;
            animation: bounce 1.5s infinite;
        }
        /* Chat window style */
        .chat-window {
            display: none;
            position: fixed;
            bottom: 100px;
            right: 20px;
            width: 400px;
            max-height: 550px;
            background-color: white;
            border: 1px solid #ddd;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            border-radius: 10px;
            overflow: hidden;
            z-index: 1000;
        }
        .chat-header {
            background-color: #000000;
            color: white;
            padding: 10px;
            text-align: center;
        }
        .chat-body {
            padding: 10px;
            overflow-y: auto;
            max-height: 400px;
        }
        .chat-footer {
            display: flex;
            align-items: center;
            padding: 10px;
            border-top: 1px solid #ddd;
        }
        .chat-footer input {
            width: calc(100% - 100px);
            padding: 10px;
            margin-right: 10px;
        }
        .chat-footer button {
            margin-left: 20px;
        }
        .message {
            margin: 10px 0;
            font-size: 15px;
        }
        .message.user {
            text-align: right;
        }
        .message.bot {
            text-align: left;
        }
        
        .chat-message-box {
            position: fixed;
            bottom: 90px;
            right: 10px;
            background-color: white;
            padding: 10px 20px;
            border-radius: 10px;
            border: 1px solid #ddd;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            z-index: 1001;
            display: none;
            opacity: 0;
            transition: opacity 0.5s ease-in-out;
        }

        /* Add fade-in effect for the message box */
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
    `;

    style.textContent += `
    .loading {
        background: #f3f3f3;
        background-image: linear-gradient(90deg, #f3f3f3 0%, #e0e0e0 50%, #f3f3f3 100%);
        background-size: 200% 100%;
        animation: loadingAnimation 1s infinite;
        padding: 15px; /* Vertical padding */
        // width: 30%; /* Narrower width */
    }

    @keyframes loadingAnimation {
        0% {
            background-position: 200% 0;
        }
        100% {
            background-position: -200% 0;
        }
    }

    .message.user {
        background-color: #000;
        color: #fff;
        border-radius: 10px;
        padding: 10px;
        margin: 10px 0;
        text-align: right;
        width: fit-content;
        max-width: 70%;
        margin-left: auto;
    }
    .message.bot {
        background-color: #f3f3f3;
        color: #000;
        border-radius: 10px;
        padding: 10px;
        margin: 10px 0;
        text-align: left;
        width: fit-content;
        max-width: 70%;
        margin-right: auto;
    }
`;

style.textContent += `
    .demo-button {
        display: block;
        margin: 10px 0;
        padding: 10px 15px;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        text-align: center;
        font-size: 14px;
    }

    .demo-button:hover {
        background-color: #0056b3;
    }

    .chat-footer button {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0;
    }
    .chat-footer button img {
        width: 24px; /* Adjust size if necessary */
        height: 24px;
    }
    .chat-footer button:hover img {
        filter: brightness(0.8); /* Darken icon on hover */
    }
`;
    document.head.appendChild(style);
    
    if (!currentChatId) {
        initChat();
    }
    
    window.toggleChat = function() {
        hideMessageBox();
        chatBubble.innerHTML = '⬆️'; // Initially an arrow pointing up
        chatBubble.style.transition = 'transform 0.3s ease';
        const chatWindow = document.getElementById('chat-window');
        if (chatWindow.style.display === 'none' || chatWindow.style.display === '') {
            chatWindow.style.display = 'block';
            chatBubble.style.transform = 'rotate(180deg)';
        } else {
            chatBubble.innerHTML = '💬';
            chatBubble.style.transform = 'rotate(0deg)';
            chatWindow.style.display = 'none';
        }
    };

    const messageBox = document.createElement('div');
    messageBox.className = 'chat-message-box';
    messageBox.innerHTML = 'Need help? Chat with us!';
    document.body.appendChild(messageBox);

    const chatBubble = document.createElement('div');
    chatBubble.className = 'chat-bubble';
    chatBubble.innerHTML = '💬';
    chatBubble.onclick = window.toggleChat;
    document.body.appendChild(chatBubble);

    const chatWindow = document.createElement('div');
    chatWindow.className = 'chat-window';
    chatWindow.id = 'chat-window';
    chatWindow.innerHTML = `
        <div class="chat-header">Need help choosing?</div>
        <div class="chat-body" id="chat-body">
            <!-- Chat messages will appear here -->
        </div>
        <div class="chat-footer">
            <input type="text" id="chat-input" placeholder="Type your message!">
            <button id="send-button" onclick="sendMessage()">
                <img src="https://www.svgrepo.com/show/384061/paper-plane-send.svg" alt="Send" width="24" height="24">
            </button>
        </div>
    `;
    document.body.appendChild(chatWindow);

    document.getElementById('chat-input').addEventListener('keydown', function(event) {
        if (event.key === 'Enter') {
            event.preventDefault();  // Prevents the default behavior of the Enter key (e.g., form submission)
            sendMessage();  // Trigger sendMessage when Enter is pressed
        }
    });

    document.getElementById('chat-input').disabled = true;
    document.querySelector('.chat-footer button').disabled = true;
    document.getElementById('chat-input').classList.add('loading');
    document.querySelector('.chat-footer button').classList.add('loading');

    function showMessageBox() {
        messageBox.style.display = 'block';
        setTimeout(() => {
            const chatWindow = document.getElementById('chat-window');
            if (chatWindow.style.display === 'none' || chatWindow.style.display === '') {
                messageBox.style.opacity = 1;
            } else {
            }
            
        }, 100); // Delay to trigger fade-in transition
    
        setTimeout(() => {
            hideMessageBox();
        }, 5000); // Hide after 5 seconds if not clicked
    }

    function hideMessageBox() {
        messageBox.style.opacity = 0;
        setTimeout(() => {
            messageBox.style.display = 'none';
        }, 500); // Give time for fade-out
    }

    setTimeout(() => {
        showMessageBox();
    }, 2000);

    messageBox.onclick = function() {
        window.toggleChat();
        hideMessageBox();
    };

    function showLoading() {
        const chatBody = document.getElementById('chat-body');
        const loadingElement = document.createElement('div');
        loadingElement.className = 'message bot loading';
        loadingElement.innerText = 'Thinking...';

        loadingElement.style.padding = '15px'; // Vertical padding
        loadingElement.style.width = '30%'; // Narrower width
        loadingElement.style.marginRight = 'auto'; // Align to left like bot messages

        chatBody.appendChild(loadingElement);
        chatBody.scrollTop = chatBody.scrollHeight;
    }
    
    // Remove loading animation when response is received
    function hideLoading() {
        const loadingElement = document.querySelector('.message.bot.loading');
        if (loadingElement) {
            loadingElement.remove();
        }
    }

    async function initChat() {
        try {
            const response = await fetch(`${http_protocol}://${host}/api/chats/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: 'New Chat', url: window.location.href })
            });
            const newChat = await response.json();

            currentChatId = newChat.id;
            demoLink = newChat.demo_link;
            customerName = newChat.customer_name;
            setupWebSocket();
        } catch (error) {
            console.error('Error initializing chat:', error);
        }
    }

    function setupWebSocket() {

        socket = new WebSocket(`ws://${host}/ws/chat/${currentChatId}/`);

        socket.onmessage = function(event) {
            const message = JSON.parse(event.data);
            if (message.type === "answer") {
                hideLoading();
                displayMessage(message.message, 'bot');
            }
        };

        socket.onopen = function() {
            wsConnected = true;
            document.getElementById('chat-input').classList.remove('loading');
            document.getElementById('chat-input').disabled = false;
            document.querySelector('.chat-footer button').classList.remove('loading');
            document.querySelector('.chat-footer button').disabled = false;

        };

        socket.onerror = function(error) {
            console.error('WebSocket error:', error);
        };
    }

    async function loadPreviousMessages() {
        try {
            const response = await fetch(`${http_protocol}://${host}/api/chats/${currentChatId}/messages/`);
            const messages = await response.json();
            messages.forEach(msg => {
                displayMessage(msg.content, msg.sender === 'user' ? 'user' : 'bot');
            });
        } catch (error) {
            console.error('Error loading previous messages:', error);
        }
    }
   

    window.sendMessage = function() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        if (message && socket) {
            displayMessage(message, 'user');
            // if (!wsConnected) {
            //     showLoading();
            //     input.value = '';
            // }
            // let counter = 0;
            // while(!wsConnected && counter < 10) {
            //     setTimeout(1000)
            //     counter++;
            // }
            socket.send(JSON.stringify({ message: message, chat_id: currentChatId }));
            showLoading();
            input.value = '';
        }
    };

    function displayMessage(message, sender) {
        const chatBody = document.getElementById('chat-body');
        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}`;

        const messageContainer = document.createElement('div');
        messageContainer.className = 'message-container';
        messageContainer.style.display = 'flex';
        messageContainer.style.alignItems = 'bottom';

        const avatarImg = document.createElement('img');
        avatarImg.className = 'message-avatar';

        if (sender === 'user') {
            avatarImg.src = userImg;
            messageElement.style.backgroundColor = '#000';
            messageElement.style.color = '#fff';
            messageElement.style.borderRadius = '10px';
            messageElement.style.textAlign = 'right';
            messageElement.style.padding = '10px';
            messageElement.style.maxWidth = '70%'; // Max width 70% of the chat window
            messageElement.style.width = 'fit-content'; // Width adjusts to message length
            messageElement.style.marginLeft = 'auto';  // Align to right
        } else {
            avatarImg.src = botImg;
            messageElement.style.backgroundColor = '#f3f3f3';
            messageElement.style.color = '#000';
            messageElement.style.borderRadius = '10px';
            messageElement.style.textAlign = 'left';
            messageElement.style.padding = '10px';
            messageElement.style.maxWidth = '70%'; // Max width 70% of the chat window
            messageElement.style.width = 'fit-content'; // Width adjusts to message length
            messageElement.style.marginRight = 'auto'; // Align to left
        }

        avatarImg.style.width = '40px';
        avatarImg.style.height = '40px';
        avatarImg.style.borderRadius = '50%';
        avatarImg.style.marginRight = '10px';

        messageElement.style.fontFamily = '"Helvetica Neue", Helvetica, Arial, sans-serif';
        if (sender === 'bot' && message.endsWith('<demo>')) {
            message = message.replace('<demo>', '');
            messageElement.innerText = message;

            const demoButton = document.createElement('button');
            demoButton.className = 'demo-button';
            demoButton.innerText = 'Book a Demo';
            demoButton.onclick = () => {
                window.open(demoLink, '_blank');  // Replace with your actual demo link
            };
            messageContainer.appendChild(avatarImg);
            messageContainer.appendChild(messageElement);
            chatBody.appendChild(messageContainer);
            chatBody.appendChild(demoButton);
            chatBody.scrollTop = chatBody.scrollHeight;
        } else {
            messageElement.innerText = message;
            if (sender === 'bot') {
                messageContainer.appendChild(avatarImg);
                messageContainer.appendChild(messageElement);
            } else {
                messageContainer.appendChild(messageElement);
                messageContainer.appendChild(avatarImg);
            }
            
            
            chatBody.appendChild(messageContainer);
            chatBody.scrollTop = chatBody.scrollHeight;
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        // toggleChat(); // Initially hide the chat window
    });
})();
