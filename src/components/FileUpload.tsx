import React, { useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Paperclip, X, FileIcon, Image as ImageIcon, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  onFileRemove?: (index: number) => void;
  selectedFiles?: File[];
  maxSize?: number; // in MB
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  isUploading?: boolean;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  onFileRemove,
  selectedFiles = [],
  maxSize = 50,
  accept = 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.zip,.rar',
  multiple = true,
  disabled = false,
  isUploading = false,
}) => {
  const { toast } = useToast();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const validateFiles = (files: File[]): File[] => {
    const validFiles: File[] = [];
    const maxSizeBytes = maxSize * 1024 * 1024;

    for (const file of files) {
      if (file.size > maxSizeBytes) {
        toast({
          title: 'File too large',
          description: `${file.name} exceeds ${maxSize}MB limit`,
          variant: 'destructive',
        });
        continue;
      }
      validFiles.push(file);
    }

    return validFiles;
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const validFiles = validateFiles(fileArray);

    if (validFiles.length > 0) {
      onFileSelect(validFiles);
    }
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragging(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    handleFiles(files);
  }, [disabled]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="h-4 w-4" />;
    } else if (file.type.includes('pdf')) {
      return <FileText className="h-4 w-4" />;
    }
    return <FileIcon className="h-4 w-4" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Drag and drop zone */}
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative rounded-lg transition-colors',
          isDragging && 'ring-2 ring-primary bg-primary/5',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center bg-primary/10 rounded-lg z-10">
            <p className="text-primary font-medium text-xs">Drop files here</p>
          </div>
        )}

        {/* Upload button */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={handleButtonClick}
          disabled={disabled || isUploading}
          className="relative h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Paperclip className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Selected files preview */}
      {selectedFiles.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedFiles.map((file, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700"
            >
              <div className="text-slate-600 dark:text-slate-400">
                {getFileIcon(file)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                  {file.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {formatFileSize(file.size)}
                </p>
              </div>
              {onFileRemove && !isUploading && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => onFileRemove(index)}
                  className="h-6 w-6 hover:bg-red-100 dark:hover:bg-red-900/20"
                >
                  <X className="h-3 w-3 text-red-600 dark:text-red-400" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
