import { PrismaClient } from "@prisma/client/extension";
import { withAccelerate } from "@prisma/extension-accelerate";
import { Hono } from "hono";
import { verify } from "hono/jwt";

export const blogRouter = new Hono<{
    Bindings : {
        DATABASE_URL : string,
        JWT_SECRET: string
    },
    Variables : {
        userId : string
    }
}>();

// middlware
// get header and check it 
blogRouter.use('/*', async(c, next)=>{
    const authHeader = c.req.header("authorization") || "";
    const user = await verify(authHeader, c.env.JWT_SECRET);
    if(user){
        c.set("userId", user.id);
        await next();
    } else {
        c.status(403);
        return c.json({
            message: "you are ot logged in"
        })
    }
});

// create post
blogRouter.post('/',async (c)=>{
    const userId = c.get('userId');

    const prisma = new PrismaClient({
        datasourceUrl : c.env?.DATABASE_URL,
    }).$extends(withAccelerate());

    const body = await c.req.json();
    const post = await prisma.post.create({
        data: {
            title : body.title,
            content: body.content,
            authorId : userId
        }
    })

    return c.json({
        id : post.id
    });
})

// update post/blog
blogRouter.put('/', async(c)=>{
    const userId = c.get('userId');
    const prisma = new PrismaClient({
        datasourceUrl : c.env?.DATABASE_URL,
    }).$extends(withAccelerate());

    const body = await c.req.json();
    prisma.post.update({
        where: {
            id: body.id,
            authorId: userId
        },
        data: {
            title: body.title,
            content: body.contrnt
        }
    });

    return c.text("Post Updated!!")
})

// get Post/blog
blogRouter.get('/:id',async (c) => {

    const id = c.req.param('id');
    
    const prisma = new PrismaClient({
        datasourceUrl : c.env?.DATABASE_URL,
    }).$extends(withAccelerate());

    const post = await prisma.post.findUnique({
        where : {
            id
        }
    });
    return c.json(post);
})

// get all post/blog
// when we try to call bulk it call /:id
// for that we can change position of the router
// like first write /bulk rout then write /:id 
blogRouter.get('/bulk', async(c)=>{

    const prisma = new PrismaClient({
        datasourceUrl : c.env?.DATABASE_URL,
    }).$extends(withAccelerate());

    const posts = await prisma.post.find ({});

    return c.json(posts);
})