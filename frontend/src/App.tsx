import React from 'react';
import { FileSidebar } from './components/FileSidebar';
import { ChatInterface } from './components/ChatInterface';

function App() {
  return (
    <div className="flex h-screen w-full bg-gray-100 overflow-hidden">
      <FileSidebar />
      <main className="flex-1 h-full flex flex-col">
        <header className="bg-white p-4 shadow-sm border-b border-gray-200 z-10">
            <h1 className="text-xl font-bold text-gray-800">Personal Knowledge Assistant</h1>
            <p className="text-sm text-gray-500">Ask questions about your documents or generate charts from data.</p>
        </header>
        <div className="flex-1 overflow-hidden relative">
            <ChatInterface />
        </div>
      </main>
    </div>
  );
}

export default App;

