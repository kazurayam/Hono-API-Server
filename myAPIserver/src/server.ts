import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { swaggerUI } from '@hono/swagger-ui';

const app = new OpenAPIHono();

// 適当なテストデータ
const users = [
    {id: 1, name: 'taro', age: 15},
    {id: 2, name: 'hanako', age: 20},
]

/**
 * ユーザーを作成するためのリクエストのschema
 */
const reqCreateUserSchema = z.object({
    name: z.string().min(1)
        .openapi({
            description: 'ユーザの名前',
            example: 'taro',
        }),
    age: z.number().openapi({
        description: 'ユーザの年齢',
        example: 15,
    }),
}).openapi('reqCreateUserSchema');

/**
 * エラーを返すレスポンスのschema
 */
const resErrorSchema = z.object({
    code: z.number(),
    message: z.string(),
});

/**
 * ユーザ情報を返すレスポンスのschema
 */
const resUserSchema = z.object({
    id: z.number(),
    name: z.string(),
    age: z.number(),
});

// API
const sampleRoutes = app
    .openapi(
        createRoute({
            method: 'post',
            path: '/api/users',
            request: {
                body: {
                    content: {
                        'application/json': {
                            schema: reqCreateUserSchema,
                        }
                    }
                }
            },
            responses: {
                200: {
                    description: 'ユーザー情報を返す',
                    content: {
                        'application/json': {
                            schema: resUserSchema,
                        }
                    }
                },
                400: {
                    description: 'リクエストに誤りがある',
                    content: {
                        'application/json': {
                            schema: resErrorSchema,
                        }
                    }
                }
            }
        }),
        //第二引数にリクエスト・ハンドラーを記述する
        async (c) => {
            // スキーマに基づいてリクエストを検証する
            // パスした場合にのみnameとageのデータを取得できる
            const { name, age } = c.req.valid('json');
            const user = {id: users.length + 1, name, age };
            users.push(user);
            return c.json(user, 200)
        });

// ドキュメントを生成
app.doc31("/doc", {
    openapi: "3.1.0",
    info: {
        version: "1.0.0",
        title: "Sample API Document",
    },
});

// ドキュメントをブラウザで表示
app.get("/ui", swaggerUI({url: "/doc"}))

// AppType型を定義し、それをexportしてクライアントが使えるようにする
export type AppType = typeof sampleRoutes

export default app