- Table of contents
{:toc}

# Kazurayam’s Hono Base Project

- author: kazurayam

- date: Dec, 2025

わたくしkazurayamがこれからHonoを使ったプロジェクトを自作するにあたって雛形として役立つプロジェクトを作り、GitHubリポジトリにしました。Bun、Hono、JSXなど基盤となるソフトウェアをインストールし、プロジェクトを作って、サンプルとしてのアプリが動作することを確認するまでの手順をまとめています。

## KzHonoProjectBaseの概要

1.  macOXで仕事する。 LinuxやWindowsは考慮しない。

2.  JavaScriptランタイムBunを使用する。Node.jsではなく。

3.  TypeScriptでコーディングする。JavaScriptではなく。

4.  WebアプリケーションのフレームワークHonoを使用する。Expressではなく。

5.  JSONを応答するAPIサーバとHTMLを応答するWebサーバの二つのサーバを作る。

6.  Bunに組み込まれたビルドツールを使う。Next.jsやViteではなく。

7.  サーバーサイドでJSXをレンダリングする。そのためにReactは無くても大丈夫だからReactは使わない。

8.  ユニットテストをする。Bunの組み込みテストフレームワークを使用する。

9.  E2Eテストをする。Playwrightを使用する。

10. サンプルアプリをエッジサーバーへ配備する。CloudFlare Worksを使う。

## Bunのインストール

