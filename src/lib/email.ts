import { logger } from './logger';

// Email configuration
const EMAIL_CONFIG = {
  // Set your email provider: 'resend' | 'sendgrid' | 'ses' | 'mock'
  provider: (process.env.EMAIL_PROVIDER as 'resend' | 'sendgrid' | 'ses' | 'mock') || 'mock',

  // Resend configuration
  resend: {
    apiKey: process.env.RESEND_API_KEY || '',
    from: process.env.EMAIL_FROM || 'noreply@scommerce.com',
  },

  // SendGrid configuration
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY || '',
    from: process.env.EMAIL_FROM || 'noreply@scommerce.com',
  },

  // AWS SES configuration
  ses: {
    region: process.env.AWS_REGION || 'us-east-1',
    from: process.env.EMAIL_FROM || 'noreply@scommerce.com',
  },

  // Mock configuration for development/testing
  mock: {
    from: process.env.EMAIL_FROM || 'noreply@scommerce.com',
  },
};

// Email interfaces
export interface EmailData {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface VerificationEmailData {
  to: string;
  name?: string;
  token: string;
}

export interface PasswordResetEmailData {
  to: string;
  name?: string;
  token: string;
}

export interface OrderConfirmationEmailData {
  to: string;
  name?: string;
  orderNumber: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  currency?: string;
}

/**
 * Mock email provider for development/testing
 */
async function sendMockEmail(data: EmailData): Promise<void> {
  logger.info('[Mock Email] Email would be sent', {
    to: data.to,
    subject: data.subject,
    provider: 'mock'
  });

  // In development, log the full email content for debugging
  if (process.env.NODE_ENV === 'development') {
    logger.debug('[Mock Email] Full email content', {
      from: data.from || EMAIL_CONFIG.resend.from,
      to: data.to,
      subject: data.subject,
      html: data.html.substring(0, 200) + '...', // Truncate for logs
    });
  }
}

/**
 * Send email using Resend
 */
async function sendResendEmail(data: EmailData): Promise<void> {
  if (!EMAIL_CONFIG.resend.apiKey) {
    throw new Error('RESEND_API_KEY is not configured. Falling back to mock email.');
  }

  // Dynamic import for Resend (only loaded when needed)
  const { Resend } = await import('resend');
  const resend = new Resend(EMAIL_CONFIG.resend.apiKey);

  const from = data.from || EMAIL_CONFIG.resend.from;

  await resend.emails.send({
    from,
    to: Array.isArray(data.to) ? data.to : [data.to],
    subject: data.subject,
    html: data.html,
    text: data.text,
    replyTo: data.replyTo,
  });

  logger.info('Email sent via Resend', {
    to: data.to,
    subject: data.subject,
  });
}

/**
 * Send email using SendGrid
 */
async function sendSendGridEmail(data: EmailData): Promise<void> {
  if (!EMAIL_CONFIG.sendgrid.apiKey) {
    throw new Error('SENDGRID_API_KEY is not configured. Falling back to mock email.');
  }

  // Dynamic import for SendGrid (only loaded when needed)
  const sgMailModule = await import('@sendgrid/mail');
  const sgMail = sgMailModule.default;
  sgMail.setApiKey(EMAIL_CONFIG.sendgrid.apiKey);

  const msg = {
    to: data.to,
    from: data.from || EMAIL_CONFIG.sendgrid.from,
    subject: data.subject,
    html: data.html,
    text: data.text,
    replyTo: data.replyTo,
  };

  await sgMail.send(msg);

  logger.info('Email sent via SendGrid', {
    to: data.to,
    subject: data.subject,
  });
}

/**
 * Send email using AWS SES
 */
async function sendSESEmail(data: EmailData): Promise<void> {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error('AWS credentials are not configured. Falling back to mock email.');
  }

  // Dynamic import for AWS SDK (only loaded when needed)
  const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses');

  const client = new SESClient({
    region: EMAIL_CONFIG.ses.region,
  });

  const command = new SendEmailCommand({
    Source: data.from || EMAIL_CONFIG.ses.from,
    Destination: {
      ToAddresses: Array.isArray(data.to) ? data.to : [data.to],
    },
    Message: {
      Subject: { Data: data.subject },
      Body: {
        Html: { Data: data.html },
        Text: { Data: data.text || '' },
      },
    },
  });

