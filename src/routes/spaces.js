const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect, authorize } = require('../middleware/auth');
const { uploadImages } = require('../middleware/upload');
const c = require('../controllers/spaceController');

const createRules = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('type').isIn(['desk', 'meeting-room', 'private-office']).withMessage('Invalid type'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('capacity').isInt({ min: 1 }).withMessage('Capacity must be >= 1'),
  body('pricePerHour').isFloat({ min: 0 }).withMessage('pricePerHour must be >= 0'),
];

router.get('/', c.getSpaces);
router.get('/search', c.searchSpaces);          // must come before /:id
router.get('/:id', c.getSpace);
router.post('/', protect, authorize('owner', 'admin'), uploadImages, createRules, validate, c.createSpace);
router.put('/:id', protect, authorize('owner', 'admin'), uploadImages, c.updateSpace);

module.exports = router;
