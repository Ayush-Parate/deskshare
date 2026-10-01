
# DeskShare ER Diagram

```mermaid
erDiagram
    USER ||--o{ SPACE : owns
    USER ||--o{ BOOKING : makes
    SPACE ||--o{ BOOKING : receives
    USER ||--o{ MEMBERSHIP : purchases

    USER {
        ObjectId _id PK
        string name
        string email UK
        string passwordHash
        string firebaseUid UK
        string role
        date createdAt
    }

    SPACE {
        ObjectId _id PK
        ObjectId owner FK
        string name
        string type
        string description
        string location
        number pricePerHour
        number capacity
        string[] amenities
        string[] imageUrls
        boolean available
    }

    BOOKING {
        ObjectId _id PK
        ObjectId user FK
        ObjectId space FK
        date startTime
        date endTime
        string status
        string notes
        number totalAmount
    }

    MEMBERSHIP {
        ObjectId _id PK
        ObjectId user FK
        string plan
        date startDate
        date endDate
        number amount
        string status
    }
```

## Relationship Summary

- One user/owner can own many spaces.
- One user can make many bookings.
- One space can receive many bookings.
- One user can purchase many memberships.
