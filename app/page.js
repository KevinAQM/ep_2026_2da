import { getElectionData } from './lib/db';
import DashboardClient from './DashboardClient';

export const revalidate = 30; // Revalidate the page every 60 seconds on the CDN

export default async function Page() {
  const initialData = await getElectionData();
  return <DashboardClient initialData={initialData} />;
}
