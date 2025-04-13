const jwt = require("jsonwebtoken");

function authenticateJWT(req, res, next) {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];

        jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
            if (err) {
                return res.stats(403).json({ message: "Forbidden : LoggedIn, but no permission."});
            }
            req.user = user;
            next();
        });
    }
    else {
        res.status(401).json({ message: "Unauthorized : Not LoggedIn or no token provide."});
    }
}

function authorizeRoles(...roles) {
    return (req, res, next) => {
        // console.log(req.user);
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: "Access denied" });
        }
        next();
    };
}

module.exports = {
    authenticateJWT,
    authorizeRoles,
}