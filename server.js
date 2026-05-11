require('dotenv').config()
const express = require('express');
const app = express();

const cookieParser = require('cookie-parser');
const limiter = require('./config/rateLimit')


const connectDB = require('./config/db')

const authRoute = require('./routes/authRoute')
const postRoute = require('./routes/postRoute')


app.use(express.json());
app.use(cookieParser());
app.use(limiter);
app.use(express.urlencoded({extended: true}))
app.use("/uploads", express.static("uploads"))
app.use(express.static('public'))

app.use('/api/auth', authRoute);
app.use('/api/posts', postRoute);




PORT = 3000


connectDB().then(()=>{
    app.listen(PORT, ()=>{
        console.log(`server is running in port ${PORT}`)
    })
}).catch((error)=>{
    console.error("Failed to connect the server", error.message)
})


