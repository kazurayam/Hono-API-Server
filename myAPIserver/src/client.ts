// src/client.ts

import type { AppType } from './server'
import { hc } from 'hono/client'

// hcがAppType型のAPIに準ずると宣言する。引数にはホストのドメインを記述する。
const client = hc<AppType>('http://localhost:3000');

const res = await client.api.users.$post({
    json: {
        name: 'taro',
        age: 15,
    },
});

if (res.ok) {
    const user = await res.json()
    console.log(res.status, res.statusText, user);
} else {
    console.log(res.status, 'error')
}

