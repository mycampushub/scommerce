import { isCloudflareEnv } from '@/lib/cloudflare';
import { IntegrationRepository as PrismaIntegrationRepository } from './integration.repository';
import { D1IntegrationRepository } from './d1-integration-repository';

function isProductionD1(): boolean {
  // Use isCloudflareEnv instead of checking getEnv
  // This avoids async/await at the module level
  return isCloudflareEnv();
}

export const IntegrationRepository = isProductionD1()
  ? D1IntegrationRepository
  : PrismaIntegrationRepository;
