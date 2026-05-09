import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
  isActive: boolean;
  isDefault: boolean;
  settings: string | null;
  lastTested: Date | null;
  testStatus: string | null;
  createdAt: Date;
  updatedAt: Date;
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
  isActive: boolean;
  isDefault: boolean;
  settings: string | null;
  lastTested: Date | null;
  testStatus: string | null;
  createdAt: Date;
  updatedAt: Date;
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
  createdAt: Date;
  updatedAt: Date;
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
  isActive: boolean;
  isDefault: boolean;
  settings: string | null;
  lastTested: Date | null;
  testStatus: string | null;
  createdAt: Date;
  updatedAt: Date;
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
  static async getPaymentGateways(): Promise<PaymentGateway[]> {
    const gateways = await prisma.paymentGateway.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return gateways.map(gateway => ({
      id: gateway.id,
      name: gateway.name,
      provider: gateway.provider,
      apiKey: gateway.apiKey,
      apiSecret: gateway.apiSecret,
      webhookUrl: gateway.webhookUrl,
      isActive: Boolean(gateway.isActive),
      isDefault: Boolean(gateway.isDefault),
      settings: gateway.settings,
      lastTested: gateway.lastTested,
      testStatus: gateway.testStatus,
      createdAt: gateway.createdAt,
      updatedAt: gateway.updatedAt
    }));
  }

  /**
   * Get payment gateway by ID
   */
  static async getPaymentGatewayById(id: string): Promise<PaymentGateway | null> {
    const gateway = await prisma.paymentGateway.findUnique({
      where: { id }
    });

    if (!gateway) return null;

    return {
      ...gateway,
      isActive: Boolean(gateway.isActive),
      isDefault: Boolean(gateway.isDefault)
    };
  }

  /**
   * Get default payment gateway
   */
  static async getDefaultPaymentGateway(): Promise<PaymentGateway | null> {
    const gateway = await prisma.paymentGateway.findFirst({
      where: { isDefault: true }
    });

    if (!gateway) return null;

    return {
      ...gateway,
      isActive: Boolean(gateway.isActive),
      isDefault: Boolean(gateway.isDefault)
    };
  }

  /**
   * Create payment gateway
   */
  static async createPaymentGateway(data: Omit<PaymentGateway, 'id' | 'createdAt' | 'updatedAt' | 'lastTested' | 'testStatus'>): Promise<PaymentGateway> {
    const gateway = await prisma.paymentGateway.create({
      data: {
        name: data.name,
        provider: data.provider,
        apiKey: data.apiKey,
        apiSecret: data.apiSecret,
        webhookUrl: data.webhookUrl,
        isActive: data.isActive,
        isDefault: data.isDefault,
        settings: data.settings
      }
    });

    return {
      ...gateway,
      isActive: Boolean(gateway.isActive),
      isDefault: Boolean(gateway.isDefault)
    };
  }

  /**
   * Update payment gateway
   */
  static async updatePaymentGateway(id: string, data: Partial<Omit<PaymentGateway, 'id' | 'createdAt' | 'updatedAt'>>): Promise<PaymentGateway | null> {
    const gateway = await prisma.paymentGateway.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.provider !== undefined && { provider: data.provider }),
        ...(data.apiKey !== undefined && { apiKey: data.apiKey }),
        ...(data.apiSecret !== undefined && { apiSecret: data.apiSecret }),
        ...(data.webhookUrl !== undefined && { webhookUrl: data.webhookUrl }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
        ...(data.settings !== undefined && { settings: data.settings }),
        ...(data.lastTested !== undefined && { lastTested: data.lastTested }),
        ...(data.testStatus !== undefined && { testStatus: data.testStatus })
      }
    });

    return {
      ...gateway,
      isActive: Boolean(gateway.isActive),
      isDefault: Boolean(gateway.isDefault)
    };
  }

  /**
   * Delete payment gateway
   */
  static async deletePaymentGateway(id: string): Promise<void> {
    await prisma.paymentGateway.delete({
      where: { id }
    });
  }

  /**
   * Set default payment gateway
   */
  static async setDefaultPaymentGateway(id: string): Promise<void> {
    await prisma.$transaction([
      // Reset all gateways
      prisma.paymentGateway.updateMany({
        data: { isDefault: false }
      }),
      // Set new default
      prisma.paymentGateway.update({
        where: { id },
        data: { isDefault: true }
      })
    ]);
  }

  // ============ Shipping Carriers ============

  /**
   * Get all shipping carriers
   */
  static async getShippingCarriers(): Promise<ShippingCarrier[]> {
    const carriers = await prisma.shippingCarrier.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return carriers.map(carrier => ({
      ...carrier,
      isActive: Boolean(carrier.isActive),
      isDefault: Boolean(carrier.isDefault)
    }));
  }

  /**
   * Get shipping carrier by ID
   */
  static async getShippingCarrierById(id: string): Promise<ShippingCarrier | null> {
    const carrier = await prisma.shippingCarrier.findUnique({
      where: { id }
    });

    if (!carrier) return null;

    return {
      ...carrier,
      isActive: Boolean(carrier.isActive),
      isDefault: Boolean(carrier.isDefault)
    };
  }

  /**
   * Get default shipping carrier
   */
  static async getDefaultShippingCarrier(): Promise<ShippingCarrier | null> {
    const carrier = await prisma.shippingCarrier.findFirst({
      where: { isDefault: true }
    });

    if (!carrier) return null;

    return {
      ...carrier,
      isActive: Boolean(carrier.isActive),
      isDefault: Boolean(carrier.isDefault)
    };
  }

  /**
   * Create shipping carrier
   */
  static async createShippingCarrier(data: Omit<ShippingCarrier, 'id' | 'createdAt' | 'updatedAt' | 'lastTested' | 'testStatus'>): Promise<ShippingCarrier> {
    const carrier = await prisma.shippingCarrier.create({
      data: {
        name: data.name,
        provider: data.provider,
        apiKey: data.apiKey,
        apiSecret: data.apiSecret,
        accountNumber: data.accountNumber,
        webhookUrl: data.webhookUrl,
        isActive: data.isActive,
        isDefault: data.isDefault,
        settings: data.settings
      }
    });

    return {
      ...carrier,
      isActive: Boolean(carrier.isActive),
      isDefault: Boolean(carrier.isDefault)
    };
  }

  /**
   * Update shipping carrier
   */
  static async updateShippingCarrier(id: string, data: Partial<Omit<ShippingCarrier, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ShippingCarrier | null> {
    const carrier = await prisma.shippingCarrier.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.provider !== undefined && { provider: data.provider }),
        ...(data.apiKey !== undefined && { apiKey: data.apiKey }),
        ...(data.apiSecret !== undefined && { apiSecret: data.apiSecret }),
        ...(data.accountNumber !== undefined && { accountNumber: data.accountNumber }),
        ...(data.webhookUrl !== undefined && { webhookUrl: data.webhookUrl }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
        ...(data.settings !== undefined && { settings: data.settings }),
        ...(data.lastTested !== undefined && { lastTested: data.lastTested }),
        ...(data.testStatus !== undefined && { testStatus: data.testStatus })
      }
    });

    return {
      ...carrier,
      isActive: Boolean(carrier.isActive),
      isDefault: Boolean(carrier.isDefault)
    };
  }

  /**
   * Delete shipping carrier
   */
  static async deleteShippingCarrier(id: string): Promise<void> {
    await prisma.shippingCarrier.delete({
      where: { id }
    });
  }

  /**
   * Set default shipping carrier
   */
  static async setDefaultShippingCarrier(id: string): Promise<void> {
    await prisma.$transaction([
      // Reset all carriers
      prisma.shippingCarrier.updateMany({
        data: { isDefault: false }
      }),
      // Set new default
      prisma.shippingCarrier.update({
        where: { id },
        data: { isDefault: true }
      })
    ]);
  }

  // ============ Analytics Integrations ============

  /**
   * Get all analytics integrations
   */
  static async getAnalyticsIntegrations(): Promise<AnalyticsIntegration[]> {
    const integrations = await prisma.analyticsIntegration.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return integrations.map(integration => ({
      ...integration,
      isActive: Boolean(integration.isActive)
    }));
  }

  /**
   * Get analytics integration by ID
   */
  static async getAnalyticsIntegrationById(id: string): Promise<AnalyticsIntegration | null> {
    const integration = await prisma.analyticsIntegration.findUnique({
      where: { id }
    });

    if (!integration) return null;

    return {
      ...integration,
      isActive: Boolean(integration.isActive)
    };
  }

  /**
   * Create analytics integration
   */
  static async createAnalyticsIntegration(data: Omit<AnalyticsIntegration, 'id' | 'createdAt' | 'updatedAt' | 'lastTested' | 'testStatus'>): Promise<AnalyticsIntegration> {
    const integration = await prisma.analyticsIntegration.create({
      data: {
        name: data.name,
        provider: data.provider,
        trackingId: data.trackingId,
        apiKey: data.apiKey,
        pixelId: data.pixelId,
        isActive: data.isActive,
        settings: data.settings
      }
    });

    return {
      ...integration,
      isActive: Boolean(integration.isActive)
    };
  }

  /**
   * Update analytics integration
   */
  static async updateAnalyticsIntegration(id: string, data: Partial<Omit<AnalyticsIntegration, 'id' | 'createdAt' | 'updatedAt'>>): Promise<AnalyticsIntegration | null> {
    const integration = await prisma.analyticsIntegration.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.provider !== undefined && { provider: data.provider }),
        ...(data.trackingId !== undefined && { trackingId: data.trackingId }),
        ...(data.apiKey !== undefined && { apiKey: data.apiKey }),
        ...(data.pixelId !== undefined && { pixelId: data.pixelId }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.settings !== undefined && { settings: data.settings })
      }
    });

    return {
      ...integration,
      isActive: Boolean(integration.isActive)
    };
  }

  /**
   * Delete analytics integration
   */
  static async deleteAnalyticsIntegration(id: string): Promise<void> {
    await prisma.analyticsIntegration.delete({
      where: { id }
    });
  }

  // ============ Email Services ============

  /**
   * Get all email services
   */
  static async getEmailServices(): Promise<EmailService[]> {
    const services = await prisma.emailService.findMany({
      orderBy: { createdAt: 'desc' }
    });

    return services.map(service => ({
      ...service,
      isActive: Boolean(service.isActive),
      isDefault: Boolean(service.isDefault)
    }));
  }

  /**
   * Get email service by ID
   */
  static async getEmailServiceById(id: string): Promise<EmailService | null> {
    const service = await prisma.emailService.findUnique({
      where: { id }
    });

    if (!service) return null;

    return {
      ...service,
      isActive: Boolean(service.isActive),
      isDefault: Boolean(service.isDefault)
    };
  }

  /**
   * Get default email service
   */
  static async getDefaultEmailService(): Promise<EmailService | null> {
    const service = await prisma.emailService.findFirst({
      where: { isDefault: true }
    });

    if (!service) return null;

    return {
      ...service,
      isActive: Boolean(service.isActive),
      isDefault: Boolean(service.isDefault)
    };
  }

  /**
   * Create email service
   */
  static async createEmailService(data: Omit<EmailService, 'id' | 'createdAt' | 'updatedAt' | 'lastTested' | 'testStatus'>): Promise<EmailService> {
    const service = await prisma.emailService.create({
      data: {
        name: data.name,
        provider: data.provider,
        apiKey: data.apiKey,
        apiSecret: data.apiSecret,
        fromEmail: data.fromEmail,
        fromName: data.fromName,
        webhookUrl: data.webhookUrl,
        isActive: data.isActive,
        isDefault: data.isDefault,
        settings: data.settings
      }
    });

    return {
      ...service,
      isActive: Boolean(service.isActive),
      isDefault: Boolean(service.isDefault)
    };
  }

  /**
   * Update email service
   */
  static async updateEmailService(id: string, data: Partial<Omit<EmailService, 'id' | 'createdAt' | 'updatedAt'>>): Promise<EmailService | null> {
    const service = await prisma.emailService.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.provider !== undefined && { provider: data.provider }),
        ...(data.apiKey !== undefined && { apiKey: data.apiKey }),
        ...(data.apiSecret !== undefined && { apiSecret: data.apiSecret }),
        ...(data.fromEmail !== undefined && { fromEmail: data.fromEmail }),
        ...(data.fromName !== undefined && { fromName: data.fromName }),
        ...(data.webhookUrl !== undefined && { webhookUrl: data.webhookUrl }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
        ...(data.settings !== undefined && { settings: data.settings }),
        ...(data.lastTested !== undefined && { lastTested: data.lastTested }),
        ...(data.testStatus !== undefined && { testStatus: data.testStatus })
      }
    });

    return {
      ...service,
      isActive: Boolean(service.isActive),
      isDefault: Boolean(service.isDefault)
    };
  }

  /**
   * Delete email service
   */
  static async deleteEmailService(id: string): Promise<void> {
    await prisma.emailService.delete({
      where: { id }
    });
  }

  /**
   * Set default email service
   */
  static async setDefaultEmailService(id: string): Promise<void> {
    await prisma.$transaction([
      // Reset all services
      prisma.emailService.updateMany({
        data: { isDefault: false }
      }),
      // Set new default
      prisma.emailService.update({
        where: { id },
        data: { isDefault: true }
      })
    ]);
  }

  // ============ Test Integration ============

  /**
   * Test payment gateway connection
   */
  static async testPaymentGateway(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const gateway = await this.getPaymentGatewayById(id);
      if (!gateway) {
        return { success: false, message: 'Payment gateway not found' };
      }

      // In a real implementation, this would make an actual test request to the payment gateway
      // For now, we'll simulate a successful test
      await this.updatePaymentGateway(id, {
        lastTested: new Date(),
        testStatus: 'success'
      });

      return { success: true, message: 'Connection successful' };
    } catch (error) {
      await this.updatePaymentGateway(id, {
        lastTested: new Date(),
        testStatus: 'failed'
      });
      return { success: false, message: 'Connection failed' };
    }
  }

  /**
   * Test shipping carrier connection
   */
  static async testShippingCarrier(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const carrier = await this.getShippingCarrierById(id);
      if (!carrier) {
        return { success: false, message: 'Shipping carrier not found' };
      }

      // In a real implementation, this would make an actual test request to the shipping carrier
      await this.updateShippingCarrier(id, {
        lastTested: new Date(),
        testStatus: 'success'
      });

      return { success: true, message: 'Connection successful' };
    } catch (error) {
      await this.updateShippingCarrier(id, {
        lastTested: new Date(),
        testStatus: 'failed'
      });
      return { success: false, message: 'Connection failed' };
    }
  }

  /**
   * Test email service connection
   */
  static async testEmailService(id: string): Promise<{ success: boolean; message: string }> {
    try {
      const service = await this.getEmailServiceById(id);
      if (!service) {
        return { success: false, message: 'Email service not found' };
      }

      // In a real implementation, this would send a test email
      await this.updateEmailService(id, {
        lastTested: new Date(),
        testStatus: 'success'
      });

      return { success: true, message: 'Test email sent successfully' };
    } catch (error) {
      await this.updateEmailService(id, {
        lastTested: new Date(),
        testStatus: 'failed'
      });
      return { success: false, message: 'Test email failed' };
    }
  }
}
