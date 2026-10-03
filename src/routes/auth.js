const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { register, login } = require('../controllers/authController');

router.post('/register', [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['user', 'owner']).withMessage('Role must be user or owner'),
], validate, register);

router.post('/login', [
  body('email').if(body('firebaseToken').not().exists()).isEmail().withMessage('Valid email required'),
  body('password').if(body('firebaseToken').not().exists()).notEmpty().withMessage('Password required'),
], validate, login);

module.exports = router;
