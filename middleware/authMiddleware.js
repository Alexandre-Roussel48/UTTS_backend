const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
  if (typeof req.cookies.authToken !== 'undefined') {
    const bearerToken = req.cookies.authToken;
    jwt.verify(bearerToken, process.env.SECRET_KEY, (err, authData) => {
      if (err) {
        res.sendStatus(403).json({ status: 'Token is wrong' });
      } else {
        req.authData = authData;
        const refreshToken = req.cookies.refreshToken;
        if (refreshToken) {
          jwt.verify(refreshToken, process.env.REFRESH_SECRET_KEY, (err, authData) => {
            if (!err) {
              token = jwt.sign({ user_id: authData.user_id }, process.env.SECRET_KEY, { expiresIn: process.env.ACCESS_TOKEN_EXPIRY });
              res.cookie('authToken', token, {
                  httpOnly: true,
                  maxAge: 15 * 60 * 1000,
                  sameSite: 'none',
                  domain: process.env.DOMAIN,
                  secure: true
              });
            }
          });
        }
        next();
      }
    });
  } else {
    res.sendStatus(403).json({ status: 'Token is not set' });
  }
}

module.exports = verifyToken;