# Slayr — Table Ordering & Usher Flow

Diagrams are written in [Mermaid](https://mermaid.live). To preview, copy the code
**inside** a ```mermaid block (not the fences) into the live editor.

1. End-to-end journey
2. Sequence diagram (systems + people, with WhatsApp touchpoints)
3. Order status lifecycle
4. Admin setup (one-time per event)

---

## 1 · End-to-end journey

```mermaid
flowchart TD
    classDef guest  fill:#ede9fe,stroke:#7c3aed,stroke-width:1.5px,color:#3b0764;
    classDef system fill:#eff6ff,stroke:#2563eb,stroke-width:1.5px,color:#1e3a8a;
    classDef usher  fill:#fff7ed,stroke:#ea580c,stroke-width:1.5px,color:#7c2d12;
    classDef pay    fill:#ecfdf5,stroke:#059669,stroke-width:1.5px,color:#064e3b;
    classDef notify fill:#fdf2f8,stroke:#db2777,stroke-width:1px,color:#831843,stroke-dasharray:4 3;

    Start(["Guest seated at table"]):::guest

    subgraph ORDER["Placing the order"]
        direction TB
        Scan["Scan QR on the table"]:::guest
        Open["Menu opens, table number auto-filled"]:::system
        Build["Add items to cart"]:::guest
        Place["Tap Place Order"]:::guest
        Details["Enter name and phone, choose payment"]:::guest
    end

    Start --> Scan --> Open --> Build --> Place --> Details --> Method{"Payment method?"}

    subgraph PAYMENT["Payment"]
        direction TB
        Online["Pay online via Paystack"]:::pay
        Transfer["Bank transfer to event account"]:::pay
        POS["Pay at table, POS or cash"]:::pay
    end

    Method -->|Online| Online
    Method -->|Transfer| Transfer
    Method -->|POS / Cash| POS

    Online --> AutoPaid["Verified automatically, marked PAID"]:::system
    Transfer --> Await1["Order created, AWAITING PAYMENT"]:::system
    POS --> Await2["Order created, AWAITING PAYMENT"]:::system

    Await1 --> UsherConfirm["Usher confirms transfer received"]:::usher
    Await2 --> UsherCollect["Usher brings POS or collects cash"]:::usher
    UsherConfirm --> Review["Usher reviews order, taps Mark as Paid"]:::usher
    UsherCollect --> Review

    AutoPaid --> Kitchen["Kitchen prepares order"]:::system
    Review --> Kitchen
    Kitchen --> Serve["Usher serves to table"]:::usher
    Serve --> Done(["Order delivered"]):::guest

    AutoPaid -.->|WhatsApp| N1["Confirmation message"]:::notify
    Transfer -.->|WhatsApp| N2["Account details + summary"]:::notify
    Review -.->|WhatsApp| N3["Payment received"]:::notify
    Kitchen -.->|WhatsApp| N4["Being prepared"]:::notify
    Serve -.->|WhatsApp| N5["Served, enjoy"]:::notify
```

---

## 2 · Sequence — systems & people

```mermaid
sequenceDiagram
    autonumber
    actor G as Guest
    participant M as Slayr Menu
    participant PS as Paystack
    actor U as Usher
    participant LO as Live Orders
    participant WA as WhatsApp

    G->>M: Scan table QR, menu opens (table 7)
    G->>M: Add items, tap Place Order
    G->>M: Enter name and phone, choose method

    alt Pay online
        M->>PS: Open payment popup
        G->>PS: Complete payment
        PS-->>M: Success (server-verified)
        M->>LO: Create order, PAID
        M-->>WA: Confirmation to Guest
    else Bank transfer
        M->>LO: Create order, AWAITING PAYMENT
        M-->>WA: Account details and summary to Guest
        G->>U: Show transfer or receipt
        U->>LO: Review items, Mark as Paid
        LO-->>WA: Payment received to Guest
    else POS or Cash
        M->>LO: Create order, AWAITING PAYMENT
        U->>G: Bring POS or collect cash
        U->>LO: Review items, Mark as Paid
        LO-->>WA: Payment received to Guest
    end

    U->>LO: Advance status, Preparing then Served
    LO-->>WA: Status updates to Guest
    U->>G: Deliver order to table
```

---

## 3 · Order status lifecycle

```mermaid
stateDiagram-v2
    direction LR
    [*] --> Pending: Order placed (unpaid)
    [*] --> Confirmed: Paid online (auto)

    Pending --> Confirmed: Usher marks as paid
    Pending --> Cancelled: Cancelled
    Confirmed --> Preparing: Kitchen starts
    Preparing --> Served: Delivered to table
    Confirmed --> Cancelled: Cancelled
    Preparing --> Cancelled: Cancelled
    Served --> [*]
    Cancelled --> [*]

    note right of Pending
        payment_method = pos or transfer
        is_paid = false
    end note
    note right of Confirmed
        is_paid = true
        online verified, or usher confirmed
    end note
```

---

## 4 · Admin setup (one-time per event)

```mermaid
flowchart TD
    classDef admin fill:#eef2ff,stroke:#4f46e5,stroke-width:1.5px,color:#312e81;

    A["Create or open event"]:::admin --> B["Add menu categories and items"]:::admin
    B --> C["Mark a ticket type as table ticket"]:::admin
    C --> D["Generate tables and print QR codes"]:::admin
    D --> E["Configure payment methods"]:::admin
    E --> G["Online via Paystack"]:::admin
    E --> H["Bank transfer, validated account"]:::admin
    E --> I["POS or cash"]:::admin
    E --> J["Optional, staff WhatsApp alert number"]:::admin
    G --> K["Event ready, guests can order"]:::admin
    H --> K
    I --> K
    J --> K
```

---

### One-line brief for an usher

> Orders appear on the **Live Orders** screen in real time. If an order is already
> **Paid** (online), just prepare and serve it. If it says **Awaiting payment**, collect
> it at the table — POS, cash, or confirm the transfer — then review the items and tap
> **Mark as Paid**. Move each order through **Preparing → Served**. The guest is kept in
> the loop automatically over WhatsApp at every step.
```
