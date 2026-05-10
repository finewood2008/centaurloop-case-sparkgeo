/**
 * Spark GEO AI Client
 */

import { invokeRuntimeModel } from './runtime';

export interface AIClient {
  models: {
    invoke: (params: { prompt: string }) => Promise<unknown>;
  };
}

export type AIClientMode = 'real' | 'demo';

let _lastClientMode: AIClientMode = 'demo';

export function getLastClientMode(): AIClientMode {
  return _lastClientMode;
}

function setLastClientMode(mode: AIClientMode): void {
  _lastClientMode = mode;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('centaur-runtime-mode', { detail: { mode } }));
  }
}

function wantsEnglish(prompt: string): boolean {
  return /Use clear, concise English|Output language:\s*English|English/i.test(prompt);
}

function createDemoClient(): AIClient {
  return {
    models: {
      invoke: async ({ prompt }: { prompt: string }) => {
        await new Promise((r) => setTimeout(r, 800 + Math.random() * 1200));

        if (prompt.includes('闭环规划器') || prompt.includes('loop planner')) {
          return { text: generateDemoPlanResponse(prompt) };
        }
        if (prompt.includes('闭环复盘引擎')) {
          return { text: generateDemoReviewResponse(wantsEnglish(prompt)) };
        }
        if (
          prompt.includes('这是一张社交媒体/内容平台的数据截图')
          || prompt.includes('请识别平台类型和数字指标')
        ) {
          return { text: generateDemoScreenshotResponse() };
        }
        if (prompt.includes('已发布文章链接反馈分析器')) {
          return { text: generateDemoPublishedUrlFeedbackResponse(wantsEnglish(prompt)) };
        }
        if (prompt.includes('Spark GEO 记忆提取器')) {
          return { text: generateDemoMemoryExtractionResponse(wantsEnglish(prompt)) };
        }
        return { text: generateDemoContentResponse(prompt) };
      },
    },
  };
}

function generateDemoPlanResponse(prompt: string): string {
  const english = wantsEnglish(prompt);

  if (english) {
    return JSON.stringify({
      summary: 'This week: publish a Xiaohongshu note, a WeChat article, and a Moments post around the user\'s content goal.',
      platforms: ['Xiaohongshu', 'WeChat', 'Moments'],
      keywords: ['content growth', 'AI tools', 'new media'],
      tasks: [
        {
          appToolId: 'xiaohongshu-note',
          appName: 'Xiaohongshu Note',
          artifactType: 'social_post',
          inputParams: { topic: 'AI content growth tips', style: 'practical tips', keywords: 'AI, content, growth' },
        },
        {
          appToolId: 'wechat-article',
          appName: 'WeChat Article',
          artifactType: 'article',
          inputParams: { topic: 'How to use AI for content marketing', keywords: 'AI marketing', tone: 'professional' },
        },
        {
          appToolId: 'moments-post',
          appName: 'Moments Post',
          artifactType: 'social_post',
          inputParams: { topic: 'AI tools that 10x your content output', occasion: 'daily' },
        },
      ],
    });
  }

  return JSON.stringify({
    summary: '本周围绕用户目标，生产小红书笔记、公众号文章和朋友圈文案各一篇，覆盖多平台内容增长',
    platforms: ['小红书', '公众号', '朋友圈'],
    keywords: ['内容增长', 'AI工具', '新媒体运营'],
    tasks: [
      {
        appToolId: 'xiaohongshu-note',
        appName: '小红书笔记',
        artifactType: 'social_post',
        inputParams: { topic: 'AI内容增长实操技巧', style: '干货', keywords: 'AI,内容,增长' },
      },
      {
        appToolId: 'wechat-article',
        appName: '公众号文章',
        artifactType: 'article',
        inputParams: { topic: '如何用AI做内容营销', keywords: 'AI营销', tone: '专业' },
      },
      {
        appToolId: 'moments-post',
        appName: '朋友圈文案',
        artifactType: 'social_post',
        inputParams: { topic: '用AI工具让内容产出提升10倍', occasion: '日常' },
      },
    ],
  });
}

