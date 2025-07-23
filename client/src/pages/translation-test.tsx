import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Languages, Globe, Loader2, TestTube } from "lucide-react";

export default function TranslationTest() {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [testText, setTestText] = useState("Mohamed Salah is a dynamic right winger who combines exceptional pace with excellent technical ability.");
  const { toast } = useToast();

  // Fetch supported languages with proper error handling
  const { data: languagesData, isLoading: languagesLoading, error: languagesError } = useQuery({
    queryKey: ['/api/translation/languages'],
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 3
  });

  // Fallback languages for testing
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

  const handleTest = async () => {
    if (!selectedLanguage) {
      toast({
        title: "Language Required",
        description: "Please select a target language",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await apiRequest('POST', '/api/translation/translate', {
        text: testText,
        targetLanguage: selectedLanguage,
        context: 'player_bio'
      });
      
      const result = await response.json();
      
      toast({
        title: "Translation Test Complete",
        description: `Translation successful with ${Math.round(result.translation.confidence * 100)}% confidence`,
      });
      
    } catch (error: any) {
      toast({
        title: "Translation Test Failed",
        description: error?.message || "Translation failed",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Translation System Test</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Test the language dropdown functionality and translation system
        </p>
      </div>

      <div className="grid gap-6">
        {/* Language Dropdown Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Language Dropdown Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <h4 className="font-medium">API Status</h4>
                {languagesLoading ? (
                  <Badge variant="secondary">
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    Loading
                  </Badge>
                ) : languagesError ? (
                  <Badge variant="destructive">API Error</Badge>
                ) : (
                  <Badge variant="default">Connected</Badge>
                )}
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Available Languages</h4>
                <Badge variant="outline">
                  {Object.keys(availableLanguages).length} languages
                </Badge>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Data Source</h4>
                <Badge variant={languagesData?.languages ? "default" : "secondary"}>
                  {languagesData?.languages ? "Live API" : "Fallback"}
                </Badge>
              </div>
            </div>

            {/* Show error details if any */}
            {languagesError && (
              <div className="p-3 bg-red-50 dark:bg-red-950 rounded-md">
                <p className="text-sm text-red-700 dark:text-red-300">
                  Error loading languages: {languagesError.message}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Language List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Available Languages
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {Object.entries(availableLanguages).map(([code, name]) => (
                <Badge 
                  key={code} 
                  variant="outline" 
                  className="justify-start"
                >
                  <span className="font-mono text-xs mr-2">{code}</span>
                  {name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Translation Test */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Languages className="h-5 w-5" />
              Translation Test
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Test Text</label>
              <Textarea
                value={testText}
                onChange={(e) => setTestText(e.target.value)}
                placeholder="Enter text to translate..."
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Target Language</label>
              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder={languagesLoading ? "Loading languages..." : "Select a language"} />
                </SelectTrigger>
                <SelectContent>
                  {languagesLoading ? (
                    <div className="flex items-center justify-center py-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span className="ml-2 text-sm">Loading languages...</span>
                    </div>
                  ) : languagesError ? (
                    <div className="px-2 py-1 text-sm text-red-600">
                      Failed to load languages - using fallback
                    </div>
                  ) : null}
                  
                  {Object.entries(availableLanguages).map(([code, name]) => (
                    <SelectItem key={code} value={code}>
                      <span className="flex items-center gap-2">
                        <span className="font-mono text-xs">{code}</span>
                        {name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleTest} 
              disabled={!selectedLanguage || !testText.trim() || languagesLoading}
              className="w-full"
            >
              {languagesLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <TestTube className="h-4 w-4 mr-2" />
              )}
              Test Translation
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}