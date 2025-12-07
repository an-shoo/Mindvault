import React, { useState } from 'react';
import FileSidebar from './components/FileSidebar';
import ChatArea from './components/ChatArea';
import { UploadedFile } from './types';

function App() {
  const [files, setFiles] = useState<UploadedFile[]>([]);

  return (
    <div className="flex h-screen w-full bg-slate-100 overflow-hidden">
      <FileSidebar files={files} setFiles={setFiles} />
      <ChatArea files={files} />
    </div>
  );
}

export default App;
