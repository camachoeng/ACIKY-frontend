# Accountant Module Backend Spec

## Overview
Track income and expenses for ACIKY. Confirmed donations auto-generate income entries.
Fund balance is split by currency (CUP, USD) with a configurable exchange rate for conversion.

## Database

### New table: `transactions`
- id INT AUTO_INCREMENT PRIMARY KEY
- type ENUM('income', 'expense') NOT NULL
- amount DECIMAL(12,2) NOT NULL — always positive
- currency ENUM('CUP', 'USD') NOT NULL
- category VARCHAR(200) NOT NULL — free text
- description TEXT — optional detail
- date DATE NOT NULL — actual transaction date (not created_at)
- donation_id INT NULL — FK to donations.id (SET NULL on delete), for auto-generated entries
- created_by INT NULL — FK to users.id (SET NULL on delete)
- created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

Indexes: date DESC, type, currency

## Settings (existing /api/settings)
- exchange_rate_usd_cup — float string, e.g. "520" (1 USD = N CUP)

## Endpoints

### GET /api/transactions (requireAuth, role instructor or admin)
List all transactions ordered by date DESC, then created_at DESC.

Query params:
- type: 'income' | 'expense' (optional, filter)
- currency: 'CUP' | 'USD' (optional, filter)
- month: 'YYYY-MM' (optional, filter by month)

Response:
```
{
  data: [...transactions],
  summary: {
    income_cup: number,
    income_usd: number,
    expense_cup: number,
    expense_usd: number,
    balance_cup: number,   // income_cup - expense_cup
    balance_usd: number    // income_usd - expense_usd
  }
}
```
Always return full summary regardless of filters (summary is always unfiltered totals).

### POST /api/transactions (requireAdmin)
Create a transaction.

Request body:
- type (required): 'income' | 'expense'
- amount (required): positive number
- currency (required): 'CUP' | 'USD'
- category (required): string max 200
- description (optional): string
- date (required): 'YYYY-MM-DD'

Response: `{ success: true, data: { id } }`
Errors: 400 if required fields missing or amount <= 0

### PUT /api/transactions/:id (requireAdmin)
Update a transaction. Same fields as POST, all optional (partial update supported).

Response: `{ success: true }`
Errors: 404 if not found

### DELETE /api/transactions/:id (requireAdmin)
Delete a transaction.

Response: `{ success: true }`
Errors: 404 if not found

## Auto-income from confirmed donations
When `PUT /api/donations/:id/status` sets status to 'confirmed':
- Check if a transaction with donation_id = id already exists — if yes, skip
- Create a transaction:
  - type: 'income'
  - amount: donation.amount
  - currency: donation.currency (map to CUP/USD; if neither, default to USD)
  - category: 'Donaciones'
  - description: 'Donación de ' + donation.name
  - date: today (CURRENT_DATE)
  - donation_id: donation.id
  - created_by: req.session.userId (or token user id)

## Architecture (Route → Controller → Service → Repository)

### transactionRepository
- create(data) — INSERT
- findAll({ type, currency, month }) — SELECT with optional filters, ORDER BY date DESC, created_at DESC
- getSummary() — SELECT SUM grouped by type and currency (unfiltered)
- findById(id) — SELECT by id
- update(id, data) — UPDATE provided fields only
- delete(id) — DELETE by id
- findByDonationId(donationId) — SELECT WHERE donation_id = ?

### transactionService
- createTransaction(data) — validates required fields, amount > 0, type/currency enums; calls repository.create()
- getTransactions(filters) — calls findAll + getSummary, returns combined
- updateTransaction(id, data) — validates, calls repository.update()
- deleteTransaction(id) — calls repository.delete()
- createFromDonation(donation, userId) — builds transaction data, checks duplicate via findByDonationId, calls createTransaction()

### transactionController
- list(req, res) — GET /api/transactions
- create(req, res) — POST /api/transactions
- update(req, res) — PUT /api/transactions/:id
- remove(req, res) — DELETE /api/transactions/:id

### routes/transactions.js
- GET / → requireAuth (instructor+admin), transactionController.list
- POST / → requireAdmin, transactionController.create
- PUT /:id → requireAdmin, transactionController.update
- DELETE /:id → requireAdmin, transactionController.remove

Mount at: app.use('/api/transactions', transactionsRouter)

### Update donationController.updateStatus
After setting status to 'confirmed', call:
  transactionService.createFromDonation(donation, userId)
Import transactionService in donationController.

## Database Todo
- Add transactions table with columns: id (PK AUTO_INCREMENT), type (ENUM income/expense), amount (DECIMAL 12,2), currency (ENUM CUP/USD), category (VARCHAR 200), description (TEXT NULL), date (DATE), donation_id (INT NULL FK donations.id SET NULL on delete), created_by (INT NULL FK users.id SET NULL on delete), created_at (TIMESTAMP DEFAULT NOW), updated_at (TIMESTAMP DEFAULT NOW ON UPDATE NOW)
- Add index on transactions.date
- Add index on transactions.type
