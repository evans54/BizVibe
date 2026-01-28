const express = require('express');
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const userService = require('../services/userService');

const router = express.Router();

router.get('/admin/users', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const users = await userService.listUsers();
    return res.json({ users });
  } catch (error) {
    return next(error);
  }
});

router.post('/admin/users', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    const existing = await userService.findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }
    const user = await userService.createUser({ name, email, password, role: role || 'business_user' });
    return res.status(201).json({ user });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
