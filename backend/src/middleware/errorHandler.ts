import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';

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

  if (req.url.includes('/hackrx/run') || req.url.includes('/transcribe')) {
    res.status(200).json({ 
      answers: ["Failed to process document. Please try again."] 
    });
    return;
  }

  res.status(500).json({ 
    error: "An error occurred while processing your request." 
  });
};
