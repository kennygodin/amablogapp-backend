const jwt = require('jsonwebtoken');
const db = require('../dbConnect');
const moment = require('moment');

// ALL BLOGS
const getBlogs = (req, res) => {
  // const q = 'SELECT * FROM blogs';
  const q = 'SELECT * FROM blogs ORDER BY blogs.createdAt DESC ';
  db.query(q, (err, data) => {
    if (err) return res.status(400).json(err);
    return res.status(200).json(data);
  });
};

// ALL SINGLE BLOG
const getBlog = (req, res) => {
  const { id } = req.params;

  // const q = 'SELECT * FROM blogs WHERE blogs.id = ?';
  const q =
    'SELECT `username`, `title`, `desc`, `img`, `userId`, `createdAt` from users u JOIN blogs b ON (u.id = b.userId) WHERE b.id = ?';

  db.query(q, [id], (err, data) => {
    if (err) return res.status(400).json(err);
    if (data.length === 0) return res.status(404).json('No post with such id');
    return res.status(200).json(data[0]);
  });
};

// ADD BLOG
const addBlog = (req, res) => {
  // Check if user is logged in
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json('You are not logged in.');

  jwt.verify(token, process.env.SECRET_KEY, (err, userInfo) => {
    if (err) return res.status(400).json('Token not valid, please login.');

    // Add a blog
    const q =
      'INSERT INTO blogs (`title`, `desc`, `img`, `createdAt`, `userId`) VALUES (?)';
    const values = [
      req.body.title,
      req.body.desc,
      req.body.img,
      moment(Date.now()).format('YYYY-MM-DD HH:mm:ss'),
      userInfo.id,
    ];

    db.query(q, [values], (err, data) => {
      if (err) return res.status(400).json(err);
      return res.status(201).json('Blog has been added.');
    });
  });
};

// UPDATE BLOG
const updateBlog = (req, res) => {
  // Check if user is logged in
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json('You are not logged in.');

  jwt.verify(token, process.env.SECRET_KEY, (err, userInfo) => {
    if (err) return res.status(400).json('Token not valid, please login.');

    // Find a blog
    const { id } = req.params;
    const q =
      'SELECT `username`, `title`, `desc`, `img`, `userId`, `createdAt` from users u JOIN blogs b ON (u.id = b.userId) WHERE b.id = ?';

    db.query(q, [id], (err, data) => {
      if (err) return res.status(400).json(err);
      if (data.length === 0)
        return res.status(404).json('No post with such id');
      // return res.status(200).json(data[0]);

      const q =
        'UPDATE blogs SET `title`= ?, `desc`= ?, `img`= ? WHERE blogs.id = ?';
      const values = [
        req.body.title,
        req.body.desc,
        req.body.img || data[0].img,
      ];

      db.query(q, [...values, req.params.id], (err, data) => {
        if (err) return res.status(400).json(err);
        return res.status(200).json('Blog has been updated');
      });
    });
  });
};

// DELETE BLOG
const deleteBlog = (req, res) => {
  // Check if user is logged in
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json('You are not logged in.');

  jwt.verify(token, process.env.SECRET_KEY, (err, userInfo) => {
    if (err) return res.status(400).json('Token not valid, please login.');

    // Add a blog
    const q = 'DELETE FROM blogs where blogs.id = ?';

    db.query(q, [req.params.id], (err, data) => {
      if (err) return res.status(400).json(err);
      return res.status(200).json('Blog has been deleted.');
    });
  });
};
module.exports = { getBlogs, getBlog, addBlog, updateBlog, deleteBlog };
