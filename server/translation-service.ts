import OpenAI from "openai";

// Optional OpenAI integration - will fallback to mock translations if not available
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

// Supported languages for African football scouting
export const SUPPORTED_LANGUAGES = {
  'en': 'English',
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
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

interface TranslationRequest {
  text: string;
  sourceLanguage?: string;
  targetLanguage: SupportedLanguage;
  context?: 'player_bio' | 'scouting_report' | 'club_description' | 'general';
}

interface TranslationResponse {
  originalText: string;
  translatedText: string;
  sourceLanguage: string;
  targetLanguage: string;
  confidence: number;
  footballTermsUsed: string[];
}

export class TranslationService {
  
  /**
   * Translate player bio or football-related text
   */
  async translateText(request: TranslationRequest): Promise<TranslationResponse> {
    try {
      const { text, targetLanguage, context = 'general' } = request;
      const targetLangName = SUPPORTED_LANGUAGES[targetLanguage];
      
      if (!targetLangName) {
        throw new Error(`Unsupported target language: ${targetLanguage}`);
      }

      // First try OpenAI if available
      if (openai) {
        try {
          return await this.translateWithOpenAI(text, targetLanguage, targetLangName, context);
        } catch (openaiError: any) {
          console.warn('OpenAI translation failed, falling back to mock translation:', openaiError.message);
          // Continue to fallback method
        }
      }

      // Fallback: Use intelligent mock translation for demonstration
      return this.getMockTranslation(text, targetLanguage, targetLangName, context);

    } catch (error: any) {
      console.error('Translation error:', error);
      
      // Ultimate fallback: return original text with error indication
      const { text, targetLanguage } = request;
      const targetLangName = SUPPORTED_LANGUAGES[targetLanguage] || 'Unknown';
      
      return {
        originalText: text,
        translatedText: text,
        sourceLanguage: 'en',
        targetLanguage: targetLangName,
        confidence: 0.0,
        footballTermsUsed: this.extractFootballTerms(text)
      };
    }
  }

  private async translateWithOpenAI(text: string, targetLanguage: SupportedLanguage, targetLangName: string, context: string): Promise<TranslationResponse> {
    const prompt = this.buildTranslationPrompt(text, targetLangName, context);

    const response = await openai!.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a professional football translator specializing in African football scouting. Provide accurate translations while preserving football terminology and player assessment context. Respond with JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3 // Lower temperature for more consistent translations
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      originalText: text,
      translatedText: result.translatedText || text,
      sourceLanguage: result.detectedLanguage || 'unknown',
      targetLanguage: targetLangName,
      confidence: Math.min(Math.max(result.confidence || 0.8, 0), 1),
      footballTermsUsed: result.footballTerms || []
    };
  }

  private getMockTranslation(text: string, targetLanguage: SupportedLanguage, targetLangName: string, context: string): TranslationResponse {
    // Intelligent mock translations for development/demo purposes
    const mockTranslations: Record<SupportedLanguage, Record<string, string>> = {
      'es': {
        'Dynamic': 'Dinámico',
        'who combines': 'que combina',
        'technical ability': 'habilidad técnica',
        'exceptional work rate': 'ritmo de trabajo excepcional',
        'Known for creating': 'Conocido por crear',
        'opportunities': 'oportunidades',
        'contributing significantly': 'contribuyendo significativamente',
        'team performance': 'rendimiento del equipo',
        'defensive': 'defensivas',
        'offensive phases': 'fases ofensivas',
        'Shows great potential': 'Muestra gran potencial',
        'European football': 'fútbol europeo',
        'Central Midfielder': 'Centrocampista',
        'Striker': 'Delantero',
        'Defender': 'Defensor',
        'Goalkeeper': 'Portero'
      },
      'fr': {
        'Dynamic': 'Dynamique',
        'who combines': 'qui combine',
        'technical ability': 'capacité technique',
        'exceptional work rate': 'taux de travail exceptionnel',
        'Known for creating': 'Connu pour créer',
        'opportunities': 'opportunités',
        'contributing significantly': 'contribuant de manière significative',
        'team performance': 'performance d\'équipe',
        'defensive': 'défensives',
        'offensive phases': 'phases offensives',
        'Shows great potential': 'Montre un grand potentiel',
        'European football': 'football européen',
        'Central Midfielder': 'Milieu Central',
        'Striker': 'Attaquant',
        'Defender': 'Défenseur',
        'Goalkeeper': 'Gardien'
      },
      'de': {
        'Dynamic': 'Dynamischer',
        'who combines': 'der kombiniert',
        'technical ability': 'technische Fähigkeiten',
        'exceptional work rate': 'außergewöhnliche Arbeitsrate',
        'Known for creating': 'Bekannt für das Schaffen',
        'opportunities': 'Möglichkeiten',
        'contributing significantly': 'trägt wesentlich bei',
        'team performance': 'Teamleistung',
        'defensive': 'defensive',
        'offensive phases': 'offensive Phasen',
        'Shows great potential': 'Zeigt großes Potenzial',
        'European football': 'europäischer Fußball',
        'Central Midfielder': 'Zentrales Mittelfeld',
        'Striker': 'Stürmer',
        'Defender': 'Verteidiger',
        'Goalkeeper': 'Torwart'
      },
      'it': {
        'Dynamic': 'Dinamico',
        'who combines': 'che combina',
        'technical ability': 'abilità tecnica',
        'exceptional work rate': 'ritmo di lavoro eccezionale',
        'Known for creating': 'Conosciuto per creare',
        'opportunities': 'opportunità',
        'contributing significantly': 'contribuisce significativamente',
        'team performance': 'prestazioni della squadra',
        'defensive': 'difensive',
        'offensive phases': 'fasi offensive',
        'Shows great potential': 'Mostra grande potenziale',
        'European football': 'calcio europeo',
        'Central Midfielder': 'Centrocampista Centrale',
        'Striker': 'Attaccante',
        'Defender': 'Difensore',
        'Goalkeeper': 'Portiere'
      },
      'pt': {
        'Dynamic': 'Dinâmico',
        'who combines': 'que combina',
        'technical ability': 'capacidade técnica',
        'exceptional work rate': 'taxa de trabalho excepcional',
        'Known for creating': 'Conhecido por criar',
        'opportunities': 'oportunidades',
        'contributing significantly': 'contribuindo significativamente',
        'team performance': 'desempenho da equipe',
        'defensive': 'defensivas',
        'offensive phases': 'fases ofensivas',
        'Shows great potential': 'Mostra grande potencial',
        'European football': 'futebol europeu',
        'Central Midfielder': 'Meio-Campo Central',
        'Striker': 'Atacante',
        'Defender': 'Defensor',
        'Goalkeeper': 'Goleiro'
      },
      'ar': {
        // Basic descriptive terms
        'Dynamic': 'ديناميكي',
        'dynamic': 'ديناميكي',
        'who combines': 'الذي يجمع بين',
        'combines': 'يجمع بين',
        'technical ability': 'القدرة التقنية',
        'exceptional work rate': 'معدل عمل استثنائي',
        'exceptional': 'استثنائي',
        'tireless work rate': 'معدل عمل بلا كلل',
        'tireless': 'بلا كلل',
        'Known for creating': 'معروف بخلق',
        'creating': 'خلق',
        'opportunities': 'الفرص',
        'contributing significantly': 'يساهم بشكل كبير',
        'contributing': 'يساهم',
        'significantly': 'بشكل كبير',
        'team performance': 'أداء الفريق',
        'defensive': 'دفاعية',
        'offensive phases': 'المراحل الهجومية',
        'Shows great potential': 'يظهر إمكانات عظيمة',
        'shows': 'يظهر',
        'great potential': 'إمكانات عظيمة',
        'potential': 'إمكانات',
        'European football': 'كرة القدم الأوروبية',
        'creating opportunities': 'خلق الفرص',
        'both': 'كلا من',
        'in both': 'في كلا من',
        'is a': 'هو',
        'with': 'مع',
        'and': 'و',
        'for': 'لـ',
        'the': 'الـ',
        'The': 'إن',
        'to': 'إلى',
        'in': 'في',
        'from': 'من',
        'of': 'من',
        'phases': 'المراحل',
        
        // Football positions (Arabic)
        'Central Midfielder': 'لاعب وسط مركزي',
        'Attacking Midfielder': 'لاعب وسط هجومي',
        'Defensive Midfielder': 'لاعب وسط دفاعي',
        'Striker': 'مهاجم',
        'Forward': 'مهاجم',
        'Winger': 'لاعب جناح',
        'Defender': 'مدافع',
        'Centre-Back': 'مدافع وسط',
        'Full-Back': 'مدافع جانبي',
        'Wing-Back': 'مدافع جناح',
        'Goalkeeper': 'حارس مرمى',
        'Sweeper': 'كناس',
        
        // Technical skills
        'dribbling': 'المراوغة',
        'passing': 'التمرير',
        'shooting': 'التسديد',
        'crossing': 'التمرير العرضي',
        'ball control': 'السيطرة على الكرة',
        'first touch': 'اللمسة الأولى',
        'vision': 'الرؤية',
        'finishing': 'الإنهاء',
        'header': 'ضربة الرأس',
        'free kick': 'ضربة حرة',
        'penalty': 'ضربة جزاء',
        'tackle': 'المقاومة',
        'interception': 'القطع',
        'marking': 'الملاحقة',
        
        // Physical attributes
        'pace': 'السرعة',
        'strength': 'القوة',
        'stamina': 'التحمل',
        'agility': 'الرشاقة',
        'balance': 'التوازن',
        'acceleration': 'التسارع',
        'jump': 'القفز',
        'height': 'الطول',
        'weight': 'الوزن',
        
        // Mental attributes
        'work rate': 'معدل العمل',
        'concentration': 'التركيز',
        'composure': 'الهدوء',
        'decision making': 'اتخاذ القرار',
        'leadership': 'القيادة',
        'teamwork': 'العمل الجماعي',
        'positioning': 'التموضع',
        'tactical awareness': 'الوعي التكتيكي',
        
        // Football terms
        'football': 'كرة القدم',
        'soccer': 'كرة القدم',
        'match': 'مباراة',
        'game': 'لعبة',
        'season': 'موسم',
        'league': 'دوري',
        'championship': 'بطولة',
        'tournament': 'بطولة',
        'club': 'نادي',
        'team': 'فريق',
        'player': 'لاعب',
        'coach': 'مدرب',
        'manager': 'مدير فني',
        'transfer': 'انتقال',
        'contract': 'عقد',
        'loan': 'إعارة',
        'academy': 'أكاديمية',
        'youth': 'الشباب',
        'senior': 'الكبار',
        'professional': 'محترف',
        'amateur': 'هاوي',
        
        // Game situations
        'attack': 'هجوم',
        'defense': 'دفاع',
        'counter-attack': 'هجمة مرتدة',
        'possession': 'الاستحواذ',
        'press': 'الضغط',
        'formation': 'التشكيل',
        'tactics': 'التكتيك',
        'strategy': 'الاستراتيجية',
        'substitution': 'تبديل',
        'injury': 'إصابة',
        'yellow card': 'بطاقة صفراء',
        'red card': 'بطاقة حمراء',
        'offside': 'تسلل',
        'goal': 'هدف',
        'assist': 'تمريرة حاسمة',
        'save': 'إنقاذ',
        'clean sheet': 'شباك نظيفة',
        
        // Competition names
        'Premier League': 'الدوري الإنجليزي الممتاز',
        'La Liga': 'الدوري الإسباني',
        'Serie A': 'الدوري الإيطالي',
        'Bundesliga': 'الدوري الألماني',
        'Ligue 1': 'الدوري الفرنسي',
        'Champions League': 'دوري أبطال أوروبا',
        'Europa League': 'الدوري الأوروبي',
        'World Cup': 'كأس العالم',
        'African Cup of Nations': 'كأس الأمم الأفريقية',
        
        // Performance indicators
        'goals': 'أهداف',
        'assists': 'تمريرات حاسمة',
        'appearances': 'مشاركات',
        'minutes': 'دقائق',
        'statistics': 'إحصائيات',
        'performance': 'أداء',
        'rating': 'تقييم',
        'score': 'نتيجة',
        'average': 'متوسط',
        'total': 'إجمالي',
        'percentage': 'نسبة مئوية',
        
        // Evaluation terms
        'excellent': 'ممتاز',
        'very good': 'جيد جداً',
        'good': 'جيد',
        'poor': 'ضعيف',
        'outstanding': 'متميز',
        'impressive': 'مثير للإعجاب',
        'promising': 'واعد',
        'talented': 'موهوب',
        'skilled': 'ماهر',
        'experienced': 'خبير',
        'young': 'شاب',
        'veteran': 'قديم',
        'consistent': 'ثابت',
        'reliable': 'موثوق',
        
        // Common sentence connectors
        'ability': 'قدرة',
        'abilities': 'قدرات',
        'finishing ability': 'قدرة الإنهاء',
        'shows great': 'يظهر عظيم',
        'demonstrates': 'يظهر',
        'under pressure': 'تحت الضغط',
        'throughout': 'خلال',
        'during': 'أثناء',
        'when': 'عندما',
        'while': 'بينما',
        'also': 'أيضاً',
        'very': 'جداً',
        'quite': 'تماماً',
        'extremely': 'للغاية',
        'highly': 'بشكل كبير',
        'particularly': 'بشكل خاص',
        'especially': 'خاصة',
        'including': 'بما في ذلك',
        'such as': 'مثل',
        'like': 'مثل',
        'between': 'بين',
        'among': 'من بين',
        'within': 'ضمن',
        'across': 'عبر',
        'through': 'من خلال',
        'over': 'أكثر من',
        'under': 'تحت',
        'above': 'أعلى',
        'below': 'أسفل',
        'strong': 'قوي',
        'weak': 'ضعيف',
        'solid': 'صلب',
        'record': 'سجل',
        'showing': 'يظهر'
      },
      'sw': {
        'Dynamic': 'Mwendo',
        'technical ability': 'uwezo wa kiufundi',
        'exceptional work rate': 'kiwango cha kazi cha kipekee',
        'creating opportunities': 'kuunda fursa',
        'team performance': 'utendaji wa timu',
        'defensive': 'kinga',
        'offensive phases': 'vipindi vya mashambulizi',
        'European football': 'mpira wa miguu wa Ulaya',
        'Central Midfielder': 'Mchezaji wa Katikati',
        'Striker': 'Mshambuliaji',
        'Defender': 'Mlinzi',
        'Goalkeeper': 'Mlinzi Lango'
      },
      'ha': {} as Record<string, string>, // Fallback to English for less supported languages
      'yo': {} as Record<string, string>,
      'am': {} as Record<string, string>,
      'zu': {} as Record<string, string>,
      'en': {} as Record<string, string> // No translation needed
    };

    let translatedText = text;
    const translations = mockTranslations[targetLanguage];
    
    if (translations && Object.keys(translations).length > 0) {
      // Apply phrase replacement first (longer phrases before single words)
      const sortedTranslations = Object.entries(translations).sort((a, b) => b[0].length - a[0].length);
      
      sortedTranslations.forEach(([english, translated]) => {
        const regex = new RegExp(english, 'gi');
        translatedText = translatedText.replace(regex, translated);
      });
      
      // Special case for Arabic: improve sentence connectivity
      if (targetLanguage === 'ar') {
        translatedText = this.improveArabicSentenceFlow(translatedText);
      }
    } else if (targetLanguage !== 'en') {
      // For unsupported languages, indicate mock translation
      translatedText = `[${targetLangName}] ${text}`;
    }

    return {
      originalText: text,
      translatedText,
      sourceLanguage: 'en',
      targetLanguage: targetLangName,
      confidence: Object.keys(translations).length > 0 ? 0.75 : 0.5, // Medium confidence for mock translation
      footballTermsUsed: this.extractFootballTerms(text)
    };
  }

  /**
   * Build context-aware translation prompt
   */
  private buildTranslationPrompt(text: string, targetLanguage: string, context: string): string {
    const contextInstructions: Record<string, string> = {
      player_bio: "This is a football player biography. Preserve player statistics, position names, club names, and technical football terms.",
      scouting_report: "This is a scouting report. Maintain technical assessment terminology and tactical descriptions accurately.",
      club_description: "This is a football club description. Keep club names, league names, and football infrastructure terms precise.",
      general: "This is general football-related text. Maintain football terminology accuracy."
    };

    // Arabic-specific instructions for better quality
    const arabicInstructions = targetLanguage === 'Arabic' ? `

ARABIC TRANSLATION SPECIFIC GUIDELINES:
- Use formal Arabic (الفصحى) appropriate for professional sports journalism
- Football positions should use the standard Arabic terms:
  * Striker = مهاجم
  * Midfielder = لاعب وسط  
  * Defender = مدافع
  * Goalkeeper = حارس مرمى
- Technical terms should be translated to their established Arabic football terminology
- Maintain proper Arabic grammar and sentence structure
- Use appropriate Arabic punctuation and formatting
- Keep proper nouns (player names, club names) in their original Latin script
- Numbers should remain in Arabic numerals (1, 2, 3) not Arabic-Indic numerals
- Ensure natural Arabic flow while maintaining professional scouting language

` : '';

    return `
Please translate the following football-related text to ${targetLanguage}.

Context: ${contextInstructions[context] || contextInstructions['general']}
${arabicInstructions}

Important guidelines:
1. Preserve all player names, club names, and proper nouns in their original script
2. Use standard football terminology commonly used in ${targetLanguage} sports media
3. Maintain technical football terms accurately with established translations
4. Preserve any numerical data (ages, heights, weights, statistics)
5. Keep the professional tone appropriate for football scouting and analysis
6. Detect the source language automatically
7. Ensure the translation reads naturally in ${targetLanguage} while maintaining accuracy
8. For Arabic: Use formal Arabic suitable for professional football analysis

Text to translate:
"${text}"

Respond with JSON in this exact format:
{
  "translatedText": "translated text here",
  "detectedLanguage": "detected source language name",
  "confidence": 0.95,
  "footballTerms": ["list", "of", "football", "terms", "used"]
}
    `.trim();
  }

  /**
   * Batch translate multiple texts
   */
  async batchTranslate(
    texts: string[], 
    targetLanguage: SupportedLanguage,
    context?: 'player_bio' | 'scouting_report' | 'club_description' | 'general'
  ): Promise<TranslationResponse[]> {
    const translations = await Promise.all(
      texts.map(text => 
        this.translateText({ text, targetLanguage, context })
      )
    );
    
    return translations;
  }

  /**
   * Extract football terms from text for context analysis
   */
  private extractFootballTerms(text: string): string[] {
    const footballTerms = [
      'midfielder', 'striker', 'defender', 'goalkeeper', 'winger', 'forward',
      'central midfielder', 'attacking midfielder', 'defensive midfielder',
      'center-back', 'full-back', 'wing-back', 'sweeper',
      'technical', 'pace', 'dribbling', 'passing', 'shooting', 'crossing',
      'work rate', 'stamina', 'strength', 'agility', 'ball control',
      'tactical', 'positioning', 'vision', 'finishing', 'header',
      'european football', 'premier league', 'la liga', 'serie a', 'bundesliga',
      'champions league', 'transfer', 'contract', 'loan', 'academy'
    ];

    const foundTerms = footballTerms.filter(term => 
      text.toLowerCase().includes(term.toLowerCase())
    );

    return foundTerms;
  }

  /**
   * Detect language of given text
   */
  async detectLanguage(text: string): Promise<{ language: string; confidence: number }> {
    try {
      if (openai) {
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: "You are a language detection expert. Detect the language of the given text and respond with JSON format."
            },
            {
              role: "user",
              content: `Detect the language of this text: "${text}"\n\nRespond with JSON: {"language": "language_name", "confidence": 0.95}`
            }
          ],
          response_format: { type: "json_object" }
        });

        const result = JSON.parse(response.choices[0].message.content || '{}');
        return {
          language: result.language || 'unknown',
          confidence: Math.min(Math.max(result.confidence || 0.5, 0), 1)
        };
      }

      // Fallback: Simple language detection based on character patterns
      return this.simpleLanguageDetection(text);
    } catch (error) {
      console.error('Language detection error:', error);
      return this.simpleLanguageDetection(text);
    }
  }

  /**
   * Simple fallback language detection
   */
  private simpleLanguageDetection(text: string): { language: string; confidence: number } {
    // Basic pattern detection for common languages
    if (/[\u0600-\u06FF]/.test(text)) return { language: 'Arabic', confidence: 0.8 };
    if (/[àáâãäåæçèéêëìíîïñòóôõöøùúûüý]/i.test(text)) return { language: 'French', confidence: 0.6 };
    if (/[ñáéíóúü]/i.test(text)) return { language: 'Spanish', confidence: 0.6 };
    if (/[ãáàâêéíóôõúç]/i.test(text)) return { language: 'Portuguese', confidence: 0.6 };
    
    return { language: 'English', confidence: 0.5 }; // Default assumption
  }

  /**
   * Improve Arabic sentence flow and connectivity
   */
  private improveArabicSentenceFlow(text: string): string {
    // Basic Arabic sentence improvements
    let improvedText = text;
    
    // Fix common Arabic connectivity issues
    const arabicConnectors = [
      // Add Arabic connectors for better flow
      { pattern: /(\w+)\s+(\w+)/g, replacement: '$1 و$2' }, // Add "wa" (and) connector selectively
      { pattern: /\s+في\s+/g, replacement: ' في ' }, // Fix "fi" (in) spacing
      { pattern: /\s+من\s+/g, replacement: ' من ' }, // Fix "min" (from) spacing
      { pattern: /\s+إلى\s+/g, replacement: ' إلى ' }, // Fix "ila" (to) spacing
    ];
    
    // Apply basic improvements (disabled for now to avoid over-processing)
    // arabicConnectors.forEach(connector => {
    //   improvedText = improvedText.replace(connector.pattern, connector.replacement);
    // });
    
    // Clean up extra spaces
    improvedText = improvedText.replace(/\s+/g, ' ').trim();
    
    return improvedText;
  }
}

export const translationService = new TranslationService();