function generateDemoContentResponse(prompt: string): string {
  const english = wantsEnglish(prompt);
  const appMatch = prompt.match(/应用名称：(.+)/);
  const appName = appMatch?.[1]?.trim() ?? '';

  if (appName.includes('小红书') || appName.includes('Xiaohongshu')) {
    if (english) {
      return `# 5 AI Content Hacks That Actually Work

Stop scrolling and save this! After testing 20+ AI tools, here are the 5 that truly changed my content game:

1. **Auto-outline your articles** - Feed a keyword, get a full structure in 10 seconds
2. **Repurpose like a pro** - One article becomes 5 social posts automatically
3. **SEO + GEO optimization** - Make your content visible to both Google AND AI search engines
4. **Feedback loop magic** - Let AI learn from your best-performing posts
5. **Batch generation** - Write a week's content in one sitting

The secret? It's not about AI replacing you. It's about AI amplifying your voice.

Save this for later and follow for more AI content tips!

#AIContent #ContentCreator #GrowthHacking #NewMedia`;
    }

    return `# 5个真正有用的AI内容技巧，看完立省3小时

刷到就是赚到！测试了20多个AI工具后，这5个是真的改变了我的内容效率：

1. **自动生成文章大纲** - 输入关键词，10秒出完整结构
2. **一键多平台分发** - 一篇文章自动变成5条不同平台的内容
3. **SEO+GEO双优化** - 让你的内容同时被搜索引擎和AI引擎看到
4. **反馈闭环** - AI会从你的爆款中学习，下一篇更好
5. **批量生成** - 一个下午写完一周内容

核心心得：AI不是替代你，是放大你的声音。

收藏起来慢慢看，关注我获取更多AI内容干货！

#AI内容 #新媒体运营 #内容增长 #效率工具 #自媒体`;
  }

  if (appName.includes('公众号') || appName.includes('WeChat')) {
    if (english) {
      return `# How AI Is Changing Content Marketing in 2025

The content marketing landscape has shifted dramatically. Here's what smart teams are doing differently.

## The Old Way vs The New Way

Traditional content marketing: brainstorm → write → publish → hope for the best.

AI-powered content loop: **set goals → AI plans → human approves → AI generates → human reviews → publish → collect feedback → AI learns → repeat**.

## Why Feedback Loops Matter

Without feedback, your AI is just a fancy text generator. With feedback and reviewed memory, each cycle becomes more precise.

## Three Steps to Start Today

1. **Define your content goal for the week** - be specific about platforms and metrics
2. **Let AI plan the content mix** - it can suggest topics based on your past performance
3. **Review, publish, and feed back** - close the loop so AI improves

The teams that build feedback loops will outperform those that just generate content.

---

*Want to try this approach? Start with a free experience at spark-geo.com*`;
    }

    return `# AI正在改变内容营销的游戏规则，你准备好了吗？

内容营销的格局正在发生巨变。聪明的团队已经在用完全不同的方式做内容了。

## 旧模式 vs 新模式

传统做法：头脑风暴 → 写稿 → 发布 → 听天由命

AI闭环做法：**设定目标 → AI规划 → 人确认 → AI生成 → 人审核 → 发布 → 收集反馈 → AI复盘 → 下一轮**

## 为什么反馈闭环如此重要

没有反馈的AI只是一个花哨的文字生成器。有了反馈和经验记忆，每一轮生成都会更精准。

## 三步开始实践

1. **明确本周内容目标** — 具体到平台和指标
2. **让AI规划内容组合** — 基于历史表现推荐选题
3. **审核、发布、反馈** — 闭合循环让AI持续进步

建立反馈闭环的团队，一定会跑赢只做内容生成的团队。

---

*想试试这个方法？访问 spark-geo.com 免费体验*`;
  }

  if (appName.includes('朋友圈') || appName.includes('Moments')) {
    if (english) {
      return `Spent 2 hours on content that used to take 2 days. AI doesn't replace creativity — it removes the tedious parts so you can focus on strategy.

The real game-changer? Building a feedback loop. AI learns from your best posts and makes the next batch even better.

If you're still manually brainstorming every post from scratch, you're leaving growth on the table.`;
    }

    return `以前做一周内容要2天，现在2小时搞定。AI不是替代创意，是帮你省掉重复劳动，把精力放在策略上。

真正的秘诀？建立反馈闭环。AI会从你的爆款中学习，下一轮内容自动更好。

如果你还在每篇从零开始头脑风暴，那真的在浪费增长机会。`;
  }

  if (english) {
    return `# AI Content Growth: A Practical Guide

Creating content at scale requires more than just generating text. It requires a system that learns and improves.

## The Feedback Loop Approach

1. Set your weekly content goal
2. Let AI plan the content mix across platforms
3. Review and approve the drafts
4. Publish to your channels
5. Collect performance data
6. Let AI review what worked
7. Save the lessons as memory
8. Start the next cycle smarter

This is not automation. This is augmentation.`;
  }

  return `# AI内容增长实战指南

大规模生产内容不仅仅是生成文字，更需要一套能学习和进化的系统。

## 反馈闭环方法论

1. 设定本周内容目标
2. 让AI规划多平台内容组合
3. 审核确认草稿
4. 发布到各渠道
5. 收集效果数据
6. 让AI复盘什么有效
7. 把经验保存为记忆
8. 更聪明地开始下一轮

这不是自动化，这是增强。`;
}

