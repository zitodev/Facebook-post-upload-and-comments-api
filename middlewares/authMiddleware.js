const jwt = require('jsonwebtoken');
const User = require('../models/users');

const auth = async(req, res, next) =>{
    const token = req.cookies.accessToken;
    if(!token){
        return res.status(401).json({
            message: "Not Authorized"
        })
    }
    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.userInfo = await User.findById(decoded.id);
        next();
    }catch(error){
        res.status(401).json({
            message: "Invalid Token"
        })
    }
}

const refreshToken = (req, res) =>{
    const token = req.cookies.refreshToken;
    if(!token){
        return res.status(401).json({
            message: "Not Authorized"
        })
    }
    try{
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
        
        const newAccessToken = jwt.sign(
            {id: decoded.id}, 
            process.env.JWT_SECRET, 
            {expiresIn: '30m'});

        res.cookie('accessToken', newAccessToken, {
            httpOnly: true,
            secure: false,
            sameSite: "strict",
            maxAge: 30 * 60 * 1000
        });

        res.json({
            message: "Token refresh"
        })
    }catch(error){
        res.status(401).json({
            message: "Invalid refresh token"
        })
    }
}

const logout = (req, res)=>{
    res.clearCookie("accessToken", "",{
        httpOnly: true,
        expires: new Date(0)
    });
    res.clearCookie("refreshToken", "",{
        httpOnly: true,
        expires: Date(0)
    })
    res.json({
        message: "Logged out successfully"
    })
};

module.exports = {
    auth,
    refreshToken,
    logout
}

