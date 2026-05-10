import type { WorkspaceSettings } from './workspaceSettings';

export interface ArticleImageAsset {
  dataUrl: string;
  prompt: string;
  engine: string;
  model: string;
  style: string;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function paletteForStyle(style: string): { bg: string; accent: string; text: string; sub: string } {
  if (style.includes('杂志')) return { bg: '#F5F0E8', accent: '#F97316', text: '#1A1A1A', sub: '#6B7280' };
  if (style.includes('极简')) return { bg: '#F8FAFC', accent: '#111827', text: '#111827', sub: '#64748B' };
  if (style.includes('手绘')) return { bg: '#FFF7ED', accent: '#14B8A6', text: '#2B2118', sub: '#8A6A4F' };
  if (style.includes('数据')) return { bg: '#EEF6FF', accent: '#2563EB', text: '#0F172A', sub: '#475569' };
  if (style.includes('赛博')) return { bg: '#111827', accent: '#F97316', text: '#F9FAFB', sub: '#A7F3D0' };
  return { bg: '#F4F7FB', accent: '#F97316', text: '#111827', sub: '#64748B' };
}

function ratioSize(ratio: string): { width: number; height: number } {
  if (ratio === '1:1') return { width: 1200, height: 1200 };
  if (ratio === '16:9') return { width: 1600, height: 900 };
  if (ratio === '3:4') return { width: 900, height: 1200 };
  return { width: 1200, height: 900 };
}

function splitTitle(title: string): string[] {
  const clean = title.replace(/\s+/g, ' ').trim();
  if (clean.length <= 18) return [clean];
  const lines: string[] = [];
  let rest = clean;
  while (rest.length > 0 && lines.length < 3) {
    lines.push(rest.slice(0, 18));
    rest = rest.slice(18);
  }
  return lines;
}

export function generateArticleImageAsset(params: {
  title: string;
  appName: string;
  content: string;
  settings: WorkspaceSettings;
}): ArticleImageAsset {
  const { width, height } = ratioSize(params.settings.imageRatio);
  const palette = paletteForStyle(params.settings.imageStyle);
  const titleLines = splitTitle(params.title);
  const prompt = [
    `Create a ${params.settings.imageStyle} editorial cover image for a ${params.appName} article.`,
    `Title: ${params.title}`,
    `Aspect ratio: ${params.settings.imageRatio}.`,
    `Visual direction: clean, publish-ready, readable headline, no messy text, strong focal point.`,
    params.settings.imagePromptHint ? `Extra requirements: ${params.settings.imagePromptHint}` : '',
    `Image engine: ${params.settings.imageEngine}.`,
    `Use model: ${params.settings.imageModel}.`,
  ].filter(Boolean).join('\n');

  const lineSvg = titleLines.map((line, index) => (
    `<text x="80" y="${height * 0.36 + index * 78}" font-family="Inter, Arial, sans-serif" font-size="${width > height ? 60 : 54}" font-weight="800" fill="${palette.text}">${escapeXml(line)}</text>`
  )).join('');

  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${palette.bg}"/>
  <circle cx="${width - 180}" cy="170" r="120" fill="${palette.accent}" opacity="0.16"/>
  <circle cx="${width - 90}" cy="${height - 90}" r="220" fill="${palette.accent}" opacity="0.10"/>
  <rect x="56" y="56" width="${width - 112}" height="${height - 112}" rx="36" fill="none" stroke="${palette.accent}" stroke-width="5" opacity="0.45"/>
  <text x="80" y="128" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="700" fill="${palette.accent}">${escapeXml(params.appName)}</text>
  ${lineSvg}
  <text x="80" y="${height - 120}" font-family="Inter, Arial, sans-serif" font-size="30" fill="${palette.sub}">${escapeXml(params.settings.imageStyle)} · ${escapeXml(params.settings.imageEngine)}</text>
  <rect x="80" y="${height - 82}" width="180" height="10" rx="5" fill="${palette.accent}"/>
</svg>`.trim();

  return {
    dataUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
    prompt,
    engine: params.settings.imageEngine,
    model: params.settings.imageModel,
    style: params.settings.imageStyle,
  };
}
