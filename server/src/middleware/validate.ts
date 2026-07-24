import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const handleValidationErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      error: 'Validation failed',
      details: errors.array().map(e => ({
        field: (e as any).path || (e as any).param,
        message: e.msg,
      })),
    });
    return;
  }
  next();
};

export const registerValidation = [
  body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  body('displayName')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Display name is required (1-100 characters)'),
  body('role')
    .optional()
    .isIn(['teacher', 'student'])
    .withMessage('Role must be teacher or student'),
  handleValidationErrors,
];

export const createClassValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title is required (1-200 characters)'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 5000 })
    .withMessage('Description must be under 5000 characters'),
  body('scheduledAt')
    .isISO8601()
    .withMessage('Valid ISO 8601 date is required'),
  body('duration')
    .isInt({ min: 1, max: 1440 })
    .withMessage('Duration must be between 1 and 1440 minutes'),
  body('recurring')
    .optional()
    .isIn(['none', 'daily', 'weekly', 'monthly'])
    .withMessage('Recurring must be none, daily, weekly, or monthly'),
  body('maxStudents')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Max students must be between 1 and 1000'),
  handleValidationErrors,
];

export const createAssignmentValidation = [
  body('classId').notEmpty().withMessage('Class ID is required'),
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title is required (1-200 characters)'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 10000 })
    .withMessage('Description must be under 10000 characters'),
  body('dueDate')
    .isISO8601()
    .withMessage('Valid ISO 8601 due date is required'),
  handleValidationErrors,
];

export const createAnnouncementValidation = [
  body('classId').notEmpty().withMessage('Class ID is required'),
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title is required (1-200 characters)'),
  body('content')
    .trim()
    .isLength({ min: 1, max: 10000 })
    .withMessage('Content is required (1-10000 characters)'),
  handleValidationErrors,
];
