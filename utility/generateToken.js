const  jwt =  require('jsonwebtoken');

//generate token
const accessToken = (id)=>{
    return jwt.sign({id}, process.env.JWT_SECRET, {expiresIn: '30m'})
};

//generate refresh token
const refreshToken = (id)=>{
    return jwt.sign({id}, process.env.JWT_REFRESH_SECRET, {expiresIn: '7d'})
};

module.exports = {
    accessToken,
    refreshToken
};