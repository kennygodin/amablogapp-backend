const db = require('../dbConnect');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// GET USER
const getUser = (req, res) => {
  const q = 'SELECT * FROM users WHERE users.id = ?';
  db.query(q, [req.params.id], (err, data) => {
    if (err) return res.status(400).json(err);
    if (data.length === 0) return res.status(404).json('No user found');
    return res.status(200).json(data[0]);
  });
};

// UPDATE USER
const updateUser = (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json('You are not logged in');

  jwt.verify(token, process.env.SECRET_KEY, (err, userId) => {
    if (err) return res.json(401).json('Token not valid, please login.');

    const q = 'SELECT * FROM users WHERE users.id = ?';
    db.query(q, [userId.id], async (err, data) => {
      if (err) return res.status(400).json(err);

      const salt = bcrypt.genSaltSync(10);
      const hashedPassword =
        req.body.password && bcrypt.hashSync(req.body.password, salt);

      const q =
        'UPDATE users SET `username`= ?, `email`= ?, `password`= ?, `profilePic`= ? WHERE users.id = ?';
      const values = [
        req.body.username || data[0].username,
        req.body.email || data[0].email,
        hashedPassword || data[0].password,
        req.body.profilePic || data[0].profilePic,
      ];

      db.query(q, [...values, data[0].id], (err, data) => {
        if (err) return res.status(400).json(err);
        if (data.affectedRows > 0) return res.status(200).json(data[0]);
        return res.status(401).json('You can only update your account!');
      });
    });
  });
};

// DELETE USER
const deleteUser = (req, res) => {
  const token = req.cookies.accessToken;
  if (!token) return res.status(401).json('You are not logged in.');

  jwt.verify(token, process.env.SECRET_KEY, (err, userId) => {
    if (err) return res.json(401).json('Token not valid, please login.');

    const q = 'DELETE FROM users WHERE users.id = ?';
    db.query(q, [userId.id], (err, data) => {
      if (err) return res.status(400).json(err);
      return res.status(200).json('User has been deleted!');
    });
  });
};

module.exports = {
  getUser,
  updateUser,
  deleteUser,
};
