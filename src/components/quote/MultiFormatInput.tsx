'use client';

import { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Camera,
  FileText,
  Type,
  Upload,
  X,
  Check,
  Loader2,
  AlertCircle,
  RefreshCw,
  Eye,
  ChevronRight
} from 'lucide-react';

interface InputSource {
  id: string;
  type: 'photo' | 'file' | 'text';
  originalFile?: File;
  fileName?: string;
  extractedText: string;
  verified: boolean;
  preview?: string; // For photo preview (data URL)
  isProcessing?: boolean;
  error?: string;
}

interface MultiFormatInputProps {
  onTextReady: (combinedText: string) => void;
  onAnalyze: (text: string) => void;
  isAnalyzing?: boolean;
}

export default function MultiFormatInput({
  onTextReady,
  onAnalyze,
  isAnalyzing = false
}: MultiFormatInputProps) {
  const [sources, setSources] = useState<InputSource[]>([]);
  const [directText, setDirectText] = useState('');
  const [activeTab, setActiveTab] = useState<'photo' | 'file' | 'text'>('text');
  const [showVerification, setShowVerification] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Get combined text from all verified sources + direct text
  const getCombinedText = useCallback(() => {
    const verifiedTexts = sources
      .filter(s => s.verified && s.extractedText.trim())
      .map(s => s.extractedText.trim());

    if (directText.trim()) {
      verifiedTexts.push(directText.trim());
    }

    return verifiedTexts.join('\n\n---\n\n');
  }, [sources, directText]);

  // Handle photo upload
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) {
        continue;
      }

      const sourceId = crypto.randomUUID();

      // Create preview
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;

        // Add source with processing state
        setSources(prev => [...prev, {
          id: sourceId,
          type: 'photo',
          originalFile: file,
          fileName: file.name,
          extractedText: '',
          verified: false,
          preview: dataUrl,
          isProcessing: true
        }]);

        // Call OCR API
        try {
          const response = await fetch('/api/admin/ocr', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image: dataUrl,
              media_type: file.type
            })
          });

          if (response.ok) {
            const data = await response.json();
            setSources(prev => prev.map(s =>
              s.id === sourceId
                ? { ...s, extractedText: data.text, isProcessing: false }
                : s
            ));
          } else {
            const error = await response.json();
            setSources(prev => prev.map(s =>
              s.id === sourceId
                ? { ...s, isProcessing: false, error: error.error || 'OCR mislukt' }
                : s
            ));
          }
        } catch {
          setSources(prev => prev.map(s =>
            s.id === sourceId
              ? { ...s, isProcessing: false, error: 'Kon foto niet verwerken' }
              : s
          ));
        }
      };
      reader.readAsDataURL(file);
    }

    // Reset input
    if (photoInputRef.current) {
      photoInputRef.current.value = '';
    }
  };

  // Handle file upload (PDF, DOCX, TXT)
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    for (const file of Array.from(files)) {
      const sourceId = crypto.randomUUID();
      const fileName = file.name.toLowerCase();

      // Validate file type
      if (!fileName.endsWith('.pdf') && !fileName.endsWith('.docx') && !fileName.endsWith('.txt')) {
        continue;
      }

      // Add source with processing state
      setSources(prev => [...prev, {
        id: sourceId,
        type: 'file',
        originalFile: file,
        fileName: file.name,
        extractedText: '',
        verified: false,
        isProcessing: true
      }]);

      // Call extract-text API
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/admin/extract-text', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const data = await response.json();
          setSources(prev => prev.map(s =>
            s.id === sourceId
              ? { ...s, extractedText: data.text, isProcessing: false }
              : s
          ));
        } else {
          const error = await response.json();
          setSources(prev => prev.map(s =>
            s.id === sourceId
              ? { ...s, isProcessing: false, error: error.error || 'Extractie mislukt' }
              : s
          ));
        }
      } catch {
        setSources(prev => prev.map(s =>
          s.id === sourceId
            ? { ...s, isProcessing: false, error: 'Kon bestand niet verwerken' }
            : s
        ));
      }
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Update extracted text for a source
  const updateSourceText = (sourceId: string, text: string) => {
    setSources(prev => prev.map(s =>
      s.id === sourceId ? { ...s, extractedText: text } : s
    ));
  };

  // Toggle source verification
  const toggleVerified = (sourceId: string) => {
    setSources(prev => prev.map(s =>
      s.id === sourceId ? { ...s, verified: !s.verified } : s
    ));
  };

  // Remove a source
  const removeSource = (sourceId: string) => {
    setSources(prev => prev.filter(s => s.id !== sourceId));
  };

  // Retry OCR for a photo
  const retryOcr = async (sourceId: string) => {
    const source = sources.find(s => s.id === sourceId);
    if (!source || source.type !== 'photo' || !source.preview) return;

    setSources(prev => prev.map(s =>
      s.id === sourceId ? { ...s, isProcessing: true, error: undefined } : s
    ));

    try {
      const response = await fetch('/api/admin/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: source.preview,
          media_type: source.originalFile?.type || 'image/jpeg'
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSources(prev => prev.map(s =>
          s.id === sourceId
            ? { ...s, extractedText: data.text, isProcessing: false }
            : s
        ));
      } else {
        const error = await response.json();
        setSources(prev => prev.map(s =>
          s.id === sourceId
            ? { ...s, isProcessing: false, error: error.error || 'OCR mislukt' }
            : s
        ));
      }
    } catch {
      setSources(prev => prev.map(s =>
        s.id === sourceId
          ? { ...s, isProcessing: false, error: 'Kon foto niet verwerken' }
          : s
      ));
    }
  };

  // Handle drag and drop
  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const files = event.dataTransfer.files;
    if (!files || files.length === 0) return;

    // Create synthetic events for the handlers
    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) {
        // Handle as photo
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        if (photoInputRef.current) {
          photoInputRef.current.files = dataTransfer.files;
          photoInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
        }
      } else {
        // Handle as file
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        if (fileInputRef.current) {
          fileInputRef.current.files = dataTransfer.files;
          fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    }
  }, []);

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  // Check if we have any content
  const hasContent = sources.some(s => s.extractedText.trim()) || directText.trim();
  const hasVerifiedContent = sources.some(s => s.verified && s.extractedText.trim()) || directText.trim();

  // Show verification view
  if (showVerification) {
    const combinedText = getCombinedText();

    return (
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-blue-700">
              <Eye className="w-5 h-5" />
              Controleer Notities
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowVerification(false)}
            >
              <X className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            De volgende tekst wordt geanalyseerd. Pas aan indien nodig.
          </p>

          <Textarea
            value={combinedText}
            onChange={(e) => {
              // If user edits in verification, update direct text
              setDirectText(e.target.value);
              // Clear other sources since we're now using combined
              setSources([]);
            }}
            rows={12}
            className="bg-white font-mono text-sm"
          />

          <div className="text-xs text-gray-500">
            Bronnen: {sources.filter(s => s.verified).length > 0 && (
              <span>
                {sources.filter(s => s.verified).map(s =>
                  s.type === 'photo' ? `📷 ${s.fileName}` : `📄 ${s.fileName}`
                ).join(', ')}
              </span>
            )}
            {sources.filter(s => s.verified).length > 0 && directText.trim() && ', '}
            {directText.trim() && '📝 getypte tekst'}
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowVerification(false)}
              className="flex-1"
            >
              Terug
            </Button>
            <Button
              onClick={() => {
                const text = getCombinedText();
                onTextReady(text);
                onAnalyze(text);
              }}
              disabled={!combinedText.trim() || isAnalyzing}
              className="flex-1 bg-orange-500 hover:bg-orange-600"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyseren...
                </>
              ) : (
                <>
                  Start AI Analyse
                  <ChevronRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="text-orange-700">
          Schouwnotities Invoeren
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tab Buttons */}
        <div className="flex gap-2 border-b border-orange-200 pb-2">
          <button
            onClick={() => setActiveTab('text')}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              activeTab === 'text'
                ? 'bg-white text-orange-600 border border-b-0 border-orange-200'
                : 'text-gray-500 hover:text-orange-600'
            }`}
          >
            <Type className="w-4 h-4" />
            Tekst
          </button>
          <button
            onClick={() => setActiveTab('photo')}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              activeTab === 'photo'
                ? 'bg-white text-orange-600 border border-b-0 border-orange-200'
                : 'text-gray-500 hover:text-orange-600'
            }`}
          >
            <Camera className="w-4 h-4" />
            Foto
          </button>
          <button
            onClick={() => setActiveTab('file')}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
              activeTab === 'file'
                ? 'bg-white text-orange-600 border border-b-0 border-orange-200'
                : 'text-gray-500 hover:text-orange-600'
            }`}
          >
            <FileText className="w-4 h-4" />
            Bestand
          </button>
        </div>

        {/* Text Input Tab */}
        {activeTab === 'text' && (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">
              Typ of plak je schouwnotities hieronder.
            </p>
            <Textarea
              value={directText}
              onChange={(e) => setDirectText(e.target.value)}
              placeholder="Voorbeeld:
Klant wil nieuwe tuin van 6x8 meter
- Terras van 4x3 meter met keramische tegels
- Gazon voor de rest
- Nieuwe schutting aan linkerkant, 8 meter
- 2 fruitbomen planten"
              rows={8}
              className="bg-white"
            />
          </div>
        )}

        {/* Photo Upload Tab */}
        {activeTab === 'photo' && (
          <div
            className="space-y-4"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <div className="border-2 border-dashed border-orange-300 rounded-lg p-8 text-center bg-white hover:border-orange-400 transition-colors">
              <Camera className="w-12 h-12 mx-auto text-orange-400 mb-4" />
              <p className="text-sm text-gray-600 mb-2">
                Upload een foto van je handgeschreven notities
              </p>
              <p className="text-xs text-gray-400 mb-4">
                JPG, PNG, GIF, WebP - max 5MB
              </p>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
                id="photo-upload"
              />
              <label htmlFor="photo-upload">
                <Button
                  type="button"
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() => photoInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Kies foto
                </Button>
              </label>
            </div>
          </div>
        )}

        {/* File Upload Tab */}
        {activeTab === 'file' && (
          <div
            className="space-y-4"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            <div className="border-2 border-dashed border-orange-300 rounded-lg p-8 text-center bg-white hover:border-orange-400 transition-colors">
              <FileText className="w-12 h-12 mx-auto text-orange-400 mb-4" />
              <p className="text-sm text-gray-600 mb-2">
                Upload een document met je notities
              </p>
              <p className="text-xs text-gray-400 mb-4">
                PDF, Word (.docx), of tekst (.txt)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button
                  type="button"
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Kies bestand
                </Button>
              </label>
            </div>
          </div>
        )}

        {/* Uploaded Sources */}
        {sources.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Geüploade bronnen:</h4>
            {sources.map((source) => (
              <div
                key={source.id}
                className="bg-white rounded-lg border p-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {source.type === 'photo' ? (
                      <Camera className="w-4 h-4 text-blue-500" />
                    ) : (
                      <FileText className="w-4 h-4 text-green-500" />
                    )}
                    <span className="text-sm font-medium">{source.fileName}</span>
                    {source.isProcessing && (
                      <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                    )}
                    {source.error && (
                      <span className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {source.error}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {source.type === 'photo' && source.error && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => retryOcr(source.id)}
                      >
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    )}
                    {!source.isProcessing && source.extractedText && (
                      <Button
                        size="sm"
                        variant={source.verified ? 'default' : 'outline'}
                        onClick={() => toggleVerified(source.id)}
                        className={source.verified ? 'bg-green-500 hover:bg-green-600' : ''}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeSource(source.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Preview for photos */}
                {source.type === 'photo' && source.preview && (
                  <div className="flex gap-3">
                    <img
                      src={source.preview}
                      alt="Preview"
                      className="w-24 h-24 object-cover rounded border"
                    />
                    {source.extractedText && (
                      <Textarea
                        value={source.extractedText}
                        onChange={(e) => updateSourceText(source.id, e.target.value)}
                        rows={4}
                        className="flex-1 text-sm"
                        placeholder="Geëxtraheerde tekst..."
                      />
                    )}
                  </div>
                )}

                {/* Text preview for files */}
                {source.type === 'file' && source.extractedText && (
                  <Textarea
                    value={source.extractedText}
                    onChange={(e) => updateSourceText(source.id, e.target.value)}
                    rows={4}
                    className="text-sm"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t">
          {hasContent && !hasVerifiedContent && sources.length > 0 && (
            <p className="text-sm text-amber-600 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              Vink bronnen aan om ze mee te nemen
            </p>
          )}
          <div className="flex-1" />
          <Button
            onClick={() => setShowVerification(true)}
            disabled={!hasVerifiedContent}
            className="bg-orange-500 hover:bg-orange-600"
          >
            <Eye className="w-4 h-4 mr-2" />
            Controleren & Analyseren
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
