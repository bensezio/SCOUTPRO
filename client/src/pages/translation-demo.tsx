import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TranslationWidget } from "@/components/translation-widget";
import { Languages, Globe, Users, Trophy } from "lucide-react";

export default function TranslationDemo() {
  const [activeDemo, setActiveDemo] = useState<string>('player_bio');

  const demoTexts = {
    player_bio: `Kwame Asante is a dynamic central midfielder who combines exceptional technical ability with tireless work rate. The 22-year-old Ghanaian international has been instrumental in Asante Kotoko's recent success, showcasing remarkable vision and passing accuracy. Known for his ability to control the tempo of matches and create scoring opportunities, Asante represents the future of African football. His performances in the CAF Champions League have attracted attention from European scouts, with his versatility allowing him to operate effectively in multiple midfield positions.`,
    
    scouting_report: `Technical Assessment: Demonstrates excellent first touch and ball control under pressure. Passing range is exceptional, consistently finding teammates with both short and long distribution. Shooting accuracy from outside the penalty area needs improvement, currently at 23% conversion rate. Tactical Understanding: Shows strong positional awareness and excellent pressing triggers. Good understanding of when to track back defensively versus when to push forward in attack. Leadership qualities evident when organizing defensive shape during set pieces.`,
    
    club_description: `Founded in 1935, Dreams Football Club of Dawu has become one of Ghana's most respected football academies. Located in the Eastern Region, the club operates a world-class training facility spanning 15 hectares with FIFA-standard pitches and modern dormitory facilities. The academy has produced over 200 professional players who have gone on to play in European leagues including the Premier League, Bundesliga, and Ligue 1. Their youth development philosophy emphasizes technical skills, tactical awareness, and character development.`,
    
    general: `The African football scouting landscape is experiencing unprecedented growth with increased investment from European clubs. Young talents from countries like Nigeria, Ghana, Senegal, and Ivory Coast are being identified earlier than ever before. Modern scouting networks now utilize advanced analytics, video analysis, and comprehensive player databases to evaluate prospects. The establishment of residential academies across West Africa has created structured pathways for player development and international exposure.`
  };

  const demoTitles = {
    player_bio: 'Player Biography',
    scouting_report: 'Scouting Report',
    club_description: 'Club Description', 
    general: 'General Football Content'
  };

  const supportedLanguages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'fr', name: 'French', flag: '🇫🇷' },
    { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
    { code: 'es', name: 'Spanish', flag: '🇪🇸' },
    { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
    { code: 'sw', name: 'Swahili', flag: '🇰🇪' },
    { code: 'ha', name: 'Hausa', flag: '🇳🇬' },
    { code: 'yo', name: 'Yoruba', flag: '🇳🇬' },
    { code: 'am', name: 'Amharic', flag: '🇪🇹' },
    { code: 'zu', name: 'Zulu', flag: '🇿🇦' }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Languages className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Instant Translation for Football Scouting
          </h1>
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Break down language barriers in African football scouting with AI-powered instant translation. 
          Translate player bios, scouting reports, and club descriptions into 10+ languages with context-aware accuracy.
        </p>
      </div>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="p-4 text-center">
            <Globe className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <h3 className="font-semibold mb-1">10+ Languages</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Support for major African and European languages
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <h3 className="font-semibold mb-1">Football Context</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Preserves technical terms and football terminology
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Trophy className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
            <h3 className="font-semibold mb-1">High Accuracy</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              AI-powered translations with confidence scoring
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Supported Languages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Supported Languages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {supportedLanguages.map((lang) => (
              <div key={lang.code} className="flex items-center gap-2 p-2 rounded-md bg-gray-50 dark:bg-gray-800">
                <span className="text-lg">{lang.flag}</span>
                <span className="text-sm font-medium">{lang.name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Demo Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Try Instant Translation</CardTitle>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Select a content type to see context-aware translation in action
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-6">
            {Object.keys(demoTexts).map((type) => (
              <Badge
                key={type}
                variant={activeDemo === type ? "default" : "outline"}
                className="cursor-pointer px-3 py-1"
                onClick={() => setActiveDemo(type)}
              >
                {demoTitles[type as keyof typeof demoTitles]}
              </Badge>
            ))}
          </div>

          {/* Active Demo */}
          <TranslationWidget
            text={demoTexts[activeDemo as keyof typeof demoTexts]}
            context={activeDemo as 'player_bio' | 'scouting_report' | 'club_description' | 'general'}
            className="max-w-4xl mx-auto"
          />
        </CardContent>
      </Card>

      {/* Use Cases */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">For Scouts & Agents</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="font-medium text-sm">Player Bio Translation</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Instantly understand player backgrounds in your preferred language
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="font-medium text-sm">Scouting Report Analysis</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Access detailed technical assessments across language barriers
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="font-medium text-sm">Club Communication</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Communicate effectively with African academies and clubs
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Technical Features</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="font-medium text-sm">Football Term Preservation</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Maintains accuracy of technical football vocabulary
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="font-medium text-sm">Context Awareness</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Adapts translation style based on content type
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <p className="font-medium text-sm">Confidence Scoring</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  Quality indicators for translation reliability
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Call to Action */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950 dark:to-green-950 border-blue-200 dark:border-blue-800">
        <CardContent className="p-6 text-center">
          <h3 className="text-xl font-semibold mb-2">Ready to Break Language Barriers?</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Start using instant translation throughout ScoutPro to access African football talent globally.
          </p>
          <div className="flex flex-wrap justify-center gap-2 text-xs">
            <Badge variant="secondary">Player Profiles</Badge>
            <Badge variant="secondary">Scouting Reports</Badge>
            <Badge variant="secondary">Club Information</Badge>
            <Badge variant="secondary">Market Analysis</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}