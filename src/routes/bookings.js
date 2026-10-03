const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const c = require('../controllers/bookingController');

router.use(protect);
router.post('/', [
  body('space').isMongoId().withMessage('Valid space id required'),
  body('date').matches(/^\d{4}-\d{2}-\d{2}$/).withMessage('date must be YYYY-MM-DD'),
  body('startTime').matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage('startTime must be HH:mm'),
  body('endTime').matches(/^([01]\d|2[0-3]):[0-5]\d$/).withMessage('endTime must be HH:mm'),
  body('seats').optional().isInt({ min: 1 }).withMessage('seats must be >= 1'),
], validate, c.createBooking);
router.get('/:id', c.getBooking);
router.delete('/:id', c.cancelBooking);

module.exports = router;
