import React, { useState, useRef, useEffect } from 'react';
import { askQuestion } from '../api';
import { ChartRenderer } from './ChartRenderer';
import { Send, Bot, User, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  chart?: any;
}

export const ChatInterface: React.FC = () => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: query };
    setMessages((prev) => [...prev, userMessage]);
    setQuery('');
    setLoading(true);

    try {
      const response = await askQuestion(userMessage.content);
      const botMessage: Message = {
        role: 'assistant',
        content: response.answer,
        sources: response.sources,
        chart: response.chart
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I encountered an error. Please check the backend connection.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <Bot className="w-16 h-16 mb-4 opacity-50" />
            <p className="text-lg">Upload documents and ask questions!</p>
            <p className="text-sm">Try asking: "Show sales by region" for CSV files.</p>
          </div>
        )}
        
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex gap-3 ${
              msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user' ? 'bg-blue-600' : 'bg-green-600'
              }`}
            >
              {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5 text-white" />}
            </div>

            <div className={`flex flex-col max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div
                  className={`p-3 rounded-lg shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-white text-gray-800 rounded-tl-none border border-gray-200'
                  }`}
                >
                  <ReactMarkdown className="prose prose-sm max-w-none dark:prose-invert">
                    {msg.content}
                  </ReactMarkdown>
                </div>

                {msg.chart && (
                    <div className="mt-2 w-full max-w-lg bg-white p-4 rounded-lg shadow border border-gray-200">
                        <ChartRenderer chartData={msg.chart} />
                    </div>
                )}

                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-500">
                    <span className="font-semibold">Sources:</span>
                    {msg.sources.map((src, i) => (
                      <span key={i} className="bg-gray-200 px-2 py-0.5 rounded flex items-center gap-1">
                        <FileText className="w-3 h-3"/> {src}
                      </span>
                    ))}
                  </div>
                )}
            </div>
          </div>
        ))}
        {loading && (
             <div className="flex gap-3">
                 <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0">
                     <Bot className="w-5 h-5 text-white" />
                 </div>
                 <div className="bg-white p-3 rounded-lg rounded-tl-none border border-gray-200 shadow-sm">
                     <div className="flex space-x-2">
                         <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                         <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                         <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                     </div>
                 </div>
             </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-white border-t border-gray-200">
        <form onSubmit={handleSubmit} className="flex gap-2 relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask a question about your documents..."
            className="flex-1 p-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
          <button
            type="submit"
            disabled={!query.trim() || loading}
            className="absolute right-2 top-1.5 p-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

