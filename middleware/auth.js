module.exports = class auth {
    static ensureAuthenticated = function(req, res, next) {
        const allowedGuestRoutes = ['/login', '/register'];
        if (req.user) {
            return next();
        } else {
            let publicRoute = false;
            if (req.url === '/') {
                publicRoute = true;
                return next();
            }
            allowedGuestRoutes.forEach(guestRoute => {
                if (req.url.indexOf(guestRoute) === 0) {
                    publicRoute = true;
                    return next();
                }
            });
            if (!publicRoute) {
                console.log("access denied");
                res.redirect('/');
            }
        }
    }
}