参考情報: [Bun / Installation](https://bun.com/docs/installation)

Bunをインストールする

    $ cd ~
    $ curl -fsSL https://bun.com/install | bash
    ######################################################################## 100.0%
    bun was installed successfully to ~/.bun/bin/bun
    Run 'bun --help' to get started

Bunのバージョンを目視する

    $ bun --version
    1.3.4

## APIサーバを作る

このWeb記事を参考にした。

- ["TypeScript初心者の私がHonoでバックエンドサーバー構築してみた 〜RPCからテストまで" by ゆず at Zenn](https://zenn.dev/yuzunosk55/articles/09275c72cf051b)

APIサーバのサンプルコードをコピペさせてもらった。記事がコードを丁寧に説明してくれているので、コードの詳細についてはそちらを参照のこと。kazurayamが実施したプロジェクトの作成手順と操作方法をメモする。

### プロジェクトを作成する

まずプロジェクトを格納するディレクトリを作ろう

    $ cd ~/tmp
    $ mkdir MyHonoApps
    $ cd MyHonoApps

このディレクトリを $REPO と書き表すことにする。

$REPO の中で下記のコマンドを実行する。

    $ bun create hono@latest myAPIserver

すると対話的に質問が表示される。

- `? Which template do you want to use?` と聞かれるので `bun` を選択する。

- `? Do you want to install project dependencies now?` と聞かれるので `Yes` を選択する。

- `? Which package manager do you want to use?` と聞かれるので `bun` を選択する。

<!-- -->

    $ bun create hono@latest myAPIserver
    create-hono version 0.19.4
    ✔ Using target directory … myAPIserver
    ✔ Which template do you want to use? cloudflare-workers
    ✔ Do you want to install project dependencies? Yes
    ✔ Which package manager do you want to use? bun
    ✔ Cloning the template
    ✔ Installing project dependencies
    🎉 Copied project files
    Get started with: cd myAPIserver

すると `myAPIserver` というディレクトリが作成される。

    :~/tmp/MyHonoApps/myAPIserver
    $ tree -L 2
    .
    ├── bun.lock
    ├── node_modules
    │   ├── @types
    │   ├── bun-types
    │   ├── hono
    │   └── undici-types
    ├── package.json
    ├── README.md
    ├── src
    │   └── index.ts
    └── tsconfig.json

    7 directories, 5 files

`myAPIserver` というディレクトリが作られる。その中にcdして `bun install` コマンドを実行しよう。すると与えられた `package.json` の `dependencies` と `testDependencies` に従って必要なライブラリがインストールされる。

    $ cd myAPIserver
    $ bun install

`src/index.ts` をエディタで開いてみよう。下記のコードが与えられているはずだ。

    import { Hono } from 'hono'

    const app = new Hono()

    app.get('/', (c) => {
      return c.text('Hello Hono!')
    })

    export default app

下記のコマンドを実行するとサーバーが立ち上がるはずだ。

    $ cd $REPO/myAPIserver
    $ bun run --hot src/index.ts
    Started development server: http://localhost:3000

<http://127.0.0.1:3000/> をブラウザで開けばこんな画面が見られるはずだ。

<figure>
<img src="https://kazurayam.github.io/KzHonoProjectBase/images/myAPIserver_1_index_initial.png" alt="myAPIserver 1 index initial" />
</figure>

以上でごく単純なHTTPサーバーを立ち上げることができた。Ctrl+Cでサーバーを停止しよう。

### 最小構成のAPIサーバーを作る

次にJSONを応答するAPIサーバのコードを開発しよう。

`src/server.ts` をエディタで開き、下記のコードを記述しよう。

[myAPIserver/src/server.ts](https://github.com/kazurayam/KzHonoProjectBase/tree/master/myAPIserver/src/server.ts)

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
    app.get("/ui", swaggerUI({ url: "/doc" }))

    // AppType型を定義し、それをexportしてクライアントが使えるようにする
    export type AppType = typeof sampleRoutes

    export default app

ターミナルで次のコマンドを実行しよう。HTTPサーバが立ち上がる。

    $ cd $REPO/myAPIserver
    $ bun dev

ブラウザで下記のURLを開いてみよう。

- <http://127.0.0.1/ui>

こんな画面が見られるはずだ。

<figure>
<img src="https://kazurayam.github.io/KzHonoProjectBase/images/myAPIserver_2_API_document.png" alt="myAPIserver 2 API document" />
</figure>

これは `src/server.ts` に記述したAPIドキュメント生成機能によって実現されている。APIドキュメント生成機能は `src/server.ts` の87行目から99行目に記述されている。

    // ドキュメントを生成
    app.doc31("/doc", {
        openapi: "3.1.0",
        info: {
            version: "1.0.0",
            title: "Sample API Document",
        },
    });

    // ドキュメントをブラウザで表示
    app.get("/ui", swaggerUI({ url: "/doc" }))

このコードがSwaggerUIによってOpenAPI仕様に準拠したAPIドキュメントを自動生成している。

### APIクライアントを作る

APIクライアントを作ろう。 `src/client.ts` を書いた。

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

次に\`myAPIserver/package.json\`をエディタで開き、\`scripts\`セクションに下記の行を追加しよう。

      "scripts": {
        "dev": "bun run --hot src/server.ts",
        "client": "bun run --hot src/client.ts",

`bun dev` コマンドでサーバーを立ち上げた状態で、別のターミナルを開き、下記のように `bun client` コマンドを実行しよう。

    $ bun client
    200 OK {
      id: 3,
      name: "taro",
      age: 15,
    }

クライアントがサーバにリクエストを投げたらサーバがJSONを応答した。いいね。

### ユニットテストをする

`src/server.ts` をユニットテストしよう。Bunに組み込まれたtestライブラリを使おう。 `src/server.test.ts` を書いた。

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

    $ bun test
    bun test v1.3.4 (5eb2145b)

    src/server.test.ts:
    ✓ userに関するAPI > ユーザが作成されて200が返ってくるケース [3.55ms]
    ✓ userに関するAPI > ユーザが作成できず400が返ってくるケース [0.84ms]

     2 pass
     0 fail
     2 expect() calls
    Ran 2 tests across 1 file. [49.00ms]

`src/server.ts` を対象とするユニット・テストが動いた。

## HTMLを応答するWebサーバを作る

わたしはJSXでHTMLを生成するWebサーバを作りたい。静的HTMLと同じぐらい高速に応答するWebサーバにしたい。Reactが提供する高度な会話的な機能は私のWebアプリに必要ない。だからReactを使わないで、JSXをサーバーサイドでレンダリングしたい。この目標を曲がりなりにも達成するWebサーバを実装した。

[Hono公式ドキュメント "JSX"](https://hono.dev/docs/guides/jsx) のサンプルコードをコピペした。

### ライブラリをインストールする

`bun install` コマンドを実行してライブラリをインストールしよう。

    $ cd $REPO/myWEBserver
    $ bun install
    bun install v1.3.4 (5eb2145b)

    + @happy-dom/global-registrator@20.0.11
    + @testing-library/dom@10.4.1
    + @types/bun@1.3.3
    + @types/node@24.10.1
    + happy-dom@20.0.11
    + playwright@1.57.0
    + hono@4.10.7

    29 packages installed [118.00ms]

JSXを使うために `tsconfig.json` に設定を書く必要がある。

    {
      "compilerOptions": {
        "strict": true,
        "jsx": "react-jsx",
        "jsxImportSource": "hono/jsx"
      }
    }

HonoはJSXをサポートしているので、JSXのためにライブラリをインストールする必要は無い。

下記の通り `src/index.tsx` を書いた。

    import { Hono } from 'hono';
    import type { FC } from 'hono/jsx';  // FC stands for Function Component

    const app = new Hono()

    const Layout: FC = (props) => {
        return (
            <html>
                <body>{props.children}</body>
            </html>
        );
    }

    const Top: FC<{ messages: string[] }> = (props: {
        messages: string []
    }) => {
        return (
            <Layout>
                <h1>Hello Hono!</h1>
                <ul>
                    {props.messages.map((message) => {
                        return <li>{message}!!</li>
                    })}
                </ul>
            </Layout>
        );
    }

    app.get('/', (c) => {
        const messages = ['Good Morning', 'Good Evening', 'Good Night'];
        return c.html(<Top messages={messages} />)
    })

    export default app

WEBサーバを立ち上げよう。

    $ cd $REPO/myWEBserver
    $ bun dev

ブラウザで <http://localhost:3000/> を開こう。こんな画面が見られるはずだ。

<figure>
<img src="https://kazurayam.github.io/KzHonoProjectBase/images/myWEBserver_1_index.png" alt="myWEBserver 1 index" />
</figure>

### ユニットテストをする

`src/index.tsx` をユニットテストしよう。 `src/index.test.tsx` を書いた。

    // src/index.test.tsx

    import {beforeEach, describe, expect, test} from 'bun:test'

    // You can use renderToString function from 'hono/jsx/dom/server' to explicitly convert a JSX element into its HTML string reporesentation.
    // This function is used form server-side rendering JSX into a string
    import {renderToString} from 'hono/jsx/dom/server';

    // '@testing-library/dom' provides utilities to query the JavaScript document object
    import { screen } from '@testing-library/dom';

    // 1. Define a sample Hono JSX component
    const Greeting = ({ name } : { name: string}) => {
        return <div>Hello, {name}!</div>
    };

    // 2. ./bunfig.toml & ./happydom.ts tunes the global property "document" accessible without the browser runtime

    describe('Greeting Component', () => {
        test('renders the correct name', () => {
            // 3. Render the Hono JSX component into a string
            // 4. Insert the rendered HTML into the JSDom body
            document.body.innerHTML = renderToString(<Greeting name="Hono"/>);
            // 5. Use DOM testing library or standard DOM APIs to make assertions
            const greetingElement: HTMLElement = screen.getByText(/Hello, Hono!/i);
            //expect(greetingElement).toBeInTheDocument(); // Requires jest-dom matcher
            expect(greetingElement.tagName).toBe('DIV')
        });
    });

    describe('smoke test', () => {
        test('1 + 1 makes 2', () => {
            expect(1 + 1).toBe(2);
        })
    })

`bun test` コマンドを実行しよう。

    $ cd $REPO/myWEBserver
    $ bun test
    bun test v1.3.4 (5eb2145b)

    src/index.test.tsx:
    ✓ Greeting Component > renders the correct name [5.14ms]
    ✓ smoke test > 1 + 1 makes 2

     2 pass
     0 fail
     2 expect() calls
    Ran 2 tests across 1 file. [219.00ms]

### happy-domを使う

上記のテストは JavaScript組み込みの `document` オブジェクトを参照している。ブラウザ内蔵のJavaScriptランタイムの上では `document` オブジェクトが参照できて当然だが、Node.jsには `document` オブジェクトが組み込まれていない。だからNode.jsで\`document\` オブジェクトを参照するテストを書きたければ JSDom を利用するのが常道だ。ところがいまわたくしkazurayamはNode.jsでなくBunの上で `document` オブジェクトを参照するテストを書きたい。どうすべきか？

答えば "happy-domを使え" だ。JSDomはBunでは動かない。下記のBunドキュメントを参照のこと。

- [Write browser DOM tests with Bun and happy-dom](https://bun.com/docs/guides/test/happy-dom)

このドキュメントの指図にしたがって `happydom.ts` と `bunfig.toml` を書いた。

    // happydom.ts
    import { GlobalRegistrator } from "@happy-dom/global-registrator";
    GlobalRegistrator.register();

    # bunfig.toml
    [test]
    preload = ["./happydom.ts"]
    root = "src"

`bun test` コマンドは `happydom.ts` を最初に実行する。するとhappy-domが実装した `document` オブジェクトが参照可能になる。

### E2Eテストをする

HTMLを応答するWebサーバをブラウザを介してテストしよう。Playwrightを使って。
