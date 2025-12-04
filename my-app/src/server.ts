import { Hono } from 'hono';

const app = new Hono();

// 適当なテストデータ
const users = [
    {id: 1, name: 'taro', age: 15},
    {id: 2, name: 'hanako', age: 20},
]

// API
const sampleRoutes = app
    .post('/api/users', async (c) => {
        const user = await c.req.json();
        users.push({id: users.length + 1, ...user})
        return c.json(user)
    })
    .get('/', (c) => {
        return c.text('Hello Hono!')
    })

// AppType型を定義し、それをexportしてクライアントが使えるようにする
export type AppType = typeof sampleRoutes

export default app
