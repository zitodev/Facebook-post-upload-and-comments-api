const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true,
        unique: true
    },
    password:{
        type: String,
        required: true
    },
    phoneNumber:{
        type: Number,
        required: true
    },
    profileImage:{
        type: String
    },
    role:{
        type: String,
        enum: ["user", "admin"],
        default: "user"
    },
    isVerified:{
        type: Boolean, 
        default: false
    },

    emailVerificationToken: {type: String},

    emailVerificationExpires: {type: Date},

    loginAttempts: {
        type: Number,
        default: 0
    },
    lockUntil:{
        type: Date
    },
    passwordResetToken:{type: String},
    passwordResetExpires: {type: Date}

}, {timeseries: true});

userSchema.methods.isLocked = function(){
    return !!(this.lockUntil && this.lockUntil > Date.now())
}

module.exports = mongoose.model("User", userSchema)