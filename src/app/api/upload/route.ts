import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { nanoid } from 'nanoid';
import { existsSync } from 'fs';

interface FileSystemError extends Error {
  code?: string;
  syscall?: string;
  path?: string;
}

// In a production environment, you'd use a service like S3 or Cloudinary
// This is a simplified implementation for demo purposes
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size exceeds 5MB limit' },
        { status: 400 }
      );
    }

    // Only allow certain file types
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'File type not allowed. Please upload an image (JPEG, PNG, GIF) or PDF.' },
        { status: 400 }
      );
    }

    // Create a unique file name
    const fileExtension = file.name.split('.').pop();
    const fileName = `${nanoid()}.${fileExtension}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Get directory paths
    const publicDir = join(process.cwd(), 'public');
    const uploadDir = join(publicDir, 'uploads');
    
    console.log('Current working directory:', process.cwd());
    console.log('Public directory path:', publicDir);
    console.log('Upload directory path:', uploadDir);
    
    // Create the public directory if it doesn't exist
    if (!existsSync(publicDir)) {
      console.log('Creating public directory...');
      await mkdir(publicDir, { recursive: true });
    }
    
    // Create the uploads directory if it doesn't exist
    if (!existsSync(uploadDir)) {
      console.log('Creating uploads directory...');
      await mkdir(uploadDir, { recursive: true });
    }
    
    // Write the file to the uploads directory
    const filePath = join(uploadDir, fileName);
    console.log('Writing file to:', filePath);
    await writeFile(filePath, buffer);
    
    console.log('File written successfully');
    
    // Return the URL to the uploaded file
    const fileUrl = `/uploads/${fileName}`;
    
    return NextResponse.json({ 
      success: true,
      fileUrl,
      fileName: file.name,
      fileType: file.type
    });
    
  } catch (error) {
    console.error('Error uploading file:', error);
    // Add more detailed error information
    const fsError = error as FileSystemError;
    const errorDetails = {
      message: fsError.message,
      code: fsError.code,
      syscall: fsError.syscall,
      path: fsError.path,
      stack: fsError.stack
    };
    return NextResponse.json(
      { 
        error: `Error uploading file: ${error}`,
        details: errorDetails
      },
      { status: 500 }
    );
  }
} 