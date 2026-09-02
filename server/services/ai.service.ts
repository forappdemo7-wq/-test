import { GoogleGenAI } from '@google/genai';
import { config } from '../config/env.config';
import { logger } from '../core/logger/logger';

let geminiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI | null {
  if (!geminiClient && config.gemini.apiKey) {
    geminiClient = new GoogleGenAI({ apiKey: config.gemini.apiKey });
  }
  return geminiClient;
}

export class AIService {
  async generateCaption(topic: string, tone: string = 'aesthetic', keywords: string = '', style: string = 'trendy') {
    const ai = getGeminiClient();

    if (!ai) {
      const fallbacks: Record<string, string[]> = {
        aesthetic: [
          `Chasing golden hours and timeless moments ✨🌿 #${topic ? topic.replace(/\s+/g, '') : 'vibes'} #aesthetic #visualdiary`,
          `Finding magic in the mundane ☁️💫 #${topic ? topic.replace(/\s+/g, '') : 'lifestyle'} #moments #wanderlust`,
          `Soft light, calm soul 🕊️🌙 #${topic ? topic.replace(/\s+/g, '') : 'mood'} #stillness #goldenhour`,
        ],
        witty: [
          `I told myself I wouldn’t post this, but here we are 😂💁‍♀️ #${topic ? topic.replace(/\s+/g, '') : 'mood'} #livingmybestlife`,
          `Reality called, so I hung up 📞✌️ #${topic ? topic.replace(/\s+/g, '') : 'vibes'} #sorrynotsorry`,
        ],
        travel: [
          `Collecting passport stamps & unforgettable views 🌍✈️ #${topic ? topic.replace(/\s+/g, '') : 'travel'} #wanderlust`,
        ],
      };

      const selectedList = fallbacks[tone] || fallbacks.aesthetic;
      const randomFallback = selectedList[Math.floor(Math.random() * selectedList.length)];
      return { caption: randomFallback, source: 'smart-template' };
    }

    const prompt = `Write an engaging, trendy, viral Instagram caption for a post about "${topic || 'a stunning moment'}".
Tone: ${tone}.
Style: ${style}.
Keywords/Details to include: ${keywords || 'none'}.
Include relevant emoji, 1-2 punchy lines, and 3-5 high-performing Instagram hashtags at the end.
Return ONLY the caption text without quotes or explanations.`;

    try {
      const responsePromise = ai.models.generateContent({
        model: config.gemini.model,
        contents: prompt,
        config: {
          systemInstruction: 'You are an expert social media copywriter specializing in viral Instagram captions, aesthetic storytelling, and engagement hooks.',
        },
      });

      // 8-second circuit timeout for AI generation
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI generation timed out')), 8000)
      );

      const response: any = await Promise.race([responsePromise, timeoutPromise]);
      const caption = response.text?.trim() || 'Capturing moments that take my breath away ✨📸 #vibes #aesthetic';
      return { caption, source: config.gemini.model };
    } catch (err) {
      logger.warn('Gemini caption generation timed out or failed, using smart template fallback', err);
      return {
        caption: `Chasing golden hours and timeless moments ✨🌿 #${topic ? topic.replace(/\s+/g, '') : 'vibes'} #aesthetic #visualdiary`,
        source: 'smart-template-fallback',
      };
    }
  }

  async suggestComments(postCaption: string, postTopic: string) {
    const ai = getGeminiClient();

    if (!ai || process.env.NODE_ENV === 'test') {
      return {
        suggestions: [
          'Obsessed with this vibe! 🔥😍',
          'The aesthetic here is immaculate ✨🤍',
          'Frame this immediately 📸💫',
          'Such an inspiring shot! 🌿🙌',
        ],
      };
    }

    const prompt = `Given this Instagram post caption: "${postCaption}" (Topic: "${postTopic}"), provide 4 distinct, engaging, short Instagram comment suggestions that real users would leave. Include appropriate emojis.
Return as a clean JSON array of strings: ["comment1", "comment2", "comment3", "comment4"].`;

    try {
      const responsePromise = ai.models.generateContent({
        model: config.gemini.model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('AI suggestions timed out')), 8000)
      );

      const response: any = await Promise.race([responsePromise, timeoutPromise]);
      const parsed = JSON.parse(response.text || '[]');
      if (Array.isArray(parsed) && parsed.length > 0) {
        return { suggestions: parsed.slice(0, 4) };
      }
    } catch (err) {
      logger.warn('Failed parsing Gemini comment suggestions, using fallback', err);
    }

    return {
      suggestions: [
        'Pure aesthetic perfection! ✨👏',
        'This lighting is everything 🔥📸',
        'Stunning as always! 🤍',
        'Major mood right here 🙌💫',
      ],
    };
  }

  async generateChatReply(contactName: string, contactBio: string, messageHistory: any[], userMessage: string) {
    const ai = getGeminiClient();

    if (!ai) {
      const cannedReplies = [
        'Hey! Thanks so much for reaching out! Loved your latest post by the way ✨',
        'Haha totally agree! Are you going to that photography workshop this weekend? 📸',
        'That looks insane! Send me the location pin if you can 📍✨',
        "Appreciate the love! Hope you're having an awesome week 🙌",
      ];
      return {
        reply: cannedReplies[Math.floor(Math.random() * cannedReplies.length)],
      };
    }

    const prompt = `You are roleplaying as @${contactName || 'alex_creator'} on Instagram Direct Messages.
Your persona/bio: ${contactBio || 'Photographer and visual artist based in NYC'}.
Recent chat history:
${JSON.stringify(messageHistory || [])}
The user just messaged: "${userMessage}"

Respond naturally in character as an Instagram creator/friend in 1-2 friendly sentences. Use casual modern social media language and emojis naturally.`;

    const response = await ai.models.generateContent({
      model: config.gemini.model,
      contents: prompt,
    });

    return { reply: response.text?.trim() || 'Hey there! Thanks for the message! ✨🙌' };
  }

  async generateExploreRecommendations(userInterests: string[], recentTags: string[], activeCategory: string) {
    const ai = getGeminiClient();

    if (!ai) {
      return {
        clusters: [
          {
            title: 'Golden Hour Aesthetics',
            reason: 'Trending in visual photography',
            tags: ['#goldenhour', '#filmphotography', '#aesthetic', '#portrait'],
            emoji: '🌅',
            description: 'Warm, sun-drenched captures and organic silhouettes from top creators.',
          },
          {
            title: 'Nordic & Minimal Architecture',
            reason: 'Popular in design communities',
            tags: ['#architecture', '#minimalism', '#scandinaviandesign', '#interiors'],
            emoji: '🏛️',
            description: 'Clean geometry, neutral palettes, and intentional spatial composition.',
          },
          {
            title: 'Streetwear & Urban Culture',
            reason: 'Surging across style creators',
            tags: ['#streetwear', '#tokyofashion', '#outfitinspo', '#streetstyle'],
            emoji: '👟',
            description: 'Contemporary urban aesthetics and high-contrast street portraits.',
          },
          {
            title: 'Artisanal Cafe & Culinary',
            reason: 'Hot in lifestyle & travel',
            tags: ['#coffeeculture', '#matcha', '#bakery', '#cafestagram'],
            emoji: '☕',
            description: 'Cozy morning light, specialty brews, and culinary craftsmanship.',
          },
        ],
        smartPrompt: 'Discovering visual trends curated for your aesthetic profile.',
        source: 'local-smart-engine',
      };
    }

    const prompt = `You are an AI discovery engine for InstaVibe, a high-end visual social platform.
User Category Context: "${activeCategory}"
User Interests / Followed Topics: ${JSON.stringify(userInterests)}
Recent Tags: ${JSON.stringify(recentTags)}

Generate 4 curated AI recommendation clusters for the Explore page.
Each cluster must have:
- "title": catchy aesthetic title
- "reason": concise explanation why it's recommended
- "tags": array of 3-4 hashtag strings
- "emoji": single matching emoji
- "description": 1 sentence describing the visual mood
Also provide "smartPrompt": 1 short friendly sentence summarizing what AI synthesized for the user.

Return ONLY a valid JSON object matching this schema.`;

    try {
      const response = await ai.models.generateContent({
        model: config.gemini.model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      if (parsed.clusters && Array.isArray(parsed.clusters)) {
        return {
          clusters: parsed.clusters,
          smartPrompt: parsed.smartPrompt || 'AI-curated discovery matching your creative visual taste.',
          source: config.gemini.model,
        };
      }
    } catch (err) {
      logger.warn('Failed parsing Gemini Explore recommendations, using fallback', err);
    }

    return {
      clusters: [
        {
          title: 'Cinematic Mood & Shadows',
          reason: 'High engagement in creative feeds',
          tags: ['#cinematic', '#moodygrams', '#visualsoflife', '#film'],
          emoji: '🎬',
          description: 'Rich contrast, film grains, and storytelling visuals.',
        },
      ],
      smartPrompt: 'Curated creative visuals tailored for you.',
      source: 'fallback',
    };
  }

  async smartSearch(searchQuery: string) {
    const ai = getGeminiClient();

    if (!ai || !searchQuery.trim()) {
      return {
        keywords: searchQuery.toLowerCase().split(/\s+/).filter(Boolean),
        tags: [`#${searchQuery.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}`],
        suggestedCategories: ['Photography', 'Lifestyle'],
        aiInsight: `Showing top matches for "${searchQuery}"`,
      };
    }

    const prompt = `A user is searching on a visual social media app with the natural query: "${searchQuery}".
Analyze this query and return:
1. "keywords": list of 3-5 normalized search terms / synonyms
2. "tags": list of 3-5 relevant hashtags
3. "suggestedCategories": list of 1-3 categories
4. "aiInsight": 1 short sentence summarizing the visual aesthetic match
Return ONLY valid JSON matching this schema.`;

    try {
      const response = await ai.models.generateContent({
        model: config.gemini.model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      return JSON.parse(response.text || '{}');
    } catch {
      return {
        keywords: [searchQuery.toLowerCase()],
        tags: [`#${searchQuery.replace(/\s+/g, '')}`],
        suggestedCategories: ['For You'],
        aiInsight: `Discovering matches for "${searchQuery}"`,
      };
    }
  }
}

export const aiService = new AIService();
