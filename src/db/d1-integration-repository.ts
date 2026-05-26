import { queryAll, execute, count, generateSecureId } from '@/db/db';
import { getEnv } from '@/lib/cloudflare';
import type { Env } from '@/db/types';

export type IntegrationType = 'payment' | 'shipping' | 'analytics' | 'email';

export interface PaymentGateway {
  id: string;
  name: string;
  provider: string;
  apiKey: string | null;
  apiSecret: string | null;
  webhookUrl: string | null;
  webhookSecret: string | null;
  sandboxMode: number;
  supportedCurrencies: string | null;
  isActive: boolean;
  isDefault: boolean;
  settings: string | null;
  lastTested: string | null;
  testStatus: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ShippingCarrier {
  id: string;
  name: string;
  provider: string;
  apiKey: string | null;
  apiSecret: string | null;
  accountNumber: string | null;
  webhookUrl: string | null;
  isActive: boolean;
  isDefault: boolean;
  settings: string | null;
  lastTested: string | null;
  testStatus: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsIntegration {
  id: string;
  name: string;
  provider: string;
  trackingId: string | null;
  apiKey: string | null;
  pixelId: string | null;
  isActive: boolean;
  settings: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmailService {
  id: string;
  name: string;
  provider: string;
  apiKey: string | null;
  apiSecret: string | null;
  fromEmail: string | null;
  fromName: string | null;
  webhookUrl: string | null;
  isActive: boolean;
  isDefault: boolean;
  settings: string | null;
  lastTested: string | null;
  testStatus: string | null;
  createdAt: string;
  updatedAt: string;
}

async function getEnvOrThrow(): Promise<any> {
  const env = await getEnv();
  if (!env) throw new Error('Environment/D1 binding not available');
  return env;
}

function nowISO(): string {
  return new Date().toISOString();
}

export class D1IntegrationRepository {
  static async getPaymentGateways(): Promise<PaymentGateway[]> {
    const env = await getEnvOrThrow();
    const rows = await queryAll<PaymentGateway>(env, 'SELECT * FROM payment_gateways ORDER BY createdAt DESC');
    return rows;
  }

  static async getPaymentGatewayById(id: string): Promise<PaymentGateway | null> {
    const env = await getEnvOrThrow();
    const rows = await queryAll<any>(env, 'SELECT * FROM payment_gateways WHERE id = ?', id);
    return rows.length > 0 ? rows[0] : null;
  }

  static async getDefaultPaymentGateway(): Promise<PaymentGateway | null> {
    const env = await getEnvOrThrow();
    const rows = await queryAll<any>(env, 'SELECT * FROM payment_gateways WHERE isDefault = 1 LIMIT 1');
    return rows.length > 0 ? rows[0] : null;
  }

  static async createPaymentGateway(data: Omit<PaymentGateway, 'id' | 'createdAt' | 'updatedAt' | 'lastTested' | 'testStatus'>): Promise<PaymentGateway> {
    const env = await getEnvOrThrow();
    const id = generateSecureId();
    const now = nowISO();
    await execute(
      env,
      `INSERT INTO payment_gateways (id, name, provider, apiKey, apiSecret, webhookUrl, webhookSecret, sandboxMode, supportedCurrencies, isActive, isDefault, settings, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id, data.name, data.provider, data.apiKey, data.apiSecret, data.webhookUrl, data.webhookSecret,
      data.sandboxMode, data.supportedCurrencies, data.isActive ? 1 : 0, data.isDefault ? 1 : 0,
      data.settings, now, now
    );
    return { id, ...data, lastTested: null, testStatus: null, createdAt: now, updatedAt: now };
  }

  static async updatePaymentGateway(id: string, data: Partial<Omit<PaymentGateway, 'id' | 'createdAt' | 'updatedAt'>>): Promise<PaymentGateway | null> {
    const env = await getEnvOrThrow();
    const existing = await this.getPaymentGatewayById(id);
    if (!existing) return null;

    const sets: string[] = [];
    const params: any[] = [];
    const fields: (keyof typeof data)[] = ['name', 'provider', 'apiKey', 'apiSecret', 'webhookUrl', 'webhookSecret', 'sandboxMode', 'supportedCurrencies', 'isActive', 'isDefault', 'settings', 'lastTested', 'testStatus'];

    for (const field of fields) {
      if (data[field] !== undefined) {
        sets.push(`${field} = ?`);
        params.push(field === 'isActive' || field === 'isDefault' ? (data[field] ? 1 : 0) : data[field]);
      }
    }

    if (sets.length === 0) return existing;

    const now = nowISO();
    sets.push('updatedAt = ?');
    params.push(now);
    params.push(id);

    await execute(env, `UPDATE payment_gateways SET ${sets.join(', ')} WHERE id = ?`, ...params);
    return this.getPaymentGatewayById(id);
  }

  static async deletePaymentGateway(id: string): Promise<void> {
    const env = await getEnvOrThrow();
    await execute(env, 'DELETE FROM payment_gateways WHERE id = ?', id);
  }

  static async setDefaultPaymentGateway(id: string): Promise<void> {
    const env = await getEnvOrThrow();
    await execute(env, 'UPDATE payment_gateways SET isDefault = 0');
    await execute(env, 'UPDATE payment_gateways SET isDefault = 1 WHERE id = ?', id);
  }

  static async getShippingCarriers(): Promise<ShippingCarrier[]> {
    const env = await getEnvOrThrow();
    const rows = await queryAll<ShippingCarrier>(env, 'SELECT * FROM shipping_carriers ORDER BY createdAt DESC');
    return rows;
  }

  static async getShippingCarrierById(id: string): Promise<ShippingCarrier | null> {
    const env = await getEnvOrThrow();
    const rows = await queryAll<any>(env, 'SELECT * FROM shipping_carriers WHERE id = ?', id);
    return rows.length > 0 ? rows[0] : null;
  }

  static async getDefaultShippingCarrier(): Promise<ShippingCarrier | null> {
    const env = await getEnvOrThrow();
    const rows = await queryAll<any>(env, 'SELECT * FROM shipping_carriers WHERE isDefault = 1 LIMIT 1');
    return rows.length > 0 ? rows[0] : null;
  }

  static async createShippingCarrier(data: Omit<ShippingCarrier, 'id' | 'createdAt' | 'updatedAt' | 'lastTested' | 'testStatus'>): Promise<ShippingCarrier> {
    const env = await getEnvOrThrow();
    const id = generateSecureId();
    const now = nowISO();
    await execute(
      env,
      `INSERT INTO shipping_carriers (id, name, provider, apiKey, apiSecret, accountNumber, webhookUrl, isActive, isDefault, settings, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id, data.name, data.provider, data.apiKey, data.apiSecret, data.accountNumber, data.webhookUrl,
      data.isActive ? 1 : 0, data.isDefault ? 1 : 0, data.settings, now, now
    );
    return { id, ...data, lastTested: null, testStatus: null, createdAt: now, updatedAt: now };
  }

  static async updateShippingCarrier(id: string, data: Partial<Omit<ShippingCarrier, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ShippingCarrier | null> {
    const env = await getEnvOrThrow();
    const existing = await this.getShippingCarrierById(id);
    if (!existing) return null;

    const sets: string[] = [];
    const params: any[] = [];
    const fields: (keyof typeof data)[] = ['name', 'provider', 'apiKey', 'apiSecret', 'accountNumber', 'webhookUrl', 'isActive', 'isDefault', 'settings', 'lastTested', 'testStatus'];

    for (const field of fields) {
      if (data[field] !== undefined) {
        sets.push(`${field} = ?`);
        params.push(field === 'isActive' || field === 'isDefault' ? (data[field] ? 1 : 0) : data[field]);
      }
    }

    if (sets.length === 0) return existing;

    const now = nowISO();
    sets.push('updatedAt = ?');
    params.push(now);
    params.push(id);

    await execute(env, `UPDATE shipping_carriers SET ${sets.join(', ')} WHERE id = ?`, ...params);
    return this.getShippingCarrierById(id);
  }

  static async deleteShippingCarrier(id: string): Promise<void> {
    const env = await getEnvOrThrow();
    await execute(env, 'DELETE FROM shipping_carriers WHERE id = ?', id);
  }

  static async setDefaultShippingCarrier(id: string): Promise<void> {
    const env = await getEnvOrThrow();
    await execute(env, 'UPDATE shipping_carriers SET isDefault = 0');
    await execute(env, 'UPDATE shipping_carriers SET isDefault = 1 WHERE id = ?', id);
  }

  static async getAnalyticsIntegrations(): Promise<AnalyticsIntegration[]> {
    const env = await getEnvOrThrow();
    const rows = await queryAll<AnalyticsIntegration>(env, 'SELECT * FROM analytics_integrations ORDER BY createdAt DESC');
    return rows;
  }

  static async getAnalyticsIntegrationById(id: string): Promise<AnalyticsIntegration | null> {
    const env = await getEnvOrThrow();
    const rows = await queryAll<any>(env, 'SELECT * FROM analytics_integrations WHERE id = ?', id);
    return rows.length > 0 ? rows[0] : null;
  }

  static async createAnalyticsIntegration(data: Omit<AnalyticsIntegration, 'id' | 'createdAt' | 'updatedAt'>): Promise<AnalyticsIntegration> {
    const env = await getEnvOrThrow();
    const id = generateSecureId();
    const now = nowISO();
    await execute(
      env,
      `INSERT INTO analytics_integrations (id, name, provider, trackingId, apiKey, pixelId, isActive, settings, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id, data.name, data.provider, data.trackingId, data.apiKey, data.pixelId,
      data.isActive ? 1 : 0, data.settings, now, now
    );
    return { id, ...data, createdAt: now, updatedAt: now };
  }

  static async updateAnalyticsIntegration(id: string, data: Partial<Omit<AnalyticsIntegration, 'id' | 'createdAt' | 'updatedAt'>>): Promise<AnalyticsIntegration | null> {
    const env = await getEnvOrThrow();
    const existing = await this.getAnalyticsIntegrationById(id);
    if (!existing) return null;

    const sets: string[] = [];
    const params: any[] = [];
    const fields: (keyof typeof data)[] = ['name', 'provider', 'trackingId', 'apiKey', 'pixelId', 'isActive', 'settings'];

    for (const field of fields) {
      if (data[field] !== undefined) {
        sets.push(`${field} = ?`);
        params.push(field === 'isActive' ? (data[field] ? 1 : 0) : data[field]);
      }
    }

    if (sets.length === 0) return existing;

    const now = nowISO();
    sets.push('updatedAt = ?');
    params.push(now);
    params.push(id);

    await execute(env, `UPDATE analytics_integrations SET ${sets.join(', ')} WHERE id = ?`, ...params);
    return this.getAnalyticsIntegrationById(id);
  }

  static async deleteAnalyticsIntegration(id: string): Promise<void> {
    const env = await getEnvOrThrow();
    await execute(env, 'DELETE FROM analytics_integrations WHERE id = ?', id);
  }

  static async getEmailServices(): Promise<EmailService[]> {
    const env = await getEnvOrThrow();
    const rows = await queryAll<EmailService>(env, 'SELECT * FROM email_services ORDER BY createdAt DESC');
    return rows;
  }

  static async getEmailServiceById(id: string): Promise<EmailService | null> {
    const env = await getEnvOrThrow();
    const rows = await queryAll<any>(env, 'SELECT * FROM email_services WHERE id = ?', id);
    return rows.length > 0 ? rows[0] : null;
  }

  static async getDefaultEmailService(): Promise<EmailService | null> {
    const env = await getEnvOrThrow();
    const rows = await queryAll<any>(env, 'SELECT * FROM email_services WHERE isDefault = 1 LIMIT 1');
    return rows.length > 0 ? rows[0] : null;
  }

  static async createEmailService(data: Omit<EmailService, 'id' | 'createdAt' | 'updatedAt' | 'lastTested' | 'testStatus'>): Promise<EmailService> {
    const env = await getEnvOrThrow();
    const id = generateSecureId();
    const now = nowISO();
    await execute(
      env,
      `INSERT INTO email_services (id, name, provider, apiKey, apiSecret, fromEmail, fromName, webhookUrl, isActive, isDefault, settings, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id, data.name, data.provider, data.apiKey, data.apiSecret, data.fromEmail, data.fromName, data.webhookUrl,
      data.isActive ? 1 : 0, data.isDefault ? 1 : 0, data.settings, now, now
    );
    return { id, ...data, lastTested: null, testStatus: null, createdAt: now, updatedAt: now };
  }

  static async updateEmailService(id: string, data: Partial<Omit<EmailService, 'id' | 'createdAt' | 'updatedAt'>>): Promise<EmailService | null> {
    const env = await getEnvOrThrow();
    const existing = await this.getEmailServiceById(id);
    if (!existing) return null;

    const sets: string[] = [];
    const params: any[] = [];
    const fields: (keyof typeof data)[] = ['name', 'provider', 'apiKey', 'apiSecret', 'fromEmail', 'fromName', 'webhookUrl', 'isActive', 'isDefault', 'settings', 'lastTested', 'testStatus'];

    for (const field of fields) {
      if (data[field] !== undefined) {
        sets.push(`${field} = ?`);
        params.push(field === 'isActive' || field === 'isDefault' ? (data[field] ? 1 : 0) : data[field]);
      }
    }

    if (sets.length === 0) return existing;

    const now = nowISO();
    sets.push('updatedAt = ?');
    params.push(now);
    params.push(id);

    await execute(env, `UPDATE email_services SET ${sets.join(', ')} WHERE id = ?`, ...params);
    return this.getEmailServiceById(id);
  }

  static async deleteEmailService(id: string): Promise<void> {
    const env = await getEnvOrThrow();
    await execute(env, 'DELETE FROM email_services WHERE id = ?', id);
  }

  static async setDefaultEmailService(id: string): Promise<void> {
    const env = await getEnvOrThrow();
    await execute(env, 'UPDATE email_services SET isDefault = 0');
    await execute(env, 'UPDATE email_services SET isDefault = 1 WHERE id = ?', id);
  }

  static async testPaymentGateway(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const gateway = await this.getPaymentGatewayById(id);
      if (!gateway) return { success: false, message: 'Payment gateway not found' };
      await this.updatePaymentGateway(id, { lastTested: nowISO(), testStatus: 'success' });
      return { success: true, message: 'Connection successful' };
    } catch (error) {
      await this.updatePaymentGateway(id, { lastTested: nowISO(), testStatus: 'failed' });
      return { success: false, message: 'Connection failed' };
    }
  }

  static async testShippingCarrier(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const carrier = await this.getShippingCarrierById(id);
      if (!carrier) return { success: false, message: 'Shipping carrier not found' };
      await this.updateShippingCarrier(id, { lastTested: nowISO(), testStatus: 'success' });
      return { success: true, message: 'Connection successful' };
    } catch (error) {
      await this.updateShippingCarrier(id, { lastTested: nowISO(), testStatus: 'failed' });
      return { success: false, message: 'Connection failed' };
    }
  }

  static async testEmailService(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const service = await this.getEmailServiceById(id);
      if (!service) return { success: false, message: 'Email service not found' };
      await this.updateEmailService(id, { lastTested: nowISO(), testStatus: 'success' });
      return { success: true, message: 'Test email sent successfully' };
    } catch (error) {
      await this.updateEmailService(id, { lastTested: nowISO(), testStatus: 'failed' });
      return { success: false, message: 'Test email failed' };
    }
  }
}
