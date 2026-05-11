const multer = require('multer');
const path =  require('path')

const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, "uploads/" );
    },

    filename: function(req, file, cb){
        cb(null ,Date.now() + path.extname(file.originalname) )
    } 
})

//file filter
const fileFilter = (req, file, cb)=>{
    const allowedTypes = /jpg|jpeg|png/
    const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
    )
    if(extname){
        cb(null, true)
    }else{
        cb("only image is allowed")
    }
}

const upload = multer({
    storage,
    fileFilter
})

module.exports = upload