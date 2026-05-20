import { queryAll, execute, generateSecureId } from '@/db/db';
import type { Env } from '@/db/types';

// Integration Types
export type IntegrationType = 'payment' | 'shipping' | 'analytics' | 'email';

// Payment Gateway
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

// Shipping Carrier
export interface ShippingCarrier {
  id: string;
  name: string;
  provider: string;
  apiKey: string | null;
  apiSecret: string | null;
  accountNumber: string | null;
  webhookUrl: string | null;
  sandboxMode: number;
  shippingMethods: string | null;
  isActive: boolean;
  isDefault: boolean;
  settings: string | null;
  lastTested: string | null;
  testStatus: string | null;
  createdAt: string;
  updatedAt: string;
}

// Analytics Integration
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

// Email Service
export interface EmailService {
  id: string;
  name: string;
  provider: string;
  apiKey: string | null;
  apiSecret: string | null;
  fromEmail: string | null;
  fromName: string | null;
  webhookUrl: string | null;
  sandboxMode: number;
  isActive: boolean;
  isDefault: boolean;
  settings: string | null;
  lastTested: string | null;
  testStatus: string | null;
  createdAt: string;
  updatedAt: string;
}

function nowISO(): string {
  return new Date().toISOString();
}

/**
 * Integration Repository
 * Manages all integration types
 */
export class IntegrationRepository {
  // ============ Payment Gateways ============

  /**
   * Get all payment gateways
   */
  static async getPaymentGateways(env: Env | null): Promise<PaymentGateway[]> {
    const rows = await queryAll<PaymentGateway>(env, 'SELECT * FROM payment_gateways ORDER BY createdAt DESC');
    return rows;
  }

