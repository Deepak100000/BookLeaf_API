# BookLeaf Author Royalty API

A REST API for tracking author royalties, book sales, and withdrawal requests — built for the BookLeaf Publishing technical assignment.

## Tech Stack

**Node.js + Express** — lightweight, fast to scaffold, and excellent ecosystem support for REST APIs. In-memory storage keeps it simple and dependency-free (no DB setup required).

## Running Locally

```bash
npm install
npm start
# API available at http://localhost:3000
```

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/authors` | List all authors with earnings & balance |
| GET | `/authors/:id` | Author detail with books & sales breakdown |
| GET | `/authors/:id/sales` | All sales for an author (newest first) |
| POST | `/withdrawals` | Request a withdrawal |
| GET | `/authors/:id/withdrawals` | All withdrawals for an author |

### POST /withdrawals — Request Body

```json
{
  "author_id": 1,
  "amount": 2000
}
```

**Validation rules enforced:**
- Author must exist (404 if not)
- Minimum withdrawal: ₹500 (400 if below)
- Cannot exceed current balance (400 if over)

## Seed Data — Expected Starting Balances

| Author | Total Earnings |
|--------|---------------|
| Priya Sharma | ₹3,825 |
| Rahul Verma | ₹9,975 |
| Anita Desai | ₹400 |

## Assumptions

- Withdrawals are stored in-memory; they reset if the server restarts (acceptable for this assignment per the spec)
- `sale_date` is stored as a plain date string (`YYYY-MM-DD`) — no timezone complications
- All monetary values are integers (rupees, no paise)

## Deployment

Deployed on **Render** (free tier). First request after inactivity may take ~30 seconds to wake.

## Time Spent

~2 hours total: data modelling, endpoint logic, validation rules, and deployment.
