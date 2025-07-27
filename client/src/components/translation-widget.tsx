import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Languages, Copy, Check, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TranslationWidgetProps {
  text: string;
  context?: 'player_bio' | 'scouting_report' | 'club_description' | 'general';
  className?: string;
  showLanguageSelector?: boolean;
  compactMode?: boolean;
}

interface SupportedLanguages {
  [key: string]: string;
}

interface TranslationResponse {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
  footballTermsUsed: string[];
}

export function TranslationWidget({ 
  text, 
  context = 'general', 
  className = "",
  showLanguageSelector = true,
  compactMode = false
}: TranslationWidgetProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});
  const { toast } = useToast();

  // Fetch supported languages
  const { data: languagesData, isLoading: languagesLoading, error: languagesError } = useQuery({
    queryKey: ['/api/translation/languages'],
    enabled: showLanguageSelector,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3,
    onError: (error: any) => {
      console.warn('Failed to load languages from API, using fallback:', error?.message);
    }
  });

  // Fallback languages list if API fails
  const FALLBACK_LANGUAGES = {
    'fr': 'French',
    'de': 'German', 
    'it': 'Italian',
    'pt': 'Portuguese',
    'es': 'Spanish',
    'ar': 'Arabic',
    'sw': 'Swahili',
    'ha': 'Hausa',
    'yo': 'Yoruba',
    'am': 'Amharic',
    'zu': 'Zulu'
  };

  // Get available languages (from API or fallback)
  const availableLanguages = languagesData?.languages || FALLBACK_LANGUAGES;

  // Translation mutation
  const translateMutation = useMutation({
    mutationFn: async ({ targetLanguage }: { targetLanguage: string }) => {
      const response = await apiRequest('POST', '/api/translation/translate', {
        text,
        targetLanguage,
        context
      });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Translation Complete",
        description: `Translated to ${data.translation.targetLanguage} with ${Math.round(data.translation.confidence * 100)}% confidence`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Translation Failed",
        description: error?.message || "Unable to translate text",
        variant: "destructive",
      });
    }
  });

  const handleTranslate = () => {
    if (!selectedLanguage) {
      toast({
        title: "Language Required",
        description: "Please select a target language for translation",
        variant: "destructive",
      });
      return;
    }
    translateMutation.mutate({ targetLanguage: selectedLanguage });
  };

  const copyToClipboard = async (textToCopy: string, key: string) => {
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedStates(prev => ({ ...prev, [key]: true }));
      toast({
        title: "Copied to Clipboard",
        description: "Text has been copied to your clipboard",
      });
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [key]: false }));
      }, 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy text to clipboard",
        variant: "destructive",
      });
    }
  };

  if (compactMode) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {showLanguageSelector && (
          <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Language" />
            </SelectTrigger>
            <SelectContent>
              {languagesLoading ? (
                <div className="flex items-center justify-center py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2 text-sm">Loading...</span>
                </div>
              ) : languagesError ? (
                <>
                  <div className="px-2 py-1 text-sm text-amber-600 border-b">
                    Using offline languages
                  </div>
                  {Object.entries(availableLanguages).map(([code, name]) => (
                    <SelectItem key={code} value={code}>
                      {name}
                    </SelectItem>
                  ))}
                </>
              ) : (
                Object.entries(availableLanguages).map(([code, name]) => (
                  <SelectItem key={code} value={code}>
                    {name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        )}
        
        <Button 
          size="sm" 
          variant="outline"
          onClick={handleTranslate}
          disabled={translateMutation.isPending || !selectedLanguage}
        >
          {translateMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Languages className="h-4 w-4" />
          )}
        </Button>
      </div>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Languages className="h-5 w-5" />
          Instant Translation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Original Text */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Original Text</h4>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => copyToClipboard(text, 'original')}
            >
              {copiedStates['original'] ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md text-sm">
            {text}
          </div>
        </div>

        {/* Language Selection */}
        {showLanguageSelector && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Translate to:</h4>
            <div className="flex gap-2">
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Select target language" />
                </SelectTrigger>
                <SelectContent>
                  {languagesLoading ? (
                    <div className="flex items-center justify-center py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="ml-2 text-sm">Loading languages...</span>
                    </div>
                  ) : languagesError ? (
                    <>
                      <div className="px-2 py-1 text-sm text-amber-600 border-b">
                        Using offline languages (API unavailable)
                      </div>
                      {Object.entries(availableLanguages).map(([code, name]) => (
                        <SelectItem key={code} value={code}>
                          {name}
                        </SelectItem>
                      ))}
                    </>
                  ) : (
                    Object.entries(availableLanguages).map(([code, name]) => (
                      <SelectItem key={code} value={code}>
                        {name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              
              <Button 
                onClick={handleTranslate}
                disabled={translateMutation.isPending || !selectedLanguage || languagesLoading}
              >
                {translateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Languages className="h-4 w-4 mr-2" />
                )}
                Translate
              </Button>
            </div>
          </div>
        )}

        {/* Translation Result */}
        {translateMutation.data && (
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium">Translation</h4>
                <Badge variant="secondary" className="text-xs">
                  {translateMutation.data.translation.targetLanguage}
                </Badge>
                {translateMutation.data.translation.confidence && (
                  <Badge 
                    variant={translateMutation.data.translation.confidence > 0.8 ? "default" : "outline"}
                    className="text-xs"
                  >
                    {Math.round(translateMutation.data.translation.confidence * 100)}% confident
                  </Badge>
                )}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(translateMutation.data.translation.translatedText, 'translation')}
              >
                {copiedStates['translation'] ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-md border border-blue-200 dark:border-blue-800">
              <p className="text-sm">{translateMutation.data.translation.translatedText}</p>
            </div>

            {/* Football Terms Used */}
            {translateMutation.data.translation.footballTermsUsed && 
             translateMutation.data.translation.footballTermsUsed.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  Football terms preserved:
                </h5>
                <div className="flex flex-wrap gap-1">
                  {translateMutation.data.translation.footballTermsUsed.map((term: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {term}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Source Language Detection */}
            {translateMutation.data.translation.sourceLanguage && (
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Detected source language: {translateMutation.data.translation.sourceLanguage}
              </div>
            )}
          </div>
        )}

        {/* Error State */}
        {translateMutation.isError && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950 rounded-md border border-red-200 dark:border-red-800">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <p className="text-sm text-red-700 dark:text-red-300">
              Translation failed. Please try again or contact support.
            </p>
          </div>
        )}

        {/* Context Info */}
        <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t">
          Translation optimized for: {context.replace('_', ' ')} content
        </div>
      </CardContent>
    </Card>
  );
}