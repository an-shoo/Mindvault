import React, { useRef } from 'react';
import { Upload, FileText, Trash2, FileSpreadsheet, FileJson, File as FileIcon } from 'lucide-react';
import { UploadedFile } from '../types';
import { readFileContent, formatFileSize } from '../services/fileParser';

interface FileSidebarProps {
  files: UploadedFile[];
  setFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
}

const FileSidebar: React.FC<FileSidebarProps> = ({ files, setFiles }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles: UploadedFile[] = [];
      const fileList = Array.from(event.target.files);

      for (const file of fileList) {
        try {
          if (!files.some(f => f.name === file.name)) {
            const uploadedFile = await readFileContent(file);
            newFiles.push(uploadedFile);
          }
        } catch (error) {
          console.error(`Error reading file ${file.name}:`, error);
          alert(`Failed to read ${file.name}.`);
        }
      }

      if (newFiles.length > 0) {
        setFiles(prev => [...prev, ...newFiles]);
      }
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const getFileIcon = (type: string, name: string) => {
    const n = name.toLowerCase();
    if (n.endsWith('.csv') || n.endsWith('.xlsx') || n.endsWith('.xls')) return <FileSpreadsheet className="w-4 h-4 text-green-600" />;
    if (n.endsWith('.json')) return <FileJson className="w-4 h-4 text-yellow-600" />;
    if (n.endsWith('.pdf')) return <FileText className="w-4 h-4 text-red-600" />;
    if (n.endsWith('.md') || n.endsWith('.txt')) return <FileText className="w-4 h-4 text-blue-600" />;
    return <FileIcon className="w-4 h-4 text-slate-500" />;
  };

  return (
    <div className="w-80 bg-slate-50 border-r border-slate-200 h-full flex flex-col">
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-2">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Upload className="w-5 h-5 text-white" />
          </div>
          <h1 className="font-bold text-xl text-slate-900 tracking-tight">MindVault</h1>
        </div>
        <p className="text-xs text-slate-500">RAG Knowledge Assistant</p>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Documents</h2>
          <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{files.length}</span>
        </div>

        {files.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50">
            <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">No files uploaded</p>
            <p className="text-xs text-slate-400 mt-1">PDF, Excel, CSV, TXT</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {files.map((file) => (
              <li key={file.id} className="group flex items-center justify-between p-3 bg-white rounded-lg border border-slate-200 shadow-sm hover:border-indigo-300 transition-all">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="p-2 bg-slate-50 rounded-md">
                    {getFileIcon(file.type, file.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate" title={file.name}>{file.name}</p>
                    <div className="flex items-center gap-2">
                         <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
                         {file.isIndexed && <span className="text-[10px] text-green-600 bg-green-50 px-1 rounded">Indexed</span>}
                    </div>
                   
                  </div>
                </div>
                <button 
                  onClick={() => removeFile(file.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
                  title="Remove file"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="p-4 border-t border-slate-200 bg-white">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          accept=".csv,.txt,.md,.json,.pdf,.xlsx,.xls"
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white py-2.5 px-4 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Upload className="w-4 h-4" />
          Add Documents
        </button>
        <p className="text-[10px] text-center text-slate-400 mt-2">
          Supports: PDF, Excel, CSV, TXT, JSON
        </p>
      </div>
    </div>
  );
};

export default FileSidebar;
