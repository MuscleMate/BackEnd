const jwt = require('jsonwebtoken');
const UnauthenticatedError = require('../errors/unauthenticated');

const requireAuth = (req, res, next) =>{   
    
    const token = req.cookies.jwt;
    if(token)
    {
        jwt.verify(token, 'secret',(err, decodedToken)=>{
            if(!err){
                next();
            }
            else{
                throw new UnauthenticatedError('Token has expired or is invalid');
            }
        });
    }
    else
    {
        throw new UnauthenticatedError('Token has expired or is invalid');
    }
}

module.exports = {requireAuth};