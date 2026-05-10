import type { CentaurLoopConfig } from '../types';

export const SPARK_GEO_LOOP_CONFIG: CentaurLoopConfig = {
  id: 'spark-geo-content',
  name: '内容增长闭环',
  icon: '🔥',
  employeeId: 'spark',
  description: '每周规划多平台内容，生成、审核、发布、收集反馈、复盘提炼策略，让下一轮内容更好',
  trigger: { type: 'manual', description: '用户主动启动新一轮内容周期' },
  cyclePeriod: 'weekly',
  aiWorkPhases: [
    {
      id: 'plan',
      name: '内容规划',
      appToolIds: ['xiaohongshu-note', 'wechat-article', 'moments-post', 'douyin-caption', 'seo-article', 'zhihu-answer'],
    },
    {
      id: 'generate',
      name: '批量生成',
      appToolIds: ['xiaohongshu-note', 'wechat-article', 'moments-post', 'douyin-caption', 'seo-article', 'zhihu-answer'],
    },
    { id: 'review', name: '复盘与策略', appToolIds: [] },
  ],
  humanGates: [
    { id: 'confirm-plan', stage: 'awaiting_plan_review', name: '确认本周计划', description: '审核本周内容增长计划', required: true, timeoutAction: 'remind', remindAfterMinutes: 60, maxReminders: 3, notifyChannels: ['spirit_bubble', 'badge'] },
    { id: 'confirm-drafts', stage: 'awaiting_review', name: '审核内容草稿', description: '逐篇审核、编辑、确认', required: true, timeoutAction: 'remind', remindAfterMinutes: 120, maxReminders: 3, notifyChannels: ['spirit_bubble', 'badge'] },
    { id: 'publish', stage: 'awaiting_publish', name: '发布到各平台', description: '复制内容到目标平台发布', required: true, timeoutAction: 'remind', remindAfterMinutes: 1440, maxReminders: 2, notifyChannels: ['spirit_bubble'] },
    { id: 'feedback', stage: 'awaiting_feedback', name: '抓取发布反馈', description: '粘贴发布链接，由 AI 自动读取公开页面并分析反馈', required: false, timeoutAction: 'skip', remindAfterMinutes: 4320, maxReminders: 2, notifyChannels: ['spirit_bubble'] },
    { id: 'confirm-memory', stage: 'awaiting_memory', name: '确认策略和经验', description: '确认 AI 提炼的策略规则是否启用', required: false, timeoutAction: 'skip', remindAfterMinutes: 60, maxReminders: 1, notifyChannels: ['spirit_bubble'] },
  ],
  artifactTypes: ['article', 'social_post', 'seo_article'],
  feedbackMethods: ['quick_form', 'chat_followup'],
  memoryCategories: ['有效选题', '标题模式', '平台偏好', '发布时间', '内容结构', 'CTA策略'],
};
