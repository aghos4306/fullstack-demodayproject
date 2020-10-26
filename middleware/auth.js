const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = (req, res, next) => {
  //Get token from header
  const token = req.header('x-auth-token');

  //check if there is no token
  if (!token) {
    return res.status(401).json({ msg: 'No token, your auth denied' });
  }

  //Vefiry token if there is one
  try {
    const decoded = jwt.verify(token, config.get('jwtSecret')); //decodes token
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
