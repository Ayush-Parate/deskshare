
const swaggerJSDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "DeskShare Coworking Space Booking API",
      version: "1.0.0",
      description: "REST API for coworking spaces, bookings, memberships, JWT authentication and Firebase image uploads."
    },
    servers: [
      { url: "http://localhost:4000", description: "Local development server" }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            name: { type: "string", example: "Aarav Sharma" },
            email: { type: "string", example: "aarav@example.com" },
            role: { type: "string", enum: ["user", "owner", "admin"], example: "user" }
          }
        },
        Space: {
          type: "object",
          required: ["name", "type", "location", "pricePerHour", "capacity"],
          properties: {
            name: { type: "string", example: "Executive Meeting Room" },
            type: { type: "string", enum: ["desk", "meeting-room", "private-office", "conference-room", "hot-desk"] },
            description: { type: "string" },
            location: { type: "string", example: "Andheri East, Mumbai" },
            pricePerHour: { type: "number", example: 450 },
            capacity: { type: "integer", example: 8 },
            amenities: { type: "array", items: { type: "string" } },
            imageUrls: { type: "array", items: { type: "string" } },
            available: { type: "boolean", example: true }
          }
        },
        Booking: {
          type: "object",
          required: ["spaceId", "startTime", "endTime"],
          properties: {
            spaceId: { type: "string" },
            startTime: { type: "string", format: "date-time", example: "2026-10-05T10:00:00.000Z" },
            endTime: { type: "string", format: "date-time", example: "2026-10-05T12:00:00.000Z" },
            notes: { type: "string" }
          }
        },
        Membership: {
          type: "object",
          required: ["plan"],
          properties: {
            plan: { type: "string", enum: ["basic", "premium", "team"] },
            startDate: { type: "string", format: "date" },
            endDate: { type: "string", format: "date" },
            amount: { type: "number" },
            status: { type: "string", enum: ["active", "expired", "cancelled"] }
          }
        }
      }
    }
  },
  apis: ["./routes/*.js"]
};

module.exports = swaggerJSDoc(options);
