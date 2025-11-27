/**
 * Email Configuration and Utilities using Nodemailer
 * 
 * This module provides email sending capabilities for the application.
 * Supports multiple providers: Gmail, SendGrid, AWS SES, etc.
 * 
 * Setup:
 * 1. Install dependencies: npm install nodemailer
 * 2. Add environment variables to .env:
 *    - SMTP_HOST
 *    - SMTP_PORT
 *    - SMTP_USER
 *    - SMTP_PASSWORD
 *    - SMTP_FROM_EMAIL
 *    - SMTP_FROM_NAME
 */

import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

// Check if email is configured
export const isEmailConfigured = (): boolean => {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASSWORD &&
    process.env.SMTP_FROM_EMAIL
  );
};

// Create email transporter (singleton)
let transporterInstance: Transporter | null = null;

export const getEmailTransporter = (): Transporter => {
  if (!isEmailConfigured()) {
    throw new Error(
      'Email is not configured. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, and SMTP_FROM_EMAIL in your environment variables.'
    );
  }

  if (!transporterInstance) {
    transporterInstance = nodemailer.createTransport({
      host: process.env.SMTP_HOST!,
      port: parseInt(process.env.SMTP_PORT!, 10),
      secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER!,
        pass: process.env.SMTP_PASSWORD!,
      },
    });
  }

  return transporterInstance;
};

// Email sending interface
export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer | string;
  }>;
}

// Send email function
export async function sendEmail(options: SendEmailOptions): Promise<boolean> {
  if (!isEmailConfigured()) {
    console.warn('Email not configured. Email would have been sent to:', options.to);
    console.warn('Subject:', options.subject);
    return false;
  }

  try {
    const transporter = getEmailTransporter();
    
    const mailOptions = {
      from: {
        name: process.env.SMTP_FROM_NAME || 'Rental Management',
        address: process.env.SMTP_FROM_EMAIL!,
      },
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
      attachments: options.attachments,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${options.to}`);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

// Verify email configuration
export async function verifyEmailConfig(): Promise<boolean> {
  if (!isEmailConfigured()) {
    return false;
  }

  try {
    const transporter = getEmailTransporter();
    await transporter.verify();
    console.log('Email configuration verified successfully');
    return true;
  } catch (error) {
    console.error('Email configuration verification failed:', error);
    return false;
  }
}

// Configuration export
export const emailConfig = {
  isConfigured: isEmailConfigured(),
  host: process.env.SMTP_HOST || '',
  port: process.env.SMTP_PORT || '',
  fromEmail: process.env.SMTP_FROM_EMAIL || '',
  fromName: process.env.SMTP_FROM_NAME || 'Rental Management',
};