  await client.send(command);

  logger.info('Email sent via AWS SES', {
    to: data.to,
    subject: data.subject,
  });
}

/**
 * Main email sending function
 */
export async function sendEmail(data: EmailData): Promise<void> {
  try {
    switch (EMAIL_CONFIG.provider) {
      case 'resend':
        await sendResendEmail(data);
        break;
      case 'sendgrid':
        await sendSendGridEmail(data);
        break;
      case 'ses':
        await sendSESEmail(data);
        break;
      case 'mock':
      default:
        await sendMockEmail(data);
        break;
    }
  } catch (error) {
    logger.error('Failed to send email, falling back to mock', {
      error,
      provider: EMAIL_CONFIG.provider,
      to: data.to,
    });

    // Always fall back to mock in case of error
    await sendMockEmail(data);
  }
}

/**
 * Send email verification email
 */
export async function sendVerificationEmail(data: VerificationEmailData): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const verifyUrl = `${appUrl}/verify-email?token=${data.token}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Verify Your Email</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2563eb;">Welcome to SCommerce!</h1>
          <p>Hi ${data.name || 'there'},</p>
          <p>Thank you for signing up. Please verify your email address by clicking the button below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Verify Email</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${verifyUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't create an account, you can safely ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">© ${new Date().getFullYear()} SCommerce. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: data.to,
    subject: 'Verify your email address',
    html,
    text: `Welcome to SCommerce! Please verify your email by visiting: ${verifyUrl}`,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(data: PasswordResetEmailData): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const resetUrl = `${appUrl}/reset-password?token=${data.token}`;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Reset Your Password</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #dc2626;">Password Reset Request</h1>
          <p>Hi ${data.name || 'there'},</p>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
          </div>
          <p>Or copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <p>This link will expire in 1 hour.</p>
          <p style="color: #dc2626; font-weight: bold;">If you didn't request this password reset, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">© ${new Date().getFullYear()} SCommerce. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: data.to,
    subject: 'Reset your password',
    html,
    text: `Reset your password by visiting: ${resetUrl}`,
  });
}

/**
 * Send order confirmation email
 */
export async function sendOrderConfirmationEmail(data: OrderConfirmationEmailData): Promise<void> {
  const currency = data.currency || '₹';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmed</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #16a34a;">Order Confirmed!</h1>
          <p>Hi ${data.name || 'there'},</p>
          <p>Thank you for your order. We're processing it and will ship it soon.</p>
          
          <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="margin-top: 0; color: #374151;">Order #${data.orderNumber}</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="border-bottom: 2px solid #e5e7eb;">
                  <th style="text-align: left; padding: 10px;">Item</th>
                  <th style="text-align: center; padding: 10px;">Quantity</th>
                  <th style="text-align: right; padding: 10px;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${data.items.map(item => `
                  <tr style="border-bottom: 1px solid #e5e7eb;">
                    <td style="padding: 10px;">${item.name}</td>
                    <td style="text-align: center; padding: 10px;">${item.quantity}</td>
                    <td style="text-align: right; padding: 10px;">${currency}${item.price.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="2" style="text-align: right; padding: 15px 10px; font-weight: bold;">Total:</td>
                  <td style="text-align: right; padding: 15px 10px; font-weight: bold; color: #16a34a;">${currency}${data.total.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          <p>You'll receive a shipping confirmation email once your order ships.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">© ${new Date().getFullYear()} SCommerce. All rights reserved.</p>
        </div>
      </body>
    </html>
  `;

  await sendEmail({
    to: data.to,
    subject: `Order Confirmation - ${data.orderNumber}`,
    html,
    text: `Order #${data.orderNumber} confirmed. Total: ${currency}${data.total.toFixed(2)}`,
  });
}

/**
 * Get email provider status
 */
export function getEmailProviderStatus() {
  return {
    provider: EMAIL_CONFIG.provider,
    configured: {
      resend: !!EMAIL_CONFIG.resend.apiKey,
      sendgrid: !!EMAIL_CONFIG.sendgrid.apiKey,
      ses: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
    },
    from: EMAIL_CONFIG[EMAIL_CONFIG.provider]?.from || EMAIL_CONFIG.resend.from,
  };
}
