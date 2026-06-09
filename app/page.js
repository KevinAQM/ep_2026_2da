import { getElectionData } from './lib/db';
import { processData } from './lib/utils';
import DashboardClient from './DashboardClient';

export const revalidate = 30; // Revalidate the page every 30 seconds on the CDN

export default async function Page() {
  const rawData = await getElectionData();
  const processedData = processData(rawData);
  return <DashboardClient initialData={processedData} rawData={rawData} />;
}
