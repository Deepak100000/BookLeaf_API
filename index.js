const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// ─── Seed Data ────────────────────────────────────────────────────────────────

const authors = [
  { id: 1, name: "Priya Sharma",  email: "priya@email.com",  bank_account: "1234567890", ifsc: "HDFC0001234" },
  { id: 2, name: "Rahul Verma",   email: "rahul@email.com",  bank_account: "0987654321", ifsc: "ICIC0005678" },
  { id: 3, name: "Anita Desai",   email: "anita@email.com",  bank_account: "5678901234", ifsc: "SBIN0009012" },
];

const books = [
  { id: 1, title: "The Silent River",    author_id: 1, royalty_per_sale: 45 },
  { id: 2, title: "Midnight in Mumbai",  author_id: 1, royalty_per_sale: 60 },
  { id: 3, title: "Code & Coffee",       author_id: 2, royalty_per_sale: 75 },
  { id: 4, title: "Startup Diaries",     author_id: 2, royalty_per_sale: 50 },
  { id: 5, title: "Poetry of Pain",      author_id: 2, royalty_per_sale: 30 },
  { id: 6, title: "Garden of Words",     author_id: 3, royalty_per_sale: 40 },
];

const sales = [
  { id: 1,  book_id: 1, quantity: 25, sale_date: "2025-01-05" },
  { id: 2,  book_id: 1, quantity: 40, sale_date: "2025-01-12" },
  { id: 3,  book_id: 2, quantity: 15, sale_date: "2025-01-08" },
  { id: 4,  book_id: 3, quantity: 60, sale_date: "2025-01-03" },
  { id: 5,  book_id: 3, quantity: 45, sale_date: "2025-01-15" },
  { id: 6,  book_id: 4, quantity: 30, sale_date: "2025-01-10" },
  { id: 7,  book_id: 5, quantity: 20, sale_date: "2025-01-18" },
  { id: 8,  book_id: 6, quantity: 10, sale_date: "2025-01-20" },
];

// Withdrawals stored in memory; grows as POST /withdrawals is called
const withdrawals = [];
let nextWithdrawalId = 1;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTotalEarnings(authorId) {
  const authorBooks = books.filter((b) => b.author_id === authorId);
  return authorBooks.reduce((sum, book) => {
    const bookSales = sales.filter((s) => s.book_id === book.id);
    const bookTotal = bookSales.reduce((s, sale) => s + sale.quantity * book.royalty_per_sale, 0);
    return sum + bookTotal;
  }, 0);
}

function getTotalWithdrawn(authorId) {
  return withdrawals
    .filter((w) => w.author_id === authorId)
    .reduce((sum, w) => sum + w.amount, 0);
}

function getCurrentBalance(authorId) {
  return getTotalEarnings(authorId) - getTotalWithdrawn(authorId);
}

function findAuthor(id) {
  return authors.find((a) => a.id === parseInt(id, 10));
}

// ─── Routes ──────────────────────────────────────────────────────────────────

// Root route for health check
app.get("/", (req, res) => {
  res.json({
    message: "BookLeaf API is running",
    endpoints: [
      "GET /authors",
      "GET /authors/:id",
      "GET /authors/:id/sales",
      "POST /withdrawals",
      "GET /authors/:id/withdrawals"
    ]
  });
});

// 1. GET /authors
app.get("/authors", (req, res) => {
  const result = authors.map((author) => ({
    id: author.id,
    name: author.name,
    total_earnings: getTotalEarnings(author.id),
    current_balance: getCurrentBalance(author.id),
  }));
  res.json(result);
});

// 2. GET /authors/:id
app.get("/authors/:id", (req, res) => {
  const author = findAuthor(req.params.id);
  if (!author) {
    return res.status(404).json({ error: "Author not found" });
  }

  const authorBooks = books.filter((b) => b.author_id === author.id);

  const booksData = authorBooks.map((book) => {
    const bookSales = sales.filter((s) => s.book_id === book.id);
    const total_sold = bookSales.reduce((sum, s) => sum + s.quantity, 0);
    const total_royalty = total_sold * book.royalty_per_sale;
    return {
      id: book.id,
      title: book.title,
      royalty_per_sale: book.royalty_per_sale,
      total_sold,
      total_royalty,
    };
  });

  res.json({
    id: author.id,
    name: author.name,
    email: author.email,
    current_balance: getCurrentBalance(author.id),
    total_earnings: getTotalEarnings(author.id),
    total_books: authorBooks.length,
    books: booksData,
  });
});

// 3. GET /authors/:id/sales
app.get("/authors/:id/sales", (req, res) => {
  const author = findAuthor(req.params.id);
  if (!author) {
    return res.status(404).json({ error: "Author not found" });
  }

  const authorBooks = books.filter((b) => b.author_id === author.id);
  const bookMap = Object.fromEntries(authorBooks.map((b) => [b.id, b]));

  const authorSales = sales
    .filter((s) => bookMap[s.book_id])
    .map((s) => {
      const book = bookMap[s.book_id];
      return {
        book_title: book.title,
        quantity: s.quantity,
        royalty_earned: s.quantity * book.royalty_per_sale,
        sale_date: s.sale_date,
      };
    })
    .sort((a, b) => new Date(b.sale_date) - new Date(a.sale_date)); // newest first

  res.json(authorSales);
});

// 4. POST /withdrawals
app.post("/withdrawals", (req, res) => {
  const { author_id, amount } = req.body;

  // Check author exists
  const author = findAuthor(author_id);
  if (!author) {
    return res.status(404).json({ error: "Author not found" });
  }

  // Validate minimum withdrawal
  if (!amount || amount < 500) {
    return res.status(400).json({ error: "Minimum withdrawal amount is ₹500" });
  }

  // Validate against current balance
  const balance = getCurrentBalance(author.id);
  if (amount > balance) {
    return res.status(400).json({
      error: `Insufficient balance. Current balance is ₹${balance}`,
    });
  }

  // Create withdrawal record
  const withdrawal = {
    id: nextWithdrawalId++,
    author_id: author.id,
    amount,
    status: "pending",
    created_at: new Date().toISOString(),
  };
  withdrawals.push(withdrawal);

  const new_balance = getCurrentBalance(author.id);

  res.status(201).json({
    id: withdrawal.id,
    author_id: withdrawal.author_id,
    amount: withdrawal.amount,
    status: withdrawal.status,
    created_at: withdrawal.created_at,
    new_balance,
  });
});

// 5. GET /authors/:id/withdrawals
app.get("/authors/:id/withdrawals", (req, res) => {
  const author = findAuthor(req.params.id);
  if (!author) {
    return res.status(404).json({ error: "Author not found" });
  }

  const authorWithdrawals = withdrawals
    .filter((w) => w.author_id === author.id)
    .map((w) => ({
      id: w.id,
      amount: w.amount,
      status: w.status,
      created_at: w.created_at,
    }))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); // newest first

  res.json(authorWithdrawals);
});

// ─── Start Server ─────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ BookLeaf API running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Access at: http://localhost:${PORT}`);
});
