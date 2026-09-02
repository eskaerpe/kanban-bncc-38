# Data Model Documentation — BNCC Proker Kanban

## ER Diagram

```mermaid
erDiagram
    USERS ||--o{ BOARD_MEMBERS : "belongs to"
    BOARDS ||--o{ BOARD_MEMBERS : "has"
    BOARDS ||--o{ CARDS : "contains"
    DIVISIONS ||--o{ CARDS : "tagged with"
    CARDS ||--o{ CARD_ASSIGNEES : "assigned to"
    USERS ||--o{ CARD_ASSIGNEES : "is assignee"
    CARDS ||--o{ CARD_ATTACHMENTS : "has"
    CARDS ||--o{ CARD_REVISIONS : "has notes"
    CARDS ||--o{ CARD_ACTIVITIES : "logs"
    USERS ||--o{ CARD_ACTIVITIES : "performed by"

    USERS {
        int id PK
        string email UK
        string password_hash
        string name
        enum global_role "GLOBAL_ADMIN, USER"
        datetime created_at
    }

    DIVISIONS {
        int id PK
        string name UK "e.g., Public Relations, Creative Team, Acara"
    }

    BOARDS {
        int id PK
        string title
        string description
        enum status "ACTIVE, ARCHIVED"
        int created_by FK
        datetime created_at
    }

    BOARD_MEMBERS {
        int id PK
        int board_id FK
        int user_id FK
        int division_id FK "nullable for C-Level/DPI"
        enum role "BOARD_ADMIN, KOOR_DIVISION, STAFF"
    }

    CARDS {
        int id PK
        int board_id FK
        int division_id FK
        string title
        text description
        enum status "TO_DO, ON_PROGRESS, ON_QC, REVISION, DONE"
        enum priority "LOW, MID, HIGH"
        datetime due_date
        int position
        datetime created_at
    }

    CARD_ASSIGNEES {
        int card_id FK
        int user_id FK
    }

    CARD_ATTACHMENTS {
        int id PK
        int card_id FK
        string title
        string url
        datetime created_at
    }

    CARD_REVISIONS {
        int id PK
        int card_id FK
        int user_id FK "author of note"
        text note
        datetime created_at
    }

    CARD_ACTIVITIES {
        int id PK
        int card_id FK
        int user_id FK
        string action_type "MOVE_STATUS, REVISION_ADDED, ASSIGNEE_ADDED, ETC"
        text description
        datetime created_at
    }
```

## Relasi & Constraint Rules
1. **UNIQUE(email)** pada tabel `USERS`.
2. **UNIQUE(board_id, user_id)** pada `BOARD_MEMBERS`.
3. **PRIMARY KEY(card_id, user_id)** pada `CARD_ASSIGNEES`.
4. **FOREIGN KEY Constraint CASCADE** saat Card atau Board dihapus.
