const Post = require('../models/post');
const User = require('../models/users');
const Comment = require('../models/comments')


const createPost = async(req, res) =>{
    try{
        const {content} = req.body;
        const userId = req.userInfo.id;

        const user = await User.findById(userId);
        if(!user){
            return res.status(404).json({
                message: "User not found"
            })
        }
        const newPost = new Post({
            user: userId,
            content,
            image: req.file ? `/uploads/${req.file.filename}` : null
        });
        await newPost.save();

        res.status(201).json({
            message: "Post created successfully",
            post: newPost
        })

    }catch(err){
        return res.status(500).json({
            message: err.message
        })
    }
}

const getPosts = async(req, res) =>{
    try{
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        const posts = await Post.find().populate('user', 'name -_id').sort({createdAt: -1}).skip(skip).limit(limit);
        const total = await Post.countDocuments();
        const totalPages = Math.ceil(total / limit);
        res.json({
            message: "Posts retrieved successfully",
            total,
            totalPages,
            page,
            posts
        });
    }catch(err){
        return res.status(500).json({
            message: err.message
        })
    }
}

const deletePost = async(req, res) =>{
    const postId = req.params.id;
    const userId = req.userInfo.id;    
    try{
        const post = await Post.findById(postId);
        if(!post){
            return res.status(404).json({
                message: "Post not found"
            })
        }
        if(post.user.toString() !== userId){
            return res.status(403).json({
                message: "You are not the owner of this post"
            })
        }
        await Post.findByIdAndDelete(postId);
        res.json({
            message: "Post deleted successfully"
        })
    }catch(err){
        return res.status(500).json({
            message: err.message
        })
    }
};

const editPost = async(req, res) =>{
    const postId = req.params.id;
    const userId = req.userInfo.id;    
    const {content} = req.body;
    try{
        const post = await Post.findById(postId);
        if(!post){
            return res.status(404).json({
                message: "Post not found"
            })
        }
        if(post.user.toString() !== userId){
            return res.status(403).json({
                message: "You are not the owner of this post"
            })
        }
        post.content = content;
        await post.save();
        res.json({
            message: "Post updated successfully",
            post
        })
    }catch(err){
        return res.status(500).json({
            message: err.message
        })
    }
};

const createComments = async(req, res) =>{
    try{
        const userId = req.userInfo.id;
        const postId = req.params.postId;
        const {comment} = req.body;

       

        const post =  await Post.findById(postId);
        if(!post){
            return res.status(404).json({
                message: "No post  found"
            })
        }

        const newComment =  new Comment({
            comment,
            user: userId,
            post: postId
        })
        await newComment.save();
       


        if(!newComment){
            return res.status(401).json({
                message: "comment failed to post"
            })
        }

        res.status(200).json({
            message: "comment posted",
            newComment

        })

    }catch(err){
        return res.status(500).json({
            message: err.message
        })
    }
}

const deleteComment = async(req, res)=>{
    try{
        const commentId = req.params.id;
        const userId = req.userInfo.id;

        const comment = await Comment.findById(commentId);
        if(!comment){
            return res.status(404).json({
                message: "no post found"
            })
        }
        if(comment.user.toString() !== userId){
            return res.status(402).json({
                message: "you are not allowed to perform this action"
            })
        }
        await comment.findByIdAndDelete(commentId)
        res.status(200).json({
            message: "comment deleted"
        })

    }catch(err){
        return res.status(500).json({
            message: err.message
        })
    }
}

const editComment = async(req, res) =>{
    const commentId = req.params.id;
    const userId = req.userInfo.id;    
    const {comment} = req.body;
    try{
        const comments = await Comment.findById(commentId);
        if(!comments){
            return res.status(404).json({
                message: "Post not found"
            })
        }
        if(comments.user.toString() !== userId){
            return res.status(403).json({
                message: "You are not allowed to perform this action"
            })
        }
        comments.comment = comment;
        await comment.save();
        res.json({
            message: "comment updated successfully",
            post
        })
    }catch(err){
        return res.status(500).json({
            message: err.message
        })
    }
};

const getComment = async(req, res) =>{
    try{
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        
        const comments = await Comment.find({post: req.params.postId}).populate('user', 'name -_id').populate('post', 'content -_id').sort({createdAt: -1}).skip(skip).limit(limit);
        const total = await Comment.countDocuments();
        const totalPages = Math.ceil(total / limit);
        res.json({
            message: "Posts retrieved successfully",
            total,
            totalPages,
            page,
            comments
        });
    }catch(err){
        return res.status(500).json({
            message: err.message
        })
    }
}

const getPostsAndComments = async(req, res) =>{
    try{
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        
        const posts = await Post.find().populate('user', 'name -_id').sort({createdAt: -1}).skip(skip).limit(limit);
        const total = await Post.countDocuments();
        const totalPages = Math.ceil(total / limit);
        res.json({
            message: "Posts retrieved successfully",
            total,
            totalPages,
            page,
            posts
        });
    }catch(err){
        return res.status(500).json({
            message: err.message
        })
    }
}



module.exports = {
    createPost,
    getPosts,
    deletePost,
    editPost,
    createComments,
    deleteComment,
    editComment,
    getComment

}