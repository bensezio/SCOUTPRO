import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { 
  Languages, 
  Copy, 
  Volume2, 
  Loader2, 
  Globe, 
  Star,
  RefreshCw,
  Download
} from "lucide-react";

interface InstantBioTranslatorProps {
  playerName: string;
  originalBio: string;
  context?: string;
  className?: string;
}

interface TranslationResult {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
  footballTermsUsed: string[];
}

// Popular languages for quick access
const POPULAR_LANGUAGES = [
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' }
];

export function InstantBioTranslator({ 
  playerName, 
  originalBio, 
  context = 'player_bio',
  className = "" 
}: InstantBioTranslatorProps) {
  const [translations, setTranslations] = useState<{ [key: string]: TranslationResult }>({});
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>('original');
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({});
  const { toast } = useToast();

  // Fetch supported languages
  const { data: languagesData, isLoading: languagesLoading, error: languagesError } = useQuery({
    queryKey: ['/api/translation/languages'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3
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
        text: originalBio,
        targetLanguage,
        context
      });
      return response.json();
    },
    onSuccess: (data) => {
      const result = data.translation as TranslationResult;
      setTranslations(prev => ({
        ...prev,
        [result.targetLanguage]: result
      }));
      setActiveTab(result.targetLanguage);
      toast({
        title: "Translation Complete",
        description: `Translated to ${result.targetLanguage} with ${Math.round(result.confidence * 100)}% confidence`,
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

  // Quick translate function
  const quickTranslate = (languageCode: string) => {
    if (translations[languageCode]) {
      setActiveTab(languageCode);
      return;
    }
    translateMutation.mutate({ targetLanguage: languageCode });
  };

  // Copy to clipboard
  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedStates(prev => ({ ...prev, [key]: true }));
      toast({
        title: "Copied",
        description: "Text copied to clipboard",
      });
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [key]: false }));
      }, 2000);
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy text",
        variant: "destructive",
      });
    }
  };

  // Get language name from code
  const getLanguageName = (code: string) => {
    const popular = POPULAR_LANGUAGES.find(lang => lang.code === code);
    if (popular) return popular.name;
    
    return availableLanguages[code] || code;
  };

  // Get language flag
  const getLanguageFlag = (code: string) => {
    const popular = POPULAR_LANGUAGES.find(lang => lang.code === code);
    return popular?.flag || '🌐';
  };

  return (
    <Card className={`${className} border-2 border-blue-200 dark:border-blue-800`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Languages className="h-5 w-5 text-blue-600" />
          Instant Translation - {playerName}
        </CardTitle>
        
        {/* Quick Language Buttons */}
        <div className="flex flex-wrap gap-2 mt-3">
          {POPULAR_LANGUAGES.map((lang) => (
            <Button
              key={lang.code}
              variant={translations[lang.code] ? "default" : "outline"}
              size="sm"
              onClick={() => quickTranslate(lang.code)}
              disabled={translateMutation.isPending}
              className="h-8 text-xs"
            >
              {translateMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <>
                  <span className="mr-1">{lang.flag}</span>
                  {lang.name}
                </>
              )}
            </Button>
          ))}
        </div>

        {/* Advanced Language Selector */}
        <div className="flex items-center gap-2 mt-2">
          <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={languagesLoading && !languagesError ? "Loading..." : "Other languages..."} />
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
                      <span className="flex items-center gap-2">
                        {getLanguageFlag(code)} {name}
                      </span>
                    </SelectItem>
                  ))}
                </>
              ) : (
                Object.entries(availableLanguages).map(([code, name]) => (
                  <SelectItem key={code} value={code}>
                    <span className="flex items-center gap-2">
                      {getLanguageFlag(code)} {name}
                    </span>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
          
          <Button 
            onClick={() => selectedLanguage && quickTranslate(selectedLanguage)}
            disabled={!selectedLanguage || translateMutation.isPending || (languagesLoading && !languagesError)}
            size="sm"
          >
            {translateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Translate'
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-auto">
            <TabsTrigger value="original" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Original
            </TabsTrigger>
            
            {Object.keys(translations).map((langCode) => (
              <TabsTrigger key={langCode} value={langCode} className="flex items-center gap-2">
                <span>{getLanguageFlag(langCode)}</span>
                {getLanguageName(langCode)}
                <Badge variant="secondary" className="ml-1 h-4 text-xs">
                  {Math.round(translations[langCode].confidence * 100)}%
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>

          {/* Original Bio */}
          <TabsContent value="original" className="mt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Globe className="h-3 w-3" />
                  Original English
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(originalBio, 'original')}
                >
                  {copiedStates.original ? (
                    <span className="text-green-600">Copied!</span>
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              <Textarea
                value={originalBio}
                readOnly
                className="min-h-[100px] bg-gray-50 dark:bg-gray-900"
              />
            </div>
          </TabsContent>

          {/* Translated Bios */}
          {Object.entries(translations).map(([langCode, translation]) => (
            <TabsContent key={langCode} value={langCode} className="mt-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="default" className="flex items-center gap-1">
                      <span>{getLanguageFlag(langCode)}</span>
                      {getLanguageName(langCode)}
                    </Badge>
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      {Math.round(translation.confidence * 100)}% confidence
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => quickTranslate(langCode)}
                      title="Retranslate"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(translation.translatedText, langCode)}
                    >
                      {copiedStates[langCode] ? (
                        <span className="text-green-600">Copied!</span>
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <Textarea
                  value={translation.translatedText}
                  readOnly
                  className="min-h-[100px] bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"
                />

                {/* Football Terms Used */}
                {translation.footballTermsUsed && translation.footballTermsUsed.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      Football terms preserved:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {translation.footballTermsUsed.map((term, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {term}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* Translation Stats */}
        {Object.keys(translations).length > 0 && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>
                {Object.keys(translations).length} translation{Object.keys(translations).length !== 1 ? 's' : ''} available
              </span>
              <span className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                Powered by AI
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}