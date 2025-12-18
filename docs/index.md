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

### Webサーバのコードを書く

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

上記のテストは JavaScript組み込みの documentオブジェクトを参照している。ブラウザ内蔵のJavaScriptランタイムの上では documentオブジェクトが参照できるが、Node.jsには documentオブジェクトが組み込まれていない。だからNode.jsでdocumentオブジェクトを参照するテストを書きたければ JSDom を利用するのが常道だ。ところがいまわたくしkazurayamはNode.jsでなくBunの上でdocumentオブジェクトを参照するテストを書きたい。試してみてわかったのだが、JSDomはBunのうえでは動かない。さて、どうする？

答えは "happy-domを使え" だ。下記のドキュメントを参照せよ。

- [Write browser DOM tests with Bun and happy-dom](https://bun.com/docs/guides/test/happy-dom)

このドキュメントの指図にしたがって `myWEBserver/happydom.ts` と `myWEBserver/bunfig.toml` を書いた。

    // happydom.ts
    import { GlobalRegistrator } from "@happy-dom/global-registrator";
    GlobalRegistrator.register();

    # bunfig.toml
    [test]
    preload = ["./happydom.ts"]
    root = "src"

この設定があると `bun test` コマンドはユーザのテストを実行する前に `happydom.ts` を実行する。するとhappy-domが実装したモノが `document` オブジェクトとして参照可能になる。Bunの上で documentオブジェクトを参照するテストが書けるようになる。

### E2Eテストをする

HTMLを応答するWebサーバをWebブラウザを介してE2Eテストしよう。Playwrightを使おう。下記のドキュメントの設定を参考にした。
- [Playwright Test/Configuration](https://playwright.dev/docs/test-configuration)

#### プロジェクトにPlaywrightをインストールする

Playwrightをインストールして、設定ファイルとサンプルコードを生成しよう。

    $ cd $REPO/myWEBserver
    $ bun create playwright
    Getting started with writing end-to-end tests with Playwright:
    Initializing project in '.'
    ✔ Where to put your end-to-end tests? · e2e
    ✔ Add a GitHub Actions workflow? (Y/n) · true
    ✔ Install Playwright browsers (can be done manually via 'npx playwright install')? (Y/n) · true
    Installing Playwright Test (npm install --save-dev @playwright/test)…

    added 3 packages, changed 1 package, and audited 9 packages in 8s

    found 0 vulnerabilities
    Installing Types (npm install --save-dev @types/node)…

    added 1 package, changed 1 package, and audited 10 packages in 2s

    found 0 vulnerabilities
    Writing playwright.config.ts.
    Writing .github/workflows/playwright.yml.
    Writing e2e/example.spec.ts.
    Writing package.json.
    Downloading browsers (npx playwright install)…
    ✔ Success! Created a Playwright Test project at /Users/kazurayam/$REPO/myAPIserver

    Inside that directory, you can run several commands:

      npx playwright test
        Runs the end-to-end tests.

      npx playwright test --ui
        Starts the interactive UI mode.

      npx playwright test --project=chromium
        Runs the tests only on Desktop Chrome.

      npx playwright test example
        Runs the tests in a specific file.

      npx playwright test --debug
        Runs the tests in debug mode.

      npx playwright codegen
        Auto generate tests with Codegen.

    We suggest that you begin by typing:

        npx playwright test

    And check out the following files:
      - ./tests/example.spec.ts - Example end-to-end test
      - ./playwright.config.ts - Playwright Test configuration

    Visit https://playwright.dev/docs/intro for more information. ✨

    Happy hacking! 🎭

`bun create` コマンドを実行したが、内部的にはnpmが使われているようだ。Playwrightのインストールが完了したら `bun install` コマンドを実行して `package.json` を更新しよう。

    $ cd $REPO/myWEBserver
    $ bun install

#### E2Eテストコードを書く

[e2e/index.spec.ts](https://github.com/kazurayam/KzHonoProjectBase/blob/master/myWEBserver/e2e/example.spec.ts) を書いた。

    import { test, expect } from '@playwright/test';

    test('has title', async ({ page }) => {
      await page.goto('https://playwright.dev/');

      // Expect a title "to contain" a substring.
      await expect(page).toHaveTitle(/Playwright/);
    });

    test('get started link', async ({ page }) => {
      await page.goto('https://playwright.dev/');

      // Click the get started link.
      await page.getByRole('link', { name: 'Get started' }).click();

      // Expects page to have a heading with the name of Installation.
      await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
    });

### E2Eテストを実行する

[myWEBserver/package.json](https://github.com/kazurayam/KzHonoProjectBase/blob/master/myWEBserver/package.json) の `scripts` セクションに `e2e` サブコマンドと `show` サブコマンドを追加した。

      "scripts": {
        "dev": "bun run --hot src/index.tsx",
        "e2e": "bunx playwright test",
        "show": "bunx playwright show-report",
        "start": "wrangler dev src/index.tsx",

PlaywrightのE2Eテストを実行しよう。

    $ cd $REPO/myWEBserver
    $ bun e2e
    $ bunx playwright test

    Running 9 tests using 4 workers
      9 passed (11.9s)

    To open last HTML report run:

      npx playwright show-report

\`bun report\`コマンドを実行するとPlaywrightが生成したHTMLレポートがブラウザで開かれる。

<figure>
<img src="https://kazurayam.github.io/KzHonoProjectBase/images/myWEBserver_2_show-report.png" alt="myWEBserver 2 show report" />
</figure>

myWEBserverに対するE2Eテストが動いた。

## エッジサーバに配備しよう

myWEBserverを link:CloudFlare Workersに配備しよう。次のドキュメントを参考にした。

- [Cloudflare Workers with Hono on bun を試す](https://zenn.dev/watsuyo_2/scraps/76e60a75ada45e)

### Cloudflareに自分用のアカウントを作成する

ブラウザで下記のURLを開きCloundflareアカウントを登録した。

- <https://dash.cloudflare.com/sign-up/workers-and-pages>

わたくしkazurayamはGitHubアカウントを持っている。CloudflareアカウントをGitHubアカウントに連携させる形をとった。

### wranglerをインストールする

`wrangler` CLIをインストールしよう。

    $ cd $REPO/myWEBserver
    $ bun add -d @cloudflare/workers-types wrangler
    bun add v1.3.4 (5eb2145b)

    installed @cloudflare/workers-types@4.20251217.0
    installed wrangler@4.55.0 with binaries:
     - wrangler
     - wrangler2

    48 packages installed [43.57s]
    $ wrangler -v

     ⛅️ wrangler 4.55.0

`package.json` に `start` サブコマンドと `deploy` サブコマンドを追加した。

      "scripts": {
        "dev": "bun run --hot src/index.tsx",
        "e2e": "bunx playwright test",
        "show": "bunx playwright show-report",
        "start": "wrangler dev src/index.tsx",
        "deploy": "wrangler deploy --minify src/index.tsx"
      },

### Cloudflare Workersをローカルでシュミレートしてみる

    $ bun run start
    $ wrangler dev src/index.tsx

     ⛅️ wrangler 4.55.0
    ───────────────────
    ▲ [WARNING] No compatibility_date was specified. Using the installed Workers runtime's latest supported date: 2025-12-13.

      ❯❯ Add one to your wrangler.toml file:
      compatibility_date = "2025-12-13", or
      ❯❯ Pass it in your terminal: wrangler dev
      [<SCRIPT>] --compatibility-date=2025-12-13

      See
      https://developers.cloudflare.com/workers/platform/compatibility-dates/
      for more information.

    ╭──────────────────────────────────────────────────────────────────────╮
    │  [b] open a browser [d] open devtools [c] clear console [x] to exit  │
    ╰──────────────────────────────────────────────────────────────────────╯
    ⎔ Starting local server...
    [wrangler:info] Ready on http://localhost:8787

ブラウザで <http://localhost:8787> を開くと予想通りの画面が見えた。

<figure>
<img src="https://kazurayam.github.io/KzHonoProjectBase/images/myWEBserver_3_wrangler_dev.png" alt="myWEBserver 3 wrangler dev" />
</figure>

## プロジェクトをCloudFlare Workersに配備する

CloudFlare Workestにアプリを配備するためには `wrangler.toml` を書く必要がある。 `myWEBserver/wrangler.toml` を書いた。

    name = "kzhonoprojectbase-mywebserver"
    compatibility_date = "2025-12-13"

前に `bun run start` を実行して wrangler dev を実行した時、コンソールにメッセージが表示された。compatibility\_dateの値をどうすべきかがアドバイスされているから、それに従うのみ。

ターミナル上のコマンドラインでCloudflare WorkersへアプリをデプロイするにはCloudflareによるauthorizationを受ける必要がある。

    $ bunx wrangler login
    $ bunx wrangler login

     ⛅️ wrangler 4.55.0
    ───────────────────
    Attempting to login via OAuth...

するとブラウザが開いてこんな画面が表示された。

<figure>
<img src="https://kazurayam.github.io/KzHonoProjectBase/images/myWEBserver_4_Allow_Wrangler_access_to_your_Cloudflare_account.png" alt="myWEBserver 4 Allow Wrangler access to your Cloudflare account" />
</figure>

Allowボタンを押下した。

<figure>
<img src="https://kazurayam.github.io/KzHonoProjectBase/images/myWEBserver_5_You_have_granded_authorization_to_Wrangler.png" alt="myWEBserver 5 You have granded authorization to Wrangler" />
</figure>

package.jsonに記述したdeployコマンドを使ってコマンドラインでwranglerを実行してCloudflare Workersへデプロイしよう。

    $ bun run deploy
    $ wrangler deploy --minify src/index.tsx

     ⛅️ wrangler 4.55.0
    ───────────────────
    Total Upload: 27.67 KiB / gzip: 11.25 KiB
    Uploaded kzhonoprojectbase-mywebserver (3.07 sec)
    Deployed kzhonoprojectbase-mywebserver triggers (1.23 sec)
      https://kzhonoprojectbase-mywebserver.kazuaki-urayama.workers.dev
    Current Version ID: 7432d089-e199-44d5-8ce0-fe1930d40fad

Cloudflareのコンソールを見ると新しいdeploymentが作成されているのがわかる。

<figure>
<img src="https://kazurayam.github.io/KzHonoProjectBase/images/myWEBserver_6_successful_deploy.png" alt="myWEBserver 6 successful deploy" />
</figure>

<https://kzhonoprojectbase-mywebserver.kazuaki-urayama.workers.dev/> というURLが作られた。

<figure>
<img src="https://kazurayam.github.io/KzHonoProjectBase/images/myWEBserver_7_index_on_worker.png" alt="myWEBserver 7 index on worker" />
</figure>

ああ、たしかにCloudflare Worksの上にわたしが自作したwebアプリがデプロイされている。成功だ。

## GitHub ActionでWranglerを動かしてデプロイできるようにする

コマンドラインで `bun run deploy` を実行する方法でもいいが、それに加えてCI/CD環境を構築したいものだ。GitHub Actionで実現したい。

<https://kasaharu.hatenablog.com/entry/20230904/1693831653> を参考にした

[Wrangler GitHub Action](https://github.com/marketplace/actions/deploy-to-cloudflare-workers-with-wrangler)

APIトークンを取得しよう。

- <https://dash.cloudflare.com/profile/api-tokens>

ここで "Edit Cloudflare Workers" のテンプレートを使って "KzHonoProjectBase" という名前のAPIトークンを作った。
