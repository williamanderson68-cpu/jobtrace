export type JobSource =
  | {
      name: string
      type: 'greenhouse'
      boardToken: string
      enabled: boolean
    }
  | {
      name: string
      type: 'lever'
      companySlug: string
      enabled: boolean
    }

/**
 * Add companies here as you find sources that work.
 *
 * Greenhouse examples:
 * - boardToken usually appears in the Greenhouse job board URL/API.
 * - API format: https://boards-api.greenhouse.io/v1/boards/{boardToken}/jobs
 *
 * Lever examples:
 * - companySlug is usually the company slug in Lever's public postings API.
 * - API format: https://api.lever.co/v0/postings/{companySlug}?mode=json
 */
export const jobSources: JobSource[] = [
  {
    name: 'Astranis',
    type: 'greenhouse',
    boardToken: 'astranis',
    enabled: true,
  },
  {
    name: 'Scale AI',
    type: 'greenhouse',
    boardToken: 'scaleai',
    enabled: true,
  },
  {
    name: 'Anduril',
    type: 'lever',
    companySlug: 'anduril',
    enabled: false,
  },
]
