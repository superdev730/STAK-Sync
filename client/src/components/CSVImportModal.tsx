import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, CheckCircle, AlertCircle, Clock, Users } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface CSVImportModalProps {
  eventId: string;
  children: React.ReactNode;
}

interface ImportStatus {
  id: string;
  fileName: string;
  status: 'processing' | 'completed' | 'failed';
  totalRows: number;
  successfulImports: number;
  failedImports: number;
  errorLog?: string;
  createdAt: string;
  completedAt?: string;
}

export function CSVImportModal({ eventId, children }: CSVImportModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch import history
  const { data: imports = [] } = useQuery({
    queryKey: [`/api/events/${eventId}/imports`],
    enabled: isOpen,
  });

  // CSV Import mutation
  const importMutation = useMutation({
    mutationFn: async ({ csvContent, fileName }: { csvContent: string; fileName: string }) => {
      return await apiRequest(`/api/events/${eventId}/import-csv`, 'POST', { csvContent, fileName });
    },
    onSuccess: (data: any) => {
      toast({
        title: "Import Started",
        description: `Successfully started importing ${data.totalRows} attendees from ${fileName}`,
      });
      setCsvContent('');
      setFileName('');
      queryClient.invalidateQueries({ queryKey: [`/api/events/${eventId}/imports`] });
    },
    onError: (error: any) => {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to start CSV import",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCsvContent(e.target?.result as string);
        setFileName(file.name);
      };
      reader.readAsText(file);
    } else {
      toast({
        title: "Invalid File",
        description: "Please upload a CSV file",
        variant: "destructive",
      });
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'text/csv') {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCsvContent(e.target?.result as string);
        setFileName(file.name);
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = () => {
    if (!csvContent || !fileName) {
      toast({
        title: "Missing Information",
        description: "Please upload a CSV file first",
        variant: "destructive",
      });
      return;
    }
    importMutation.mutate({ csvContent, fileName });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variant = status === 'completed' ? 'default' : status === 'failed' ? 'destructive' : 'secondary';
    return <Badge variant={variant}>{status}</Badge>;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl bg-black border-gray-700">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <Upload className="h-5 w-5 text-copper" />
            Import Event Attendees
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* CSV Upload Section */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="csv-file" className="text-white">Upload CSV File</Label>
              <p className="text-sm text-gray-400 mb-2">
                Import attendees from Luma, Eventbrite, or other platforms. Expected columns: email, firstName, lastName, title, company, bio, interests, goals
              </p>
              
              <div 
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive 
                    ? 'border-copper bg-copper/10' 
                    : csvContent 
                      ? 'border-green-500 bg-green-500/10' 
                      : 'border-gray-600 hover:border-gray-500'
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
              >
                {csvContent ? (
                  <div className="space-y-2">
                    <FileText className="h-12 w-12 text-green-500 mx-auto" />
                    <p className="text-white font-medium">{fileName}</p>
                    <p className="text-sm text-gray-400">
                      {csvContent.split('\n').length - 1} rows detected
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto" />
                    <p className="text-white">Drop your CSV file here or click to browse</p>
                    <p className="text-sm text-gray-400">Supports Luma and Eventbrite exports</p>
                  </div>
                )}
                
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => document.getElementById('csv-file')?.click()}
                >
                  Choose File
                </Button>
              </div>
            </div>

            {/* Manual CSV Input */}
            <div>
              <Label htmlFor="csv-text" className="text-white">Or Paste CSV Content</Label>
              <Textarea
                id="csv-text"
                placeholder="email,firstName,lastName,title,company,bio,interests,goals&#10;john@example.com,John,Doe,CEO,Acme Inc,Experienced entrepreneur,AI;Tech,Funding;Partnerships"
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                className="min-h-[120px] bg-gray-900 border-gray-700 text-white"
              />
            </div>

            {csvContent && (
              <Alert className="border-yellow-500/50 bg-yellow-500/10">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
                <AlertDescription className="text-yellow-200">
                  Preview: {csvContent.split('\n').length - 1} attendees will be imported. 
                  Existing users will be updated with new information.
                </AlertDescription>
              </Alert>
            )}

            <Button 
              onClick={handleSubmit}
              disabled={!csvContent || importMutation.isPending}
              className="w-full bg-copper hover:bg-copper/80"
            >
              {importMutation.isPending ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Processing Import...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Attendees
                </>
              )}
            </Button>
          </div>

          {/* Import History */}
          {Array.isArray(imports) && imports.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-copper" />
                Import History
              </h3>
              
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {(imports as ImportStatus[]).map((importItem: ImportStatus) => (
                  <div 
                    key={importItem.id}
                    className="bg-gray-900 rounded-lg p-4 border border-gray-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(importItem.status)}
                        <span className="text-white font-medium">{importItem.fileName}</span>
                        {getStatusBadge(importItem.status)}
                      </div>
                      <span className="text-sm text-gray-400">
                        {new Date(importItem.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span>Total: {importItem.totalRows}</span>
                      {importItem.status === 'completed' && (
                        <>
                          <span className="text-green-400">
                            Success: {importItem.successfulImports}
                          </span>
                          {importItem.failedImports > 0 && (
                            <span className="text-red-400">
                              Failed: {importItem.failedImports}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    
                    {importItem.status === 'processing' && (
                      <Progress 
                        value={75} 
                        className="mt-2 h-2"
                      />
                    )}
                    
                    {importItem.errorLog && (
                      <Alert className="mt-2 border-red-500/50 bg-red-500/10">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <AlertDescription className="text-red-200 text-xs">
                          {importItem.errorLog.split('\n').slice(0, 3).join('\n')}
                          {importItem.errorLog.split('\n').length > 3 && '\n...'}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}