function generateDemoReviewResponse(english: boolean): string {
  if (english) {
    return JSON.stringify({
      summary: 'This cycle validated the multi-platform approach. Xiaohongshu had the highest engagement rate, while the WeChat article drove the most depth.',
      effectivePoints: [
        'Xiaohongshu emoji-rich style drove 3x more saves than plain text.',
        'Posting at 10am on Tuesday hit peak readership for WeChat.',
        'The "practical tips" angle resonated better than "thought leadership".',
      ],
      ineffectivePoints: [
        'Moments post was too long — should be under 150 characters.',
        'WeChat article lacked a strong opening hook.',
      ],
      dataHighlights: [
        'Xiaohongshu: 2,400 views, 189 likes, 67 saves',
        'WeChat: 1,200 reads, 56 likes, 8 comments',
        'Moments: 45 likes, 3 shares',
      ],
      memoryCandidates: [
        { content: 'Xiaohongshu notes with emoji-rich formatting get 3x more saves.', category: 'lesson' },
        { content: 'Tuesday 10am is the best time for WeChat articles.', category: 'fact' },
        { content: 'Practical tips angle outperforms thought leadership for this audience.', category: 'lesson' },
      ],
      nextSuggestion: 'Next cycle: double down on Xiaohongshu with a series format, shorten Moments posts, and add a stronger hook to WeChat articles.',
    });
  }

  return JSON.stringify({
    summary: '本轮验证了多平台策略的有效性。小红书互动率最高，公众号文章带来最深度的阅读。',
    effectivePoints: [
      '小红书使用emoji丰富的排版，收藏量是纯文字的3倍',
      '周二上午10点发布公众号，阅读高峰明显',
      '"实操技巧"角度比"思想领导力"角度更受欢迎',
    ],
    ineffectivePoints: [
      '朋友圈文案偏长，应控制在150字以内',
      '公众号开头缺少强钩子，跳出率偏高',
    ],
    dataHighlights: [
      '小红书：2400阅读，189点赞，67收藏',
      '公众号：1200阅读，56点赞，8评论',
      '朋友圈：45点赞，3转发',
    ],
    memoryCandidates: [
      { content: '小红书笔记使用emoji丰富排版，收藏量提升3倍', category: 'lesson' },
      { content: '周二上午10点是公众号最佳发布时间', category: 'fact' },
      { content: '实操技巧角度比思想领导力更受目标受众欢迎', category: 'lesson' },
    ],
    nextSuggestion: '下一轮建议：小红书做系列内容，朋友圈文案缩短到150字以内，公众号开头加强钩子',
  });
}

