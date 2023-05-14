const express = require('express');
const {
  getBlogs,
  getBlog,
  addBlog,
  updateBlog,
  deleteBlog,
} = require('../controllers/blogControllers');

const router = express.Router();

// Get all Blog
router.get('/', getBlogs);

// Get a single Blog
router.get('/:id', getBlog);

// Add a blog
router.post('/newblog', addBlog);

// Update a blog
router.put('/:id', updateBlog);

// Delete a blog
router.delete('/:id', deleteBlog);

module.exports = router;
