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
