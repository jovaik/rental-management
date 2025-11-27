/**
 * AWS S3 Configuration for Multi-Tenant File Storage
 * 
 * This module provides configuration and utilities for AWS S3 storage.
 * Files are organized by tenant: s3://bucket/tenant-{tenantId}/items/
 * 
 * Setup:
 * 1. Install AWS SDK: npm install @aws-sdk/client-s3
 * 2. Add environment variables to .env:
 *    - AWS_REGION
 *    - AWS_ACCESS_KEY_ID
 *    - AWS_SECRET_ACCESS_KEY
 *    - AWS_S3_BUCKET
 *    - AWS_CLOUDFRONT_DOMAIN (optional, for CDN)
 * 3. Uncomment S3 code in /app/api/upload/route.ts
 */

import { S3Client } from '@aws-sdk/client-s3';

// Check if S3 is configured
export const isS3Configured = (): boolean => {
  return !!(
    process.env.AWS_REGION &&
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY &&
    process.env.AWS_S3_BUCKET
  );
};

// Create S3 Client (singleton)
let s3ClientInstance: S3Client | null = null;

export const getS3Client = (): S3Client => {
  if (!isS3Configured()) {
    throw new Error(
      'AWS S3 is not configured. Please set AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_BUCKET in your environment variables.'
    );
  }

  if (!s3ClientInstance) {
    s3ClientInstance = new S3Client({
      region: process.env.AWS_REGION!,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  return s3ClientInstance;
};

// Get S3 bucket name
export const getS3Bucket = (): string => {
  if (!process.env.AWS_S3_BUCKET) {
    throw new Error('AWS_S3_BUCKET is not configured');
  }
  return process.env.AWS_S3_BUCKET;
};

// Build S3 key for tenant-isolated storage
export const buildS3Key = (tenantId: string, category: 'items' | 'documents', fileName: string): string => {
  return `tenant-${tenantId}/${category}/${fileName}`;
};

// Get public URL for S3 object
export const getS3Url = (key: string): string => {
  const bucket = getS3Bucket();
  const region = process.env.AWS_REGION || 'us-east-1';
  
  // Use CloudFront domain if configured (recommended for production)
  if (process.env.AWS_CLOUDFRONT_DOMAIN) {
    return `https://${process.env.AWS_CLOUDFRONT_DOMAIN}/${key}`;
  }
  
  // Otherwise use direct S3 URL
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
};

// Extract S3 key from URL
export const extractS3Key = (url: string): string => {
  // Handle CloudFront URLs
  if (process.env.AWS_CLOUDFRONT_DOMAIN && url.includes(process.env.AWS_CLOUDFRONT_DOMAIN)) {
    return url.split(`${process.env.AWS_CLOUDFRONT_DOMAIN}/`)[1] || url;
  }
  
  // Handle direct S3 URLs
  if (url.includes('.s3.')) {
    return url.split('.com/')[1] || url;
  }
  
  // If it's already a key, return as is
  return url;
};

// Configuration export
export const s3Config = {
  isConfigured: isS3Configured(),
  region: process.env.AWS_REGION || 'us-east-1',
  bucket: process.env.AWS_S3_BUCKET || '',
  cloudFrontDomain: process.env.AWS_CLOUDFRONT_DOMAIN || '',
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
};
