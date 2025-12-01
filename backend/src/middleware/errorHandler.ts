import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import multer from 'multer';
import { AppError } from '../types/errors';
import { logger } from '../utils/logger.util';

export const globalErrorHandler: ErrorRequestHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.error('GlobalErrorHandler', 'Error caught in global handler', error, {
    url: req.url,
    method: req.method,
    userId: (req as any).user?.userId,
    body: req.body,
  });

  const origin = process.env.FRONTEND_ORIGIN || 'https://cosmicengine.arpantaneja.dev';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (error instanceof multer.MulterError) {
    logger.warn('GlobalErrorHandler', 'Multer error occurred', { code: error.code, message: error.message });
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

  if (error.message && error.message.includes('File type not allowed')) {
    logger.warn('GlobalErrorHandler', 'File type validation error', { message: error.message });
    res.status(400).json({ 
      error: error.message 
    });
    return;
  }

  if (error instanceof AppError) {
    const statusCode = error.statusCode || 500;
    const clientMessage = error.shouldExposeToClient 
      ? (error.clientMessage || error.message) 
      : 'Processing failed! The server might be overloaded, please try again later.';
    
    res.status(statusCode).json({ 
      error: clientMessage 
    });
    return;
  }

  logger.error('GlobalErrorHandler', 'Unhandled error', error);
  res.status(500).json({ 
    error: 'Processing failed! The server might be overloaded, please try again later.' 
  });
};