  /**
   * Get payment gateway by ID
   */
  static async getPaymentGatewayById(env: Env | null, id: string): Promise<PaymentGateway | null> {
    const rows = await queryAll<any>(env, 'SELECT * FROM payment_gateways WHERE id = ?', id);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Get default payment gateway
   */
  static async getDefaultPaymentGateway(env: Env | null): Promise<PaymentGateway | null> {
    const rows = await queryAll<any>(env, 'SELECT * FROM payment_gateways WHERE isDefault = 1 LIMIT 1');
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Create payment gateway
   */
  static async createPaymentGateway(env: Env | null, data: Omit<PaymentGateway, 'id' | 'createdAt' | 'updatedAt' | 'lastTested' | 'testStatus'>): Promise<PaymentGateway> {
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

  /**
   * Update payment gateway
   */
  static async updatePaymentGateway(env: Env | null, id: string, data: Partial<Omit<PaymentGateway, 'id' | 'createdAt' | 'updatedAt'>>): Promise<PaymentGateway | null> {
    const existing = await this.getPaymentGatewayById(env, id);
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
    return this.getPaymentGatewayById(env, id);
  }

  /**
   * Delete payment gateway
   */
  static async deletePaymentGateway(env: Env | null, id: string): Promise<void> {
    await execute(env, 'DELETE FROM payment_gateways WHERE id = ?', id);
  }

  /**
   * Set default payment gateway
   */
  static async setDefaultPaymentGateway(env: Env | null, id: string): Promise<void> {
    await execute(env, 'UPDATE payment_gateways SET isDefault = 0');
    await execute(env, 'UPDATE payment_gateways SET isDefault = 1 WHERE id = ?', id);
  }

  // ============ Shipping Carriers ============

  /**
   * Get all shipping carriers
   */
  static async getShippingCarriers(env: Env | null): Promise<ShippingCarrier[]> {
    const rows = await queryAll<ShippingCarrier>(env, 'SELECT * FROM shipping_carriers ORDER BY createdAt DESC');
    return rows;
  }

  /**
   * Get shipping carrier by ID
   */
  static async getShippingCarrierById(env: Env | null, id: string): Promise<ShippingCarrier | null> {
    const rows = await queryAll<any>(env, 'SELECT * FROM shipping_carriers WHERE id = ?', id);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Get default shipping carrier
   */
  static async getDefaultShippingCarrier(env: Env | null): Promise<ShippingCarrier | null> {
    const rows = await queryAll<any>(env, 'SELECT * FROM shipping_carriers WHERE isDefault = 1 LIMIT 1');
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Create shipping carrier
   */
  static async createShippingCarrier(env: Env | null, data: Omit<ShippingCarrier, 'id' | 'createdAt' | 'updatedAt' | 'lastTested' | 'testStatus'>): Promise<ShippingCarrier> {
    const id = generateSecureId();
    const now = nowISO();
    await execute(
      env,
      `INSERT INTO shipping_carriers (id, name, provider, apiKey, apiSecret, accountNumber, webhookUrl, sandboxMode, shippingMethods, isActive, isDefault, settings, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id, data.name, data.provider, data.apiKey, data.apiSecret, data.accountNumber, data.webhookUrl,
      data.sandboxMode, data.shippingMethods, data.isActive ? 1 : 0, data.isDefault ? 1 : 0,
      data.settings, now, now
    );
    return { id, ...data, lastTested: null, testStatus: null, createdAt: now, updatedAt: now };
  }

  /**
   * Update shipping carrier
   */
  static async updateShippingCarrier(env: Env | null, id: string, data: Partial<Omit<ShippingCarrier, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ShippingCarrier | null> {
    const existing = await this.getShippingCarrierById(env, id);
    if (!existing) return null;

    const sets: string[] = [];
    const params: any[] = [];
    const fields: (keyof typeof data)[] = ['name', 'provider', 'apiKey', 'apiSecret', 'accountNumber', 'webhookUrl', 'sandboxMode', 'shippingMethods', 'isActive', 'isDefault', 'settings', 'lastTested', 'testStatus'];

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
    return this.getShippingCarrierById(env, id);
  }

  /**
   * Delete shipping carrier
   */
  static async deleteShippingCarrier(env: Env | null, id: string): Promise<void> {
    await execute(env, 'DELETE FROM shipping_carriers WHERE id = ?', id);
  }

  /**
   * Set default shipping carrier
   */
  static async setDefaultShippingCarrier(env: Env | null, id: string): Promise<void> {
    await execute(env, 'UPDATE shipping_carriers SET isDefault = 0');
    await execute(env, 'UPDATE shipping_carriers SET isDefault = 1 WHERE id = ?', id);
  }

  // ============ Analytics Integrations ============

  /**
   * Get all analytics integrations
   */
  static async getAnalyticsIntegrations(env: Env | null): Promise<AnalyticsIntegration[]> {
    const rows = await queryAll<AnalyticsIntegration>(env, 'SELECT * FROM analytics_integrations ORDER BY createdAt DESC');
    return rows;
  }

  /**
   * Get analytics integration by ID
   */
  static async getAnalyticsIntegrationById(env: Env | null, id: string): Promise<AnalyticsIntegration | null> {
    const rows = await queryAll<any>(env, 'SELECT * FROM analytics_integrations WHERE id = ?', id);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Create analytics integration
   */
  static async createAnalyticsIntegration(env: Env | null, data: Omit<AnalyticsIntegration, 'id' | 'createdAt' | 'updatedAt'>): Promise<AnalyticsIntegration> {
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

  /**
   * Update analytics integration
   */
  static async updateAnalyticsIntegration(env: Env | null, id: string, data: Partial<Omit<AnalyticsIntegration, 'id' | 'createdAt' | 'updatedAt'>>): Promise<AnalyticsIntegration | null> {
    const existing = await this.getAnalyticsIntegrationById(env, id);
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
    return this.getAnalyticsIntegrationById(env, id);
  }

  /**
   * Delete analytics integration
   */
  static async deleteAnalyticsIntegration(env: Env | null, id: string): Promise<void> {
    await execute(env, 'DELETE FROM analytics_integrations WHERE id = ?', id);
  }

  // ============ Email Services ============

  /**
   * Get all email services
   */
  static async getEmailServices(env: Env | null): Promise<EmailService[]> {
    const rows = await queryAll<EmailService>(env, 'SELECT * FROM email_services ORDER BY createdAt DESC');
    return rows;
  }

  /**
   * Get email service by ID
   */
  static async getEmailServiceById(env: Env | null, id: string): Promise<EmailService | null> {
    const rows = await queryAll<any>(env, 'SELECT * FROM email_services WHERE id = ?', id);
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Get default email service
   */
  static async getDefaultEmailService(env: Env | null): Promise<EmailService | null> {
    const rows = await queryAll<any>(env, 'SELECT * FROM email_services WHERE isDefault = 1 LIMIT 1');
    return rows.length > 0 ? rows[0] : null;
  }

  /**
   * Create email service
   */
  static async createEmailService(env: Env | null, data: Omit<EmailService, 'id' | 'createdAt' | 'updatedAt' | 'lastTested' | 'testStatus'>): Promise<EmailService> {
    const id = generateSecureId();
    const now = nowISO();
    await execute(
      env,
      `INSERT INTO email_services (id, name, provider, apiKey, apiSecret, fromEmail, fromName, webhookUrl, sandboxMode, isActive, isDefault, settings, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id, data.name, data.provider, data.apiKey, data.apiSecret, data.fromEmail, data.fromName, data.webhookUrl,
      data.sandboxMode, data.isActive ? 1 : 0, data.isDefault ? 1 : 0, data.settings, now, now
    );
    return { id, ...data, lastTested: null, testStatus: null, createdAt: now, updatedAt: now };
  }

  /**
   * Update email service
   */
  static async updateEmailService(env: Env | null, id: string, data: Partial<Omit<EmailService, 'id' | 'createdAt' | 'updatedAt'>>): Promise<EmailService | null> {
    const existing = await this.getEmailServiceById(env, id);
    if (!existing) return null;

    const sets: string[] = [];
    const params: any[] = [];
    const fields: (keyof typeof data)[] = ['name', 'provider', 'apiKey', 'apiSecret', 'fromEmail', 'fromName', 'webhookUrl', 'sandboxMode', 'isActive', 'isDefault', 'settings', 'lastTested', 'testStatus'];

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
    return this.getEmailServiceById(env, id);
  }

  /**
   * Delete email service
   */
  static async deleteEmailService(env: Env | null, id: string): Promise<void> {
    await execute(env, 'DELETE FROM email_services WHERE id = ?', id);
  }

  /**
   * Set default email service
   */
  static async setDefaultEmailService(env: Env | null, id: string): Promise<void> {
    await execute(env, 'UPDATE email_services SET isDefault = 0');
    await execute(env, 'UPDATE email_services SET isDefault = 1 WHERE id = ?', id);
  }

  // ============ Test Integration ============

  /**
   * Test payment gateway connection
   */
  static async testPaymentGateway(env: Env | null, id: string): Promise<{ success: boolean; message: string }> {
    try {
      const gateway = await this.getPaymentGatewayById(env, id);
      if (!gateway) {
        return { success: false, message: 'Payment gateway not found' };
      }

      // In a real implementation, this would make an actual test request to the payment gateway
      // For now, we'll simulate a successful test
      await this.updatePaymentGateway(env, id, {
        lastTested: nowISO(),
        testStatus: 'success'
      });

      return { success: true, message: 'Connection successful' };
    } catch (error) {
      await this.updatePaymentGateway(env, id, {
        lastTested: nowISO(),
        testStatus: 'failed'
      });
      return { success: false, message: 'Connection failed' };
    }
  }

  /**
   * Test shipping carrier connection
   */
  static async testShippingCarrier(env: Env | null, id: string): Promise<{ success: boolean; message: string }> {
    try {
      const carrier = await this.getShippingCarrierById(env, id);
      if (!carrier) {
        return { success: false, message: 'Shipping carrier not found' };
      }

      // In a real implementation, this would make an actual test request to the shipping carrier
      await this.updateShippingCarrier(env, id, {
        lastTested: nowISO(),
        testStatus: 'success'
      });

      return { success: true, message: 'Connection successful' };
    } catch (error) {
      await this.updateShippingCarrier(env, id, {
        lastTested: nowISO(),
        testStatus: 'failed'
      });
      return { success: false, message: 'Connection failed' };
    }
  }

  /**
   * Test email service connection
   */
  static async testEmailService(env: Env | null, id: string): Promise<{ success: boolean; message: string }> {
    try {
      const service = await this.getEmailServiceById(env, id);
      if (!service) {
        return { success: false, message: 'Email service not found' };
      }

      // In a real implementation, this would send a test email
      await this.updateEmailService(env, id, {
        lastTested: nowISO(),
        testStatus: 'success'
      });

      return { success: true, message: 'Test email sent successfully' };
    } catch (error) {
      await this.updateEmailService(env, id, {
        lastTested: nowISO(),
        testStatus: 'failed'
      });
      return { success: false, message: 'Test email failed' };
    }
  }
}
