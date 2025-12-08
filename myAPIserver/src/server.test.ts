import { describe, expect, test } from 'bun:test';
import { testClient } from 'hono/testing';
import app from './server'
import type { AppType } from './server'

describe('userに関するAPI', () => {
    test('ユーザが作成されて200が返ってくるケース', async () => {
        const client = testClient<AppType>(app)
        const res = await client.api.users.$post({
            json: {
                name: 'taro',
                age: 15,
            }
        })
        expect(res.status).toBe(200)
    });

    test('ユーザが作成できず400が返ってくるケース', async () => {
        const client = testClient<AppType>(app);
        const res = await client.api.users.$post({
            json: {
                name: null,
                age: 15,
            }
        })
        expect(res.status).toBe(400)
    });
});