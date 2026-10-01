
const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validationMiddleware");
const { authenticate } = require("../middleware/authMiddleware");
const { createMembership, getUserMemberships } = require("../controllers/membershipController");

const router = express.Router();

/**
 * @swagger
 * /api/memberships:
 *   post:
 *     tags: [Memberships]
 *     security: [{ bearerAuth: [] }]
 *     summary: Purchase a monthly membership
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Membership'
 *     responses:
 *       201: { description: Membership purchased }
 */
router.post(
  "/",
  authenticate,
  [body("plan").isIn(["basic", "premium", "team"])],
  validate,
  createMembership
);

/**
 * @swagger
 * /api/memberships/user/{id}:
 *   get:
 *     tags: [Memberships]
 *     security: [{ bearerAuth: [] }]
 *     summary: Get memberships for a user
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Membership list }
 */
router.get("/user/:id", authenticate, getUserMemberships);

module.exports = router;
