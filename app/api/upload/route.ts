import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

// Configuration
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

/**
 * POST /api/upload
 * Upload photos for items
 * 
 * For now uses local storage in /public/uploads/tenant-{tenantId}/items/
 * Prepared for AWS S3 with segregation: s3://bucket/tenant-{tenantId}/items/{itemId}/
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth();
    const tenantId = session.user.tenant_id;

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;

    // LOCAL STORAGE (current implementation)
    const uploadDir = join(process.cwd(), 'public', 'uploads', `tenant-${tenantId}`, 'items');
    
    // Create directory if it doesn't exist
    await mkdir(uploadDir, { recursive: true });

    // Convert file to buffer and write
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = join(uploadDir, fileName);
    await writeFile(filePath, buffer);

    // Return public URL
    const publicUrl = `/uploads/tenant-${tenantId}/items/${fileName}`;

    return NextResponse.json({
      success: true,
      data: {
        url: publicUrl,
        fileName,
      },
      message: 'File uploaded successfully',
    });

    /* AWS S3 IMPLEMENTATION (commented for future use)
    
    // Install: npm install @aws-sdk/client-s3
    // import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
    
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    const bucketName = process.env.AWS_S3_BUCKET!;
    const s3Key = `tenant-${tenantId}/items/${fileName}`;

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
      Body: buffer,
      ContentType: file.type,
      // Make file publicly readable (optional)
      ACL: 'public-read',
    });

    await s3Client.send(command);

    // Return S3 URL
    const s3Url = `https://${bucketName}.s3.amazonaws.com/${s3Key}`;
    // Or use CloudFront URL: `https://${process.env.CLOUDFRONT_DOMAIN}/${s3Key}`

    return NextResponse.json({
      success: true,
      data: {
        url: s3Url,
        fileName,
      },
      message: 'File uploaded successfully to S3',
    });
    */

  } catch (error: any) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Failed to upload file', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/upload
 * Delete a photo
 * Query param: url (the photo URL to delete)
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth();
    const tenantId = session.user.tenant_id;

    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant not found' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const photoUrl = searchParams.get('url');

    if (!photoUrl) {
      return NextResponse.json(
        { error: 'Photo URL is required' },
        { status: 400 }
      );
    }

    // Verify the photo belongs to this tenant
    if (!photoUrl.includes(`tenant-${tenantId}`)) {
      return NextResponse.json(
        { error: 'Unauthorized to delete this photo' },
        { status: 403 }
      );
    }

    // LOCAL STORAGE (current implementation)
    const { unlink } = await import('fs/promises');
    const filePath = join(process.cwd(), 'public', photoUrl);
    
    try {
      await unlink(filePath);
    } catch (err) {
      // File might not exist, but that's ok
      console.log('File not found:', filePath);
    }

    return NextResponse.json({
      success: true,
      message: 'Photo deleted successfully',
    });

    /* AWS S3 IMPLEMENTATION (commented for future use)
    
    // import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
    
    const s3Client = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });

    const bucketName = process.env.AWS_S3_BUCKET!;
    
    // Extract S3 key from URL
    const s3Key = photoUrl.split('.com/')[1] || photoUrl;

    // Delete from S3
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: s3Key,
    });

    await s3Client.send(command);

    return NextResponse.json({
      success: true,
      message: 'Photo deleted successfully from S3',
    });
    */

  } catch (error: any) {
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { error: 'Failed to delete file', details: error.message },
      { status: 500 }
    );
  }
}
