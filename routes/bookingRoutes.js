
const express = require("express");
const { body } = require("express-validator");
const validate = require("../middleware/validationMiddleware");
const { authenticate } = require("../middleware/authMiddleware");
const { createBooking, getBooking, cancelBooking, getBookings } = require("../controllers/bookingController");

const router = express.Router();

/**
 * @swagger
 * /api/bookings:
 *   get:
 *     tags: [Bookings]
 *     security: [{ bearerAuth: [] }]
 *     summary: List bookings for current user or owner
 *     responses:
 *       200: { description: List of bookings }
 */
router.get("/", authenticate, getBookings);

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     tags: [Bookings]
 *     security: [{ bearerAuth: [] }]
 *     summary: Book a coworking space
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Booking'
 *     responses:
 *       201: { description: Booking created }
 *       409: { description: Booking conflict }
 */
router.post(
  "/",
  authenticate,
  [
    body("spaceId").isMongoId(),
    body("startTime").isISO8601(),
    body("endTime").isISO8601()
  ],
  validate,
  createBooking
);

/**
 * @swagger
 * /api/bookings/{id}:
 *   get:
 *     tags: [Bookings]
 *     security: [{ bearerAuth: [] }]
 *     summary: Get booking details
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Booking details }
 */
router.get("/:id", authenticate, getBooking);

/**
 * @swagger
 * /api/bookings/{id}:
 *   delete:
 *     tags: [Bookings]
 *     security: [{ bearerAuth: [] }]
 *     summary: Cancel a booking
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Booking cancelled }
 */
router.delete("/:id", authenticate, cancelBooking);

module.exports = router;