function generateDemoScreenshotResponse(): string {
  return JSON.stringify({
    platform: '小红书',
    metrics: {
      views: 2400,
      likes: 189,
      favorites: 67,
      comments: 12,
      shares: 8,
    },
  });
}

function generateDemoPublishedUrlFeedbackResponse(english: boolean): string {
  if (english) {
    return JSON.stringify({
      platform: 'Published page',
      title: 'Published content analysis',
      summary: 'The page was readable. Public engagement numbers were not visible, so the feedback focuses on content quality and publication readiness.',
      views: null,
      likes: null,
      favorites: null,
      comments: null,
      shares: null,
      completionRate: null,
      rating: 'ok',
      signals: [
        'The title and body are present on the published page.',
        'No public view or like counters were detected.',
        'Add a clearer CTA if the platform supports it.',
      ],
    });
  }

  return JSON.stringify({
    platform: '已发布页面',
    title: '发布链接分析',
    summary: '页面可读取，但没有发现公开展示的阅读、点赞或评论数字，因此本次反馈以内容质量和发布完整度为主。',
    views: null,
    likes: null,
    favorites: null,
    comments: null,
    shares: null,
    completionRate: null,
    rating: 'ok',
    signals: [
      '发布页已包含标题和正文。',
      '页面未公开展示阅读、点赞、收藏等数据。',
      '如果平台允许，可以补一个更明确的互动引导。',
    ],
  });
}

function generateDemoMemoryExtractionResponse(english: boolean): string {
  if (english) {
    return JSON.stringify({
      memories: [
        { content: 'The imported material describes the brand or business context and should be referenced in future content planning.', category: 'fact' },
        { content: 'Prefer practical, concrete content that helps the audience understand the workflow quickly.', category: 'preference' },
        { content: 'When generating content, connect claims to the CentaurLoop human-in-the-loop cycle.', category: 'lesson' },
      ],
    });
  }

  return JSON.stringify({
    memories: [
      { content: '导入资料包含品牌或业务背景，后续内容规划需要优先参考。', category: 'fact' },
      { content: '内容风格应偏实战、具体，让目标受众快速理解工作流价值。', category: 'preference' },
      { content: '生成内容时要把观点连接到 CentaurLoop 的人机协同闭环。', category: 'lesson' },
    ],
  });
}

let _client: AIClient | null = null;
let _runtimeFallbackUntil = 0;

export async function getClientAsync(): Promise<AIClient> {
  if (!_client) {
    _client = {
      models: {
        invoke: async ({ prompt }: { prompt: string }) => {
          if (Date.now() < _runtimeFallbackUntil) {
            setLastClientMode('demo');
            const demo = createDemoClient();
            return demo.models.invoke({ prompt });
          }

          try {
            const result = await invokeRuntimeModel(prompt);
            setLastClientMode('real');
            return result;
          } catch {
            _runtimeFallbackUntil = Date.now() + 30_000;
            setLastClientMode('demo');
            const demo = createDemoClient();
            return demo.models.invoke({ prompt });
          }
        },
      },
    };
  }
  return _client;
}

export function setClient(client: AIClient): void {
  _client = client;
}

export function extractModelText(result: unknown): string {
  if (typeof result === 'string') return result.trim();
  if (!result || typeof result !== 'object') return '';

  const record = result as Record<string, unknown>;
  const directCandidates = [
    record.text, record.content, record.output,
    record.message, record.reply, record.answer,
  ];

  for (const candidate of directCandidates) {
    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate.trim();
    }
  }

  for (const nestedKey of ['data', 'result', 'response']) {
    const nested = record[nestedKey];
    const nestedText = extractModelText(nested);
    if (nestedText) return nestedText;
  }

  return '';
}
