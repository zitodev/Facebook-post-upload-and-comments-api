const User = require('../models/users');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const generateToken = require('../utility/generateToken');
const fs = require('fs');
const path = require('path')


//validation 
const validation = async(req, res, next)=>{
    try{
        const {name, email, password, confirmPassword, phoneNumber, role} = req.body;
        if(!name || !email || !password || !confirmPassword || !phoneNumber){
            if(req.file){
                fs.unlinkSync(req.file.path)
            }
            return res.status(403).json({
                message: "Please fill all required field"
            })
          
        }

        //compare the password and confrim password
        if(password !== confirmPassword ){
            if(req.file){
                fs.unlinkSync(req.file.path)
            }
            return res.status(402).json({
                message: "password didn't match"
            })
        }
        //check if user exist
        const existingUser =  await User.findOne({email});
        if(existingUser){
            if(req.file){
                fs.unlinkSync(req.file.path)
            }
            return res.status(402).json({
                message: "User already exist"
            })
        }
        next()

    }catch(err){
        if(req.file){
                fs.unlinkSync(req.file.path)
            }
        return res.status(500).json({
            message: err.message
        })
    }
}

//registration controller
const registerUser = async(req, res)=>{
    try{
        const {name, email, password, confirmPassword, phoneNumber, role} = req.body;


        //hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        //create new user
        const user = new User({
            name,
            email,
            password: hashedPassword,
            phoneNumber,
            profileImage: req.file? `/uploads/${req.file.filename}`: null,
            role
        });

        const emailToken = crypto.randomBytes(32).toString("hex");
        const hashtoken = crypto
        .createHash("sha256")
        .update(emailToken)
        .digest("hex");

        user.emailVerificationToken = hashtoken;
        user.emailVerificationExpires = Date.now() + 30 * 60 * 1000// 30minutes
        if(!user){
            return res.status(400).json({
                message: "Registration Failed"
            })
        }
        await user.save();


        res.status(200).json({
            message: "Registration successful",
            emailToken
        })

    }catch(err){
        return res.status(500).json({
            message: err.message
        })
    }
}

const verifiedEmail = async(req, res)=>{
    try{
        const token = req.params.token;

        const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

        const user = await User.findOne({
            emailVerificationToken: hashedToken,
            emailVerificationExpires: {$gt: Date.now()}
        })
        if(!user){
            return res.status(401).json({
                message: "Token has expired"
            })
        }
        user.isVerified = true;
        user.emailVerificationToken = undefined;
        user.emailVerificationExpires = undefined;

        await user.save();

        res.status(200).json({
            message: "Email verified successful"
        })

    }catch(err){
        return res.status(500).json({
            message: err.message
        })
    }
};

const resendEmailToken = async(req, res)=>{
    try{
        const {email} = req.body;
        
        const user = await User.findOne({email});

        if(!user){
            return res.status(404).json({
                message: "User not found!"
            })
        }
        if(!user.isVerified){
            const emailToken = crypto.randomBytes(32).toString("hex");

            const hashToken = crypto
            .createHash("sha256")
            .update(emailToken)
            .digest("hex");

            user.emailVerificationToken = hashToken;
            user.emailVerificationExpires = Date.now() + 30 * 60 * 1000;
            await user.save();
            res.status(200).json({
            message: "Token has been resend to your email",
            emailToken
            })

        }



    }catch(err){
        return res.status(500).json({
            message: err.message
        })
    }
};

const loginUser = async(req, res)=>{
    try{
        const {email, password} = req.body;

        if(!email || !password){
            return res.status(402).json({
                message: "Please fill your login details"
            })
        }

        const user =  await User.findOne({email});
        if(!user){
            return res.status(404).json({
                message: "User with this account not found!"
            })
        }

        if(!user.isVerified){
            return res.status(401).json({
                message: "Email verification required"
            })
        }
        if(user.isLocked()){
            return res.status(403).json({
                message: "Your account has been blocked, contact support for more details"
            })
        }
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch){
            user.loginAttempts += 1;
            if(user.loginAttempts >= 5){
                user.lockUntil = Date.now() + 2 *  60 * 1000; // lock account for 2 hours
            }
            await user.save();
            return res.status(401).json({
                message: "Invalid login details"
            })
        }
        const accessToken = generateToken.accessToken(user._id);
        const refreshToken = generateToken.refreshToken(user._id);

        res.cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: false, //use true for production level
            sameSite: "strict",
            maxAge: 30 * 60 * 1000 // 30 minutes
        });

        res.cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: false, // use true for production level
            sameSite: "strict",
            maxAge: 7 * 24 * 60 * 60 * 1000 //7 days
        });

        user.loginAttempts = 0;
        user.lockUntil = undefined
        await user.save();

        res.status(200).json({
            message: "Login successful"
        })

    }catch(err){
        return res.status(500).json({
            message: err.message
        })
    }
};

const forgotPassword =async(req, res)=>{
    try{
        const {email} = req.body;

        const user = await User.findOne({email});
        if(!user){
            return res.status(404).json({
                message: "User not found"
            })
        }
        const resetToken = crypto.randomBytes(32).toString("hex");

        const hashToken = crypto
        .createHash("sha256")
        .update(resetToken)
        .digest("hex");

        user.passwordResetToken = resetToken
        user.passwordResetExpires = Date.now() + 10 * 60 * 1000 // 10 minutes
        await user.save();

        res.status(200).json({
            message: "Password reset token generated",
            resetToken
        })

    }catch(err){
        return res.status(500).json({
            message: err.message
        })
    }
};

const resetPassword = async(req, res)=>{
    try{
        const token = req.params.token;

        const hashedToken = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

        const user = await User.findOne({
            passwordResetToken: hashedToken,
            passwordResetExpires: {$gt: Date.now()}
        })
        if(!user){
            return res.status(401).json({
                message: "Token has expired"
            })
        }
        const {password, confirmPassword} = req.body;

        if(password !== confirmPassword){
            return res.status(402).json({
                message: "Password didn't match"
            })
        }   
    //hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        user.password = hashedPassword;
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save();

        res.status(200).json({
            message: "Password reset successful"
        });

    }catch(err){
        return res.status(500).json({
            message: err.message
        })
    }
};

const updatePassword = async(req, res)=>{
    try{
        const userId = req.userInfo.id;
        const {currentPassword, newPassword, confirmNewPassword} = req.body;

        const user = await User.findById(userId);
        if(!user){
            return res.status(404).json({
                message: "User not found"
            })
        }

        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if(!isMatch){
            return res.status(401).json({
                message: "Current password is incorrect"
            })
        }

        if(newPassword !== confirmNewPassword){
            return res.status(402).json({
                message: "New passwords don't match"
            })
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({
            message: "Password updated successfully"
        });

    }catch(err){
        return res.status(500).json({
            message: err.message
        })
    }
};

const userProfile = async(req, res)=>{
    try{
        const userId = req.userInfo.id;

        const user = await User.findById(userId).select("-password -isVerified -loginAttempts -role -_id");
        if(!user){
            return res.status(404).json({
                message: "user not found"
            })
        }
        res.status(200).json({
            message: "User Profile",
            user
        })

    }catch(err){
        return res.status(500).json({
            message: err.message
        })
    }
}

module.exports = {
    registerUser,
    verifiedEmail,
    resendEmailToken,
    loginUser,
    forgotPassword,
    resetPassword,
    updatePassword,
    userProfile,
    validation
}