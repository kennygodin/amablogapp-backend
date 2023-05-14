const db = require('../dbConnect');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const moment = require('moment');
const sendEmail = require('../utils/sendEmail');

// REGISTER
const registerUser = (req, res) => {
  //   Check if user exists
  const q = 'SELECT * FROM users WHERE email = ?';

  db.query(q, [req.body.email], (err, data) => {
    if (err) return res.status(400).json(err);
    if (data.length) return res.status(400).json('User already exists!');

    //  CREATE USER
    //   Hash password
    const salt = bcrypt.genSaltSync(10);
    const hashedPassword = bcrypt.hashSync(req.body.password, salt);

    const q =
      'INSERT INTO users (`username`, `email`, `password`, profilePic) VALUE (?)';
    const values = [
      req.body.username,
      req.body.email,
      hashedPassword,
      'https://i.ibb.co/4pDNDk1/avatar.png',
    ];
    db.query(q, [values], (err, data) => {
      if (err) return res.status(400).json(err);
      return res.status(201).json('User has been created.');
    });
  });
};

// LOGIN
const loginUser = (req, res) => {
  const q = 'SELECT * FROM users WHERE email = ?';

  db.query(q, [req.body.email], (err, data) => {
    if (err) return res.status(400).json(err);
    if (data.length === 0)
      return res.status(404).json('User not found, please register.');

    // Password match
    const passMatch = bcrypt.compareSync(req.body.password, data[0].password);
    if (!passMatch) return res.status(400).json('Incorrect credentials.');

    // Generate token and cookie
    const token = jwt.sign({ id: data[0].id }, process.env.SECRET_KEY);
    const { password, ...others } = data[0];
    res
      .cookie('accessToken', token, {
        httpOnly: true,
      })
      .status(200)
      .json(others);
  });
};

const logoutUser = (req, res) => {
  res
    .clearCookie('accessToken', {
      secure: true,
      sameSite: 'none',
    })
    .status(200)
    .json('User has been logged out successfully.');
};

// FORGOT PASSWORD
const forgotPassword = (req, res) => {
  // Check if email exists in DB
  const q = 'SELECT * FROM users where users.email = ? ';
  db.query(q, [req.body.email], async (err, userData) => {
    if (err) return res.status(400).json(err);
    if (userData.length === 0)
      return res.status(404).json('No user with such email.');

    // Create  a reset token
    let resetToken = crypto.randomBytes(32).toString('hex') + userData[0].id;
    console.log(resetToken);

    // Hash token before saving
    const hashedToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Delete token if it exists in the DB
    const q = 'DELETE FROM token WHERE token.userId = ?';
    db.query(q, [userData[0].id], (err, data) => {
      if (err) return res.status(400).json(err);

      // Save token to the database
      const q =
        'INSERT INTO token (`userId`, `token`, `createdAt`, `expiresAt`) VALUE (?)';
      const values = [
        userData[0].id,
        hashedToken,
        moment(Date.now()).format('YYYY-MM-DD HH:mm:ss'),
        moment(Date.now() + 30 * (60 * 1000)).format('YYYY-MM-DD HH:mm:ss'), //Expires in 30mins
      ];
      db.query(q, [values], async (err, tokenData) => {
        if (err) return res.status(400).json(err);

        // Construct a Reset Url
        const resetUrl = `${process.env.FRONTEND_URL}/resetpassword/${resetToken}`;

        // Reset Email
        const message = `
          <h2>Hello, ${userData[0].username}</h2>
          <p>There was a request to reset your password.
          If you did't make this request please ignore the email.</p>
          <p>Otherwise, click on the link to reset your password</p>
          <p>This reset link is valid only for 30 minutes.</p>
          <a href=${resetUrl} clicktracking=off>${resetUrl}</a>
          <p>Thanks,<br />AmaBlog team</p>`;

        const subject = 'Password Reset Request';
        const send_to = userData[0].email;
        const sent_from = process.env.EMAIL_USER;

        try {
          await sendEmail(subject, message, send_to, sent_from);
          return res
            .status(200)
            .json({ success: true, message: 'Reset Email Sent.' });
        } catch (err) {
          return res
            .status(500)
            .json({ error: 'Email not sent, please try again.' });
        }
      });
    });
  });
};

// RESET PASSWORD
const resetPassword = (req, res) => {
  //  get params and passwords
  const { resetToken } = req.params;
  const { password } = req.body;

  // Hash token compare with the one in the db
  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  //   Hash password
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password, salt);

  // Find token in DB
  const q =
    'SELECT * FROM token WHERE token.token = ? AND token.expiresAt > CURDATE()';
  db.query(q, [hashedToken], (err, data) => {
    if (err) return res.status(400).json(err);
    if (data[0].length === 0)
      return res.status(400).json('Invalid or expired token.');

    const q = 'SELECT * FROM users WHERE users.id = ?';
    db.query(q, [data[0].userId], (err, data) => {
      if (err) return res.status(400).json(err);

      const q =
        'UPDATE users SET `username`= ?, `email`= ?, `password`= ?, `profilePic`= ? WHERE users.id = ?';
      const values = [
        data[0].username,
        data[0].email,
        (data[0].password = hashedPassword),
        data[0].profilePic,
      ];

      db.query(q, [...values, data[0].id], (err, data) => {
        if (err) return res.status(400).json(err);
        if (data.affectedRows > 0)
          return res
            .status(200)
            .json('Password Reset Successful, Please Login.');
        return res.status(403).json('Could not update.');
      });
    });
  });
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  forgotPassword,
  resetPassword,
};
