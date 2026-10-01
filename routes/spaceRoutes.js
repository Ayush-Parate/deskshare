
const express = require("express");
const { body } = require("express-validator");
const { authenticate, authorize } = require("../middleware/authMiddleware");
const validate = require("../middleware/validationMiddleware");
const upload = require("../middleware/uploadMiddleware");
const {
  getSpaces, getSpace, createSpace, updateSpace, deleteSpace, searchSpaces
} = require("../controllers/spaceController");

const router = express.Router();

/**
 * @swagger
 * /api/spaces:
 *   get:
 *     tags: [Spaces]
 *     summary: List available spaces
 *     responses:
 *       200: { description: Successful response }
 */
router.get("/", getSpaces);

/**
 * @swagger
 * /api/spaces/search:
 *   get:
 *     tags: [Spaces]
 *     summary: Search spaces
 *     parameters:
 *       - in: query
 *         name: keyword
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Search results }
 */
router.get("/search", searchSpaces);

/**
 * @swagger
 * /api/spaces/{id}:
 *   get:
 *     tags: [Spaces]
 *     summary: Get a space
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Space details }
 *       404: { description: Not found }
 */
router.get("/:id", getSpace);

/**
 * @swagger
 * /api/spaces:
 *   post:
 *     tags: [Spaces]
 *     security: [{ bearerAuth: [] }]
 *     summary: Create a coworking space
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [name, type, location, pricePerHour, capacity]
 *             properties:
 *               name: { type: string }
 *               type: { type: string }
 *               description: { type: string }
 *               location: { type: string }
 *               pricePerHour: { type: number }
 *               capacity: { type: integer }
 *               amenities: { type: string }
 *               images:
 *                 type: array
 *                 items: { type: string, format: binary }
 *     responses:
 *       201: { description: Space created }
 */
router.post(
  "/",
  authenticate,
  authorize("owner", "admin"),
  upload.array("images", 8),
  [
    body("name").trim().notEmpty(),
    body("type").isIn(["desk", "meeting-room", "private-office", "conference-room", "hot-desk"]),
    body("location").trim().notEmpty(),
    body("pricePerHour").isFloat({ min: 0 }),
    body("capacity").isInt({ min: 1 })
  ],
  validate,
  createSpace
);

/**
 * @swagger
 * /api/spaces/{id}:
 *   put:
 *     tags: [Spaces]
 *     security: [{ bearerAuth: [] }]
 *     summary: Update a coworking space
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Space updated }
 */
router.put("/:id", authenticate, authorize("owner", "admin"), upload.array("images", 8), updateSpace);

/**
 * @swagger
 * /api/spaces/{id}:
 *   delete:
 *     tags: [Spaces]
 *     security: [{ bearerAuth: [] }]
 *     summary: Delete a coworking space
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200: { description: Space deleted }
 */
router.delete("/:id", authenticate, authorize("owner", "admin"), deleteSpace);

module.exports = router;
