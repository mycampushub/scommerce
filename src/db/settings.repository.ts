import { queryFirst, execute, now, parseJSON, stringifyJSON } from '@/db/db';
import { Env, SiteSettings } from '@/db/types';

/**
 * Site Settings Repository
 * Manages dynamic configuration values
 */
export class SettingsRepository {
  /**
   * Get site settings
   */
  static async getSettings(env: Env | null): Promise<SiteSettings> {
    const settings = await queryFirst<SiteSettings>(
      env,
      'SELECT * FROM site_settings LIMIT 1'
    );

    // Return default settings if none exist
    if (!settings) {
      return this.getDefaultSettings();
    }

    // Parse JSON fields
    return {
      ...settings,
      socialMedia: settings.socialMedia ? parseJSON(settings.socialMedia) : null,
      seo: settings.seo ? parseJSON(settings.seo) : null,
    };
  }

  /**
   * Get default settings
   */
  static getDefaultSettings(): SiteSettings {
    return {
      id: 'default',
      siteName: 'SCommerce',
      siteLogo: null,
      currency: 'BDT',
      currencySymbol: '৳',
      taxRate: 0.18,
      freeShippingThreshold: 5000,
      baseShippingCost: 150,
      contactEmail: 'contact@scommerce.com',
      contactPhone: '+8801XXXXXXXXX',
      socialMedia: JSON.stringify({
        facebook: '',
        instagram: '',
        twitter: '',
        youtube: '',
      }),
      seo: JSON.stringify({
        metaTitle: 'SCommerce - Your Online Fashion Store',
        metaDescription: 'Discover the latest fashion trends at SCommerce. Shop sarees, salwar suits, lehengas, and more.',
        keywords: 'fashion, saree, salwar, lehenga, online shopping',
      }),
      createdAt: now(),
      updatedAt: now(),
    };
  }

  /**
   * Update settings
   */
  static async updateSettings(env: Env | null, data: Partial<SiteSettings>): Promise<SiteSettings> {
    // Check if settings exist
    const existing = await queryFirst<SiteSettings>(
      env,
      'SELECT * FROM site_settings LIMIT 1'
    );

    const settings = existing || this.getDefaultSettings();
    const updates: Partial<SiteSettings> = { ...settings, ...data };

    // Convert objects to JSON for storage
    const socialMediaJson = updates.socialMedia
      ? typeof updates.socialMedia === 'string'
        ? updates.socialMedia
        : stringifyJSON(updates.socialMedia)
      : null;
    const seoJson = updates.seo
      ? typeof updates.seo === 'string'
        ? updates.seo
        : stringifyJSON(updates.seo)
      : null;

    if (existing) {
      // Update existing settings
      await execute(
        env,
        `UPDATE site_settings
         SET siteName = ?, siteLogo = ?, currency = ?, currencySymbol = ?, taxRate = ?,
             freeShippingThreshold = ?, baseShippingCost = ?, contactEmail = ?, contactPhone = ?,
             socialMedia = ?, seo = ?, updatedAt = ?
         WHERE id = ?`,
        updates.siteName,
        updates.siteLogo || null,
        updates.currency,
        updates.currencySymbol,
        updates.taxRate,
        updates.freeShippingThreshold,
        updates.baseShippingCost,
        updates.contactEmail || null,
        updates.contactPhone || null,
        socialMediaJson,
        seoJson,
        now(),
        updates.id
      );
    } else {
      // Create new settings
      await execute(
        env,
        `INSERT INTO site_settings (id, siteName, siteLogo, currency, currencySymbol, taxRate,
             freeShippingThreshold, baseShippingCost, contactEmail, contactPhone,
             socialMedia, seo, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        updates.id,
        updates.siteName,
        updates.siteLogo || null,
        updates.currency,
        updates.currencySymbol,
        updates.taxRate,
        updates.freeShippingThreshold,
        updates.baseShippingCost,
        updates.contactEmail || null,
        updates.contactPhone || null,
        socialMediaJson,
        seoJson,
        now(),
        now()
      );
    }

    return (await this.getSettings(env));
  }
}

/**
 * Format currency using settings
 */
export function formatCurrency(amount: number, settings?: SiteSettings): string {
  const currencySymbol = settings?.currencySymbol || '৳';
  const formattedAmount = Math.abs(amount).toLocaleString('en-BD', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return amount < 0
    ? `-${currencySymbol}${formattedAmount}`
    : `${currencySymbol}${formattedAmount}`;
}

/**
 * Calculate tax using settings
 */
export function calculateTax(amount: number, settings?: SiteSettings): number {
  const taxRate = settings?.taxRate || 0.18;
  return amount * taxRate;
}

/**
 * Calculate shipping using settings
 */
export function calculateShipping(subtotal: number, settings?: SiteSettings): number {
  const freeShippingThreshold = settings?.freeShippingThreshold || 5000;
  const baseShippingCost = settings?.baseShippingCost || 150;

  // Free shipping for orders above threshold
  if (subtotal >= freeShippingThreshold) {
    return 0;
  }

  return baseShippingCost;
}

/**
 * Calculate total including tax and shipping
 */
export function calculateTotal(
  subtotal: number,
  settings?: SiteSettings
): {
  tax: number;
  shipping: number;
  total: number;
} {
  const tax = calculateTax(subtotal, settings);
  const shipping = calculateShipping(subtotal, settings);
  const total = subtotal + tax + shipping;

  return { tax, shipping, total };
}
