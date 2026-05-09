import { getEnv } from '@/lib/cloudflare';
import { IntegrationRepository as PrismaIntegrationRepository } from './integration.repository';
import { D1IntegrationRepository } from './d1-integration-repository';

function isProductionD1(): boolean {
  try {
    const env = getEnv();
    return !!(env && env.DB);
  } catch {
    return false;
  }
}

export const IntegrationRepository = isProductionD1()
  ? D1IntegrationRepository
  : PrismaIntegrationRepository;
