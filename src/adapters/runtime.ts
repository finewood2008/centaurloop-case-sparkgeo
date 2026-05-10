export type RuntimeMode = 'real' | 'demo';

export interface RuntimeStatus {
  mode: RuntimeMode;
  provider: string;
  model: string;
  configured: boolean;
  available: boolean;
  message: string;
  selectedRuntimeId?: string;
}

export interface RuntimeConnector {
  id: string;
  label: string;
  provider: string;
  endpoint?: string;
  model: string;
  models?: string[];
  configured: boolean;
  available: boolean;
  kind: 'demo' | 'openai-compatible' | 'ollama' | 'planned';
  message: string;
}

export interface RuntimeScanResult {
  connectors: RuntimeConnector[];
  selectedRuntimeId: string;
}

const CUSTOM_RUNTIME_ID = 'user-settings';

const DEMO_STATUS: RuntimeStatus = {
  mode: 'demo',
  provider: 'built-in',
  model: '内置体验',
  configured: false,
  available: true,
  message: 'Built-in experience runtime is active.',
};

export async function fetchRuntimeStatus(): Promise<RuntimeStatus> {
  try {
    const response = await fetch('/api/runtime/status', { headers: { accept: 'application/json' } });
    if (!response.ok) return DEMO_STATUS;
    const status = await response.json() as RuntimeStatus;
    return { ...DEMO_STATUS, ...status };
  } catch {
    return DEMO_STATUS;
  }
}

function readStoredUserModelConfig(): UserModelConfig | null {
  if (typeof window === 'undefined') return null;
  const apiKey = window.localStorage.getItem('spark_geo_api_key') ?? '';
  if (!apiKey.trim()) return null;
  return {
    apiKey: apiKey.trim(),
    baseUrl: (window.localStorage.getItem('spark_geo_base_url') ?? 'https://api.openai.com/v1').trim().replace(/\/$/, ''),
    model: (window.localStorage.getItem('spark_geo_model') ?? 'gpt-4o-mini').trim(),
  };
}

function userSettingsConnector(): RuntimeConnector {
  const config = readStoredUserModelConfig();
  return {
    id: CUSTOM_RUNTIME_ID,
    label: 'Custom OpenAI-compatible model',
    provider: 'custom-openai-compatible',
    endpoint: config?.baseUrl ?? 'https://api.openai.com/v1',
    model: config?.model ?? 'gpt-4o-mini',
    models: config ? [config.model] : [],
    configured: Boolean(config),
    available: Boolean(config),
    kind: 'openai-compatible',
    message: config
      ? 'Custom model from Settings is ready.'
      : 'Add an API key, base URL, and model name to use a custom model.',
  };
}

function withUserSettingsConnector(scan: RuntimeScanResult): RuntimeScanResult {
  if (typeof window === 'undefined') return scan;
  const custom = userSettingsConnector();
  const connectors = [
    ...scan.connectors.filter((connector) => connector.id !== CUSTOM_RUNTIME_ID),
    custom,
  ];
  return {
    connectors,
    selectedRuntimeId: window.localStorage.getItem('spark_geo_runtime_id') ?? scan.selectedRuntimeId,
  };
}

export async function scanRuntimeConnectors(): Promise<RuntimeScanResult> {
  try {
    const response = await fetch('/api/runtime/scan', { headers: { accept: 'application/json' } });
    if (!response.ok) {
      return withUserSettingsConnector({
        connectors: [{
          id: 'local-demo',
          label: 'Built-in experience runtime',
          provider: 'built-in',
          model: '内置体验',
          configured: true,
          available: true,
          kind: 'demo',
          message: 'Built-in deterministic runtime. No API key required.',
        }],
        selectedRuntimeId: 'local-demo',
      });
    }
    return withUserSettingsConnector(await response.json() as RuntimeScanResult);
  } catch {
    return withUserSettingsConnector({
      connectors: [{
        id: 'local-demo',
        label: 'Built-in experience runtime',
        provider: 'built-in',
        model: '内置体验',
        configured: true,
        available: true,
        kind: 'demo',
        message: 'Built-in deterministic runtime. No API key required.',
      }],
      selectedRuntimeId: 'local-demo',
    });
  }
}

export async function connectRuntime(runtimeId: string): Promise<{ connector: RuntimeConnector; status: RuntimeStatus }> {
  if (runtimeId === CUSTOM_RUNTIME_ID) {
    const connector = userSettingsConnector();
    if (!connector.available) {
      throw new Error('Custom model is not configured.');
    }
    return {
      connector,
      status: {
        mode: 'real',
        provider: connector.provider,
        model: connector.model,
        configured: true,
        available: true,
        message: connector.message,
        selectedRuntimeId: connector.id,
      },
    };
  }

  const response = await fetch('/api/runtime/connect', {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({ runtimeId }),
  });
  const payload = await response.json().catch(() => null) as {
    connector?: RuntimeConnector;
    status?: RuntimeStatus;
    error?: string;
  } | null;

  if (!response.ok) {
    const message = payload?.status?.message ?? payload?.error ?? `Runtime connect failed: ${response.status}`;
    throw new Error(message);
  }
  if (!payload?.connector || !payload.status) {
    throw new Error('Runtime connect returned an invalid response.');
  }
  return { connector: payload.connector, status: payload.status };
}

function readSelectedRuntimeId(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.localStorage.getItem('spark_geo_runtime_id') ?? undefined;
}

export interface UserModelConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export function readUserModelConfig(): UserModelConfig | null {
  if (readSelectedRuntimeId() !== CUSTOM_RUNTIME_ID) return null;
  return readStoredUserModelConfig();
}

export function hasUserModelConfig(): boolean {
  return readUserModelConfig() !== null;
}

export async function invokeRuntimeModel(prompt: string): Promise<{ text: string; provider: string; model: string; runtimeId?: string }> {
  const userConfig = readUserModelConfig();

  const response = await fetch('/api/model', {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body: JSON.stringify({
      prompt,
      runtimeId: readSelectedRuntimeId(),
      ...(userConfig && {
        apiKey: userConfig.apiKey,
        baseUrl: userConfig.baseUrl,
        model: userConfig.model,
      }),
    }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(body || `Runtime request failed: ${response.status}`);
  }

  const payload = await response.json() as { text?: string; provider?: string; model?: string; runtimeId?: string };
  if (!payload.text?.trim()) throw new Error('Runtime returned no text.');
  return {
    text: payload.text.trim(),
    provider: payload.provider ?? 'openai-compatible',
    model: payload.model ?? 'unknown',
    runtimeId: payload.runtimeId,
  };
}
