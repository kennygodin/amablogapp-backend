const express = require('express');
const {
  getUser,
  updateUser,
  deleteUser,
} = require('../controllers/userControllers');

const router = express.Router();
// Get a user
router.get('/:id', getUser);

// Update a user
router.patch('/updateUser', updateUser);

// Delete a user
router.delete('/deleteUser', deleteUser);

module.exports = router;
