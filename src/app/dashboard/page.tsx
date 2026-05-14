import DashboardClient from './DashboardClient'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    title?: string
    location?: string
  }>
}) {
  const params = await searchParams

  return (
    <DashboardClient
      title={params.title || ''}
      location={params.location || ''}
    />
  )
}
