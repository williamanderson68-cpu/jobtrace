export type JobSource =
  | { name: string; type: 'greenhouse'; boardToken: string; enabled: boolean }
  | { name: string; type: 'lever'; companySlug: string; enabled: boolean }

export const jobSources: JobSource[] = [
  { name: 'Astranis', type: 'greenhouse', boardToken: 'astranis', enabled: true },
  { name: 'Scale AI', type: 'greenhouse', boardToken: 'scaleai', enabled: true },
  { name: 'Anthropic', type: 'greenhouse', boardToken: 'anthropic', enabled: true },
  { name: 'OpenAI', type: 'greenhouse', boardToken: 'openai', enabled: true },
  { name: 'Databricks', type: 'greenhouse', boardToken: 'databricks', enabled: true },
  { name: 'Rippling', type: 'greenhouse', boardToken: 'rippling', enabled: true },
  { name: 'Figma', type: 'greenhouse', boardToken: 'figma', enabled: true },
  { name: 'Notion', type: 'greenhouse', boardToken: 'notion', enabled: true },
  { name: 'Stripe', type: 'greenhouse', boardToken: 'stripe', enabled: true },
  { name: 'Plaid', type: 'greenhouse', boardToken: 'plaid', enabled: true },
  { name: 'Chime', type: 'greenhouse', boardToken: 'chime', enabled: true },
  { name: 'Coinbase', type: 'greenhouse', boardToken: 'coinbase', enabled: true },
  { name: 'Instacart', type: 'greenhouse', boardToken: 'instacart', enabled: true },
  { name: 'DoorDash', type: 'greenhouse', boardToken: 'doordash', enabled: true },
  { name: 'Cruise', type: 'greenhouse', boardToken: 'cruise', enabled: true },
  { name: 'Waymo', type: 'greenhouse', boardToken: 'waymo', enabled: true },
  { name: 'Roblox', type: 'greenhouse', boardToken: 'roblox', enabled: true },
  { name: 'Cloudflare', type: 'greenhouse', boardToken: 'cloudflare', enabled: true },
  { name: 'GitLab', type: 'greenhouse', boardToken: 'gitlab', enabled: true },
  { name: 'Reddit', type: 'greenhouse', boardToken: 'reddit', enabled: true },
  { name: 'Anduril', type: 'lever', companySlug: 'anduril', enabled: false },
]
