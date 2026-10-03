const router = require('express').Router();
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const c = require('../controllers/membershipController');

router.get('/plans', c.listPlans);
router.post('/', protect, [body('plan').isIn(['basic', 'pro', 'premium']).withMessage('plan must be basic, pro or premium')], validate, c.purchase);
router.get('/user/:id', protect, c.getUserMemberships);

module.exports = router;
