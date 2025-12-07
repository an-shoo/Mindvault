import React, { useEffect, useState } from 'react';
import { uploadFiles, getFiles, deleteFile } from '../api';
import { Upload, FileText, CheckCircle, XCircle, Loader2, FileSpreadsheet, Trash2 } from 'lucide-react';

export const FileSidebar: React.FC = () => {
  const [files, setFiles] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<{name: string, status: string}[]>([]);

  const fetchFiles = async () => {
    try {
      const data = await getFiles();
      if (data.files) setFiles(data.files);
    } catch (error) {
      console.error("Failed to fetch files", error);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files) return;
    
    setUploading(true);
    const fileList = Array.from(event.target.files);
    
    try {
      const response = await uploadFiles(fileList);
      setUploadStatus(response.results);
      fetchFiles();
    } catch (error) {
      console.error("Upload failed", error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (filename: string) => {
    if (!window.confirm(`Are you sure you want to delete ${filename}?`)) return;

    setDeleting(filename);
    try {
        await deleteFile(filename);
        await fetchFiles();
    } catch (error) {
        console.error("Delete failed", error);
    } finally {
        setDeleting(null);
    }
  };

  const getIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'csv' || ext === 'xlsx' || ext === 'xls') {
        return <FileSpreadsheet className="w-4 h-4 text-green-400" />;
    }
    return <FileText className="w-4 h-4" />;
  };

  return (
    <div className="w-64 bg-gray-900 text-white h-full flex flex-col p-4 border-r border-gray-700">
      <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
        <span className="text-blue-400">Mind</span>Vault
      </h2>
      
      <div className="mb-6">
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-600 border-dashed rounded-lg cursor-pointer hover:bg-gray-800 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {uploading ? (
                <Loader2 className="w-8 h-8 mb-2 text-gray-400 animate-spin" />
            ) : (
                <Upload className="w-8 h-8 mb-2 text-gray-400" />
            )}
            <p className="mb-2 text-sm text-gray-400"><span className="font-semibold">Click to upload</span></p>
            <p className="text-xs text-gray-500">PDF, Excel, CSV</p>
          </div>
          <input type="file" className="hidden" multiple onChange={handleFileUpload} disabled={uploading} />
        </label>
      </div>

      <div className="flex-1 overflow-y-auto">
        <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">My Documents</h3>
        <ul className="space-y-2">
          {files.map((file, idx) => (
            <li key={idx} className="group flex items-center justify-between gap-2 text-sm text-gray-300 p-2 rounded hover:bg-gray-800">
              <div className="flex items-center gap-2 overflow-hidden">
                  {getIcon(file)}
                  <span className="truncate" title={file}>{file}</span>
              </div>
              <button 
                onClick={() => handleDelete(file)}
                disabled={deleting === file}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-opacity"
                title="Delete file"
              >
                {deleting === file ? <Loader2 className="w-4 h-4 animate-spin"/> : <Trash2 className="w-4 h-4" />}
              </button>
            </li>
          ))}
        </ul>
      </div>

       {uploadStatus.length > 0 && (
        <div className="mt-4 border-t border-gray-700 pt-4">
             <h3 className="text-sm font-semibold text-gray-400 uppercase mb-2">Upload Status</h3>
             <ul className="text-xs space-y-1">
                 {uploadStatus.map((s, i) => (
                     <li key={i} className={`flex items-center gap-1 ${s.status === 'processed' ? 'text-green-400' : 'text-red-400'}`}>
                         {s.status === 'processed' ? <CheckCircle className="w-3 h-3"/> : <XCircle className="w-3 h-3"/>}
                         <span className="truncate w-32">{s.name}</span>
                     </li>
                 ))}
             </ul>
        </div>
       )}
    </div>
  );
};

