# User Flows & Screen Directory — BNCC Proker Kanban

## 1. User Flows (Mermaid Flowcharts)

### 1.1 Auth & Board Access Flow
```mermaid
flowchart TD
    Start([User Opens App]) --> LoginCheck{Has Valid JWT?}
    LoginCheck -->|No| LoginPage[Login Page: Email + Password]
    LoginPage -->|Authenticate| SetJWT[Store JWT Token]
    SetJWT --> DashboardPage[Dashboard Proker]
    LoginCheck -->|Yes| DashboardPage

    DashboardPage --> ProkerList[Fetch Active / Archived Boards]
    ProkerList --> SelectBoard[Select Board Proker]
    SelectBoard --> BoardView[View Kanban Board]
```

### 1.2 Card Creation & Editing Flow
```mermaid
flowchart TD
    BoardView[View Kanban Board] --> CreateCard[Click + Add Card in Column]
    CreateCard --> FillBasic[Input Title & Select Division Tag]
    FillBasic --> SaveCard[Card Created in TO DO]

    SaveCard --> OpenModal[Click Card -> Open Notion-Style Modal]
    OpenModal --> EditProperties[Edit Assignees, Priority, Due Date, Links, Description]

    EditProperties --> CheckEditPerm{Is Assignee OR Same Division OR Admin?}
    CheckEditPerm -->|Yes| SaveProperties[Save Card Changes & Log Activity]
    CheckEditPerm -->|No| ReadOnly[View Only Mode - Edit Disabled]
```

### 1.3 QC Approval & Revision Loop Flow
```mermaid
flowchart TD
    StaffDrag[Staff Moves Card to ON QC] --> QCScreen[Card in ON QC Column]

    QCScreen --> DragAttempt{User Drag Card to Done / Revision}
    DragAttempt --> CheckQCPerm{Is Koor Division / DPI Event / C-Level / Manager?}

    CheckQCPerm -->|No| RejectDrag[Action Blocked: Only Coordinators & Admin Can Review QC]

    CheckQCPerm -->|Yes| Decision{Target Column?}
    Decision -->|Done| MoveDone[Move to DONE Column + Log Activity]
    Decision -->|Revision| PromptNote[Open Modal: Catatan Revisi Required]

    PromptNote --> SubmitNote[Fill Note >= 5 chars & Submit]
    SubmitNote --> MoveRevision[Move to REVISION Column + Add Revision Record + Log Activity]

    MoveRevision --> StaffFix[Staff Division Reviews Note & Fixes Issue]
    StaffFix --> PullBack[Staff Moves Card Back to ON PROGRESS or ON QC]
```

---

## 2. Screen Directory

| Screen Name | Route | Core Components | Who Can Access | Data Required |
|---|---|---|---|---|
| **Login / Register** | `/login` | Form Email/Password, Submit Button | Public / Unauthenticated | User credentials |
| **Proker Dashboard** | `/` | Proker Grid Card, Filter (Active/Archived), Modal `+ New Board` | All Authenticated Users | User's Board List |
| **Kanban Board View** | `/board/:id` | Header, Filter Bar (Division, Priority), 5 Columns (`TO DO`, `On Progress`, `On QC`, `Revision`, `Done`) | Board Members + Global Admins | Board Details, Columns, Cards, Divisions |
| **Notion-Style Card Modal** | Overlay on `/board/:id` | Property List (Status, Assignees, Division, Priority, Due Date, Links), Description Editor, Catatan Revisi, Activity Log | Board Members | Card Detail, Assignees, Attachments, Revisions, Activities |
| **Board Settings / Team** | `/board/:id/settings` | Member List Table, Role Selector (`Board Admin`, `Koor Division`, `Staff`), Division Assign | Board Admin, DPI Event, C-Level, Manager | Board Members, Roles, Divisions |
