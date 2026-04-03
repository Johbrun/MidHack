const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const { FLAGS } = require('../flags');

const router = express.Router();

// POST /api/credits/topup
router.post('/topup', authenticate, (req, res) => {
  const { amount, cardNumber } = req.body;
  const topupAmount = parseFloat(amount);

  if (!topupAmount || topupAmount <= 0 || topupAmount > 1000) {
    return res.status(400).json({ error: 'Invalid amount (1-1000)' });
  }

  db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(topupAmount, req.user.id);

  db.prepare(
    'INSERT INTO transactions (to_user_id, amount, type) VALUES (?, ?, ?)'
  ).run(req.user.id, topupAmount, 'topup');

  const user = db.prepare('SELECT balance FROM users WHERE id = ?').get(req.user.id);
  res.json({ message: 'Top-up successful', balance: user.balance });
});

// POST /api/credits/send
// VULNERABLE: no validation that amount > 0
router.post('/send', authenticate, (req, res) => {
  const { recipientUsername, amount } = req.body;
  const sendAmount = parseFloat(amount);

  if (isNaN(sendAmount)) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  const sender = db.prepare('SELECT id, balance FROM users WHERE id = ?').get(req.user.id);
  const recipient = db.prepare('SELECT id, username FROM users WHERE username = ?').get(recipientUsername);

  if (!recipient) {
    return res.status(404).json({ error: 'Recipient not found' });
  }

  if (recipient.id === sender.id) {
    return res.status(400).json({ error: 'Cannot send credits to yourself' });
  }

  // VULNERABLE: only checks balance >= amount, negative amount passes this check
  if (sender.balance < sendAmount) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }

  db.prepare('UPDATE users SET balance = balance - ? WHERE id = ?').run(sendAmount, sender.id);
  db.prepare('UPDATE users SET balance = balance + ? WHERE id = ?').run(sendAmount, recipient.id);

  db.prepare(
    'INSERT INTO transactions (from_user_id, to_user_id, amount, type) VALUES (?, ?, ?, ?)'
  ).run(sender.id, recipient.id, sendAmount, 'transfer');

  const updatedSender = db.prepare('SELECT balance FROM users WHERE id = ?').get(sender.id);

  const response = {
    message: `Sent ${sendAmount} credits to ${recipient.username}`,
    balance: updatedSender.balance,
  };

  // Flag revealed when balance exceeds 9999 (achieved via negative amounts)
  if (updatedSender.balance > 9999) {
    response.flag = FLAGS.BUSINESS_LOGIC;
    response.message += ' 🎉 Impressive balance!';
  }

  res.json(response);
});

module.exports = router;
