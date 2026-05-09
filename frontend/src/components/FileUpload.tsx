import { useState, useRef } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import clsx from 'clsx';
import { uploadFiles, UploadResult } from '../services/api';

interface FileUploadProps {
  sessionId: string;
  onUploadComplete: (results: UploadResult[]) => void;
}

interface FileItem {
  file: File;
  status: 'pending' | 'uploading' | 'success' | 'error';
  result?: UploadResult;
}

export default function FileUpload({ sessionId, onUploadComplete }: FileUploadProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = (newFiles: FileList | File[]) => {
    const items: FileItem[] = Array.from(newFiles).map((file) => ({
      file,
      status: 'pending',
    }));
    setFiles((prev) => [...prev, ...items]);
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0 || isUploading) return;

    setIsUploading(true);
    const pendingFiles = files.filter((f) => f.status === 'pending');
    setFiles((prev) =>
      prev.map((f) =>
        f.status === 'pending' ? { ...f, status: 'uploading' } : f,
      ),
    );

    try {
      const results = await uploadFiles(
        pendingFiles.map((f) => f.file),
        sessionId,
      );

      setFiles((prev) =>
        prev.map((f) => {
          if (f.status !== 'uploading') return f;
          const result = results.find((r) => r.filename === f.file.name);
          return {
            ...f,
            status: result?.status === 'success' ? 'success' : 'error',
            result,
          };
        }),
      );

      onUploadComplete(results);
    } catch (err) {
      setFiles((prev) =>
        prev.map((f) =>
          f.status === 'uploading'
            ? { ...f, status: 'error', result: { filename: f.file.name, status: 'error', message: 'Upload failed' } }
            : f,
        ),
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) {
      addFiles(e.dataTransfer.files);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={clsx(
          'border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all',
          isDragging
            ? 'border-tutr-accent bg-tutr-accent/10'
            : 'border-gray-700 hover:border-tutr-accent/50 hover:bg-tutr-surface/50',
        )}
      >
        <Upload className="mx-auto mb-2 text-gray-500" size={24} />
        <p className="text-sm text-gray-400">
          Drop files here or <span className="text-tutr-accent">browse</span>
        </p>
        <p className="text-xs text-gray-600 mt-1">
          PDF, DOCX, PPTX, TXT, code files
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          onChange={(e) => e.target.files && addFiles(e.target.files)}
          className="hidden"
          accept=".pdf,.docx,.pptx,.txt,.md,.py,.js,.ts,.java,.c,.cpp,.h,.csv,.json"
        />
      </div>

      {files.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {files.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-3 glass-light rounded-lg p-2.5"
            >
              <FileText size={16} className="text-tutr-accent flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{item.file.name}</p>
                <p className="text-[10px] text-gray-500">{formatSize(item.file.size)}</p>
              </div>
              {item.status === 'pending' && (
                <button onClick={() => removeFile(i)} className="text-gray-500 hover:text-white">
                  <X size={14} />
                </button>
              )}
              {item.status === 'uploading' && (
                <Loader2 size={14} className="text-tutr-accent animate-spin" />
              )}
              {item.status === 'success' && (
                <CheckCircle size={14} className="text-tutr-success" />
              )}
              {item.status === 'error' && (
                <AlertCircle size={14} className="text-tutr-danger" />
              )}
            </div>
          ))}
        </div>
      )}

      {files.some((f) => f.status === 'pending') && (
        <button
          onClick={handleUpload}
          disabled={isUploading}
          className="w-full py-2.5 bg-tutr-accent hover:bg-tutr-accent/80 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-all"
        >
          {isUploading ? 'Uploading...' : `Upload ${files.filter((f) => f.status === 'pending').length} file(s)`}
        </button>
      )}
    </div>
  );
}
