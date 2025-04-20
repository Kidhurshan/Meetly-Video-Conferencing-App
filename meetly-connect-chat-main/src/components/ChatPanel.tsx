
import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Message } from '../services/webrtc';
import { formatMessageTime } from '../utils/helpers';

interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  userId: string;
}

const ChatPanel = ({ messages, onSendMessage, userId }: ChatPanelProps) => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSendMessage(message);
      setMessage('');
    }
  };

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b">
        <h3 className="text-lg font-medium">Chat</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg, index) => (
            <div 
              key={index} 
              className={`flex ${msg.sender === userId ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`max-w-[75%] px-4 py-2 rounded-lg ${
                  msg.sender === userId 
                    ? 'bg-meetly-chat text-white' 
                    : 'bg-gray-200 text-gray-900'
                }`}
              >
                {msg.sender !== userId && (
                  <div className="font-medium text-sm mb-1">{msg.senderName}</div>
                )}
                <p>{msg.content}</p>
                <div 
                  className={`text-xs mt-1 ${
                    msg.sender === userId ? 'text-gray-200' : 'text-gray-500'
                  }`}
                >
                  {formatMessageTime(msg.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSubmit} className="border-t p-3 flex">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-4 py-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-meetly-purple"
        />
        <button
          type="submit"
          className="bg-meetly-purple hover:bg-meetly-darkPurple text-white px-4 rounded-r-lg focus:outline-none focus:ring-2 focus:ring-meetly-purple"
          disabled={!message.trim()}
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default ChatPanel;
