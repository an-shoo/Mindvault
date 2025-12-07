import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Loader2, Info, Database } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Message, UploadedFile } from '../types';
import { GeminiService } from '../services/gemini';
import ChartWidget from './ChartWidget';

interface ChatAreaProps {
  files: UploadedFile[];
}

const ChatArea: React.FC<ChatAreaProps> = ({ files }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: 'Hello! I am MindVault. I use RAG to answer questions about your documents (PDF, Excel, CSV, etc.). Upload files to start indexing!',
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);
  const [indexProgress, setIndexProgress] = useState({ current: 0, total: 0 });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Singleton service
  const geminiServiceRef = useRef<GeminiService | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isIndexing]);

  // Handle Indexing when files change
  useEffect(() => {
    const handleIndexing = async () => {
        const unindexed = files.filter(f => !f.isIndexed);
        if (unindexed.length > 0) {
            if (!process.env.API_KEY) return; // Wait for key
            
            if (!geminiServiceRef.current) {
                geminiServiceRef.current = new GeminiService();
            }

            setIsIndexing(true);
            setIndexProgress({ current: 0, total: unindexed.length });

            try {
                await geminiServiceRef.current.indexFiles(files, (current, total) => {
                    setIndexProgress({ current, total });
                });
                // Force update to reflect isIndexed changes in UI if needed, 
                // though files array mutation might not trigger re-render in parent efficiently without setFiles.
                // In a real app, we'd update the parent state. 
                // Here, we trust the object mutation propagates or we ignore pure UI sync for 'Indexed' label for a moment.
            } catch (err) {
                console.error("Indexing failed", err);
            } finally {
                setIsIndexing(false);
            }
        }
    };

    handleIndexing();
  }, [files]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || isIndexing) return;

    if (!process.env.API_KEY) {
        alert("Please set a valid process.env.API_KEY to use this app.");
        return;
    }

    if (!geminiServiceRef.current) {
        geminiServiceRef.current = new GeminiService();
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await geminiServiceRef.current.generateResponse(userMessage.content, files);
      
      const aiMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: response.answer,
        chart: response.chart,
        timestamp: Date.now()
      };
      
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error. Please try again.",
        isError: true,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white relative">
      {/* Header */}
      <div className="h-16 border-b border-slate-200 flex items-center justify-between px-6 bg-white z-10">
        <h2 className="font-semibold text-slate-800">Chat Session</h2>
        <div className="flex items-center gap-2 text-xs text-slate-500">
           {isIndexing ? (
               <span className="flex items-center text-indigo-600 gap-2 bg-indigo-50 px-3 py-1 rounded-full animate-pulse">
                   <Database className="w-3 h-3 animate-bounce" />
                   Indexing... ({indexProgress.current}/{indexProgress.total})
               </span>
           ) : files.length > 0 ? (
               <span className="flex items-center text-green-600 gap-1 bg-green-50 px-2 py-1 rounded-full">
                   <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                   {files.length} documents ready
               </span>
           ) : (
               <span className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-full">
                   <Info className="w-3 h-3" />
                   No documents
               </span>
           )}
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'} max-w-4xl mx-auto`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === 'user' ? 'bg-slate-800 text-white' : 'bg-indigo-600 text-white'
            }`}>
              {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
            </div>

            <div className={`flex-1 max-w-[80%] space-y-2`}>
               <div className={`p-4 rounded-2xl shadow-sm text-sm leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-slate-800 text-white rounded-tr-sm' 
                    : msg.isError 
                        ? 'bg-red-50 text-red-800 border border-red-200 rounded-tl-sm'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'
                }`}>
                  <div className={`prose prose-sm max-w-none prose-p:my-1 prose-pre:bg-slate-900 prose-pre:text-slate-50 ${
                      msg.role === 'user' ? 'prose-invert' : ''
                  }`}>
                    <ReactMarkdown 
                        components={{
                            p: ({node, ...props}) => <p {...props} className="mb-2 last:mb-0" />,
                            ul: ({node, ...props}) => <ul {...props} className="list-disc list-inside space-y-1 mb-2" />,
                            ol: ({node, ...props}) => <ol {...props} className="list-decimal list-inside space-y-1 mb-2" />,
                        }}
                    >
                        {msg.content}
                    </ReactMarkdown>
                  </div>
               </div>

               {msg.chart && (
                   <ChartWidget config={msg.chart} />
               )}
            </div>
          </div>
        ))}
        
        {/* Loading Indicators */}
        {isIndexing && (
            <div className="flex gap-4 max-w-4xl mx-auto">
               <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                   <Database className="w-4 h-4 text-slate-500" />
               </div>
               <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 border border-slate-100 p-3 rounded-2xl rounded-tl-sm">
                   <Loader2 className="w-3 h-3 animate-spin" />
                   <span>Processing and embedding new documents...</span>
               </div>
            </div>
        )}
        
        {isLoading && (
           <div className="flex gap-4 max-w-4xl mx-auto">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5" />
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500 bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-sm shadow-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                  <span>Searching knowledge base & generating answer...</span>
              </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-slate-200">
        <div className="max-w-4xl mx-auto relative">
          <form onSubmit={handleSubmit} className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isIndexing ? "Indexing documents, please wait..." : "Ask about your data..."}
              className="w-full pl-4 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm shadow-sm transition-all"
              disabled={isLoading || isIndexing}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading || isIndexing}
              className="absolute right-2 top-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
          <p className="text-center text-[10px] text-slate-400 mt-2">
            AI can make mistakes. Verify important info.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;