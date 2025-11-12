import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import multer from 'multer';

export const globalErrorHandler: ErrorRequestHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('🚨 Error caught:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Handle Multer errors
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ 
        error: 'File too large. Maximum file size is 50MB.' 
      });
      return;
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      res.status(400).json({ 
        error: 'Unexpected file field. Please use "file" as the field name.' 
      });
      return;
    }
    res.status(400).json({ 
      error: `File upload error: ${error.message}` 
    });
    return;
  }

  // Handle custom file type errors
  if (error.message && error.message.includes('File type not allowed')) {
    res.status(400).json({ 
      error: error.message 
    });
    return;
  }

  res.status(500).json({ 
    error: "An error occurred while processing your request." 
  });
};
