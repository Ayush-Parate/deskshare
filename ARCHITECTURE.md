
# System Architecture

```text
Client / Postman / Frontend
            |
            v
       Express REST API
            |
     +------+------+
     |             |
 Middleware     Controllers
 JWT/Firebase    Business Logic
 Validation      Conflict Check
 Upload
     |             |
     +------+------+
            |
        Mongoose ODM
            |
            v
         MongoDB
            |
            +----------------------+
            |                      |
            v                      v
      User/Space/Booking     Membership Data

Firebase Admin SDK
        |
        +--> Firebase Authentication
        |
        +--> Firebase Storage
```

## Modules

1. Authentication module
2. Space management module
3. Booking module
4. Membership module
5. Image upload module
6. Validation/security middleware
7. Documentation and testing
