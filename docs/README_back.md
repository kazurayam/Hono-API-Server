# Hono-API-Server


[TypeScript初心者の私がHonoでバックエンドサーバー構築してみた](https://zenn.dev/yuzunosk55/articles/09275c72cf051b) を写経する

## 操作

### サーバーを起動する

```
$ cd Hono-API-Server/my-app
$ bun run dev
```

### クライアントを起動する

サーバーとは別のTerminalで

```
$ cd Hono-API-Server/my-app
$ bun run client
```

clientプロセスがholdする。それを停止するには Ctrl+C する。

# HTMLを応答するServerを作って、応答をテストする、JSDomを利用する


```
$ cd Hono-API-Server
$ bun create hono@latest my-html-app
```
bun
yes
bun

See https://hono-ja.pages.dev/docs/guides/jsx


## Honoでvitestを使うべきか?

AIによれば...

はい、HonoプロジェクトではVitestを使うことが強く推奨されます。Honoの公式ドキュメントや多くの開発事例でVitestが標準的なテストフレームワークとして採用されており、非常に相性が良いとされています。
HonoでVitestを使うべき理由
公式サポートと推奨: Honoの公式ガイドでは、テスト方法の一つとしてVitestが紹介されています。特にCloudflare Workers環境では、@cloudflare/vitest-pool-workers という専用の統合パッケージの使用が推奨されています。
Honoのヘルパーとの連携: Honoは hono/testing モジュールを通じて testClient という便利なヘルパーを提供しており、Vitestと組み合わせることで、サーバーを起動せずにモックリクエストを作成し、アプリケーションのテストを簡単に行うことができます。
Viteエコシステムとの親和性: VitestはViteの設定をそのまま利用できるため、Honoプロジェクト（Viteを基盤としていることが多い）において設定の一貫性を保ちやすく、開発体験（DX）が向上します。
高速性: Vitestは高速なテスト実行を特徴としており、Honoの軽量で高速な特性とマッチします。
マルチランタイム対応: HonoはCloudflare Workers、Deno、Bun、Node.jsなど様々なランタイムに対応していますが、Vitestもこれらの環境でのテストをサポートする柔軟性を持っています。
導入方法
Honoのアプリケーションテストは、app.request() メソッドにリクエストオブジェクトを渡すだけで実行できます。これにVitestの describe や test 関数、expect アサーションを組み合わせるのが一般的な方法です。
詳細な設定や具体的なコード例については、Hono公式ドキュメントのテストガイドや、Cloudflare WorkersでのVitest統合に関するCloudflare開発者向けドキュメントを参照すると良いでしょう。
結論として、Honoでテストを導入する際は、Vitestが最もスムーズで効率的な選択肢となります。

## Hono test JSX using JSDom

To test Hono JSX components using JSDom, you can use the built-in support in testing frameworks like Vitest or Jest by configuring the test environment to jsdom. The process involves rendering your Hono JSX into a JSDom environment and then using DOM testing utilities (like Testing Library) to make assertions on the rendered output.
Prerequisites
You will need the following packages installed in your project:
hono: The Hono framework.
vitest (or jest): Your test runner.
jsdom: The DOM implementation for Node.js.
@testing-library/dom (optional but recommended for user-centric testing).
bash
npm install -D vitest jsdom @testing-library/dom
# or yarn add -D vitest jsdom @testing-library/dom
Configuration (Vitest)
In your vite.config.ts (or vitest.config.ts), ensure the jsdom environment is set:
typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
test: {
environment: 'jsdom', // Use JSDom for DOM testing
},
});
Testing Hono JSX with JSDom
Hono JSX can be rendered into a string on the server side or used with hono/jsx/dom for client-side functionality. For testing purposes, you typically render the component and use JSDom to interact with the resulting DOM structure.
Here is an example using Vitest and JSDom:
typescript
// test/component.test.tsx
import { describe, test, expect, beforeEach } from 'vitest';
// 'hono/jsx' provides server-side rendering to a string
import { render } from 'hono/jsx';
// '@testing-library/dom' provides utilities to query the JSDom document
import { screen, getByText } from '@testing-library/dom';
import { JSDOM } from 'jsdom';

// 1. Define a sample Hono JSX component
const Greeting = ({ name }: { name: string }) => {
return <div>Hello, {name}!</div>;
};

// 2. Set up JSDom environment before each test
let dom: JSDOM;
let document: Document;

beforeEach(() => {
dom = new JSDOM('<!DOCTYPE html><body><div id="app"></div></body>');
document = dom.window.document;
// Ensure the global environment uses the JSDom document
Object.defineProperty(global, 'document', { value: document });
});

describe('Greeting Component', () => {
test('renders the correct name', () => {
// 3. Render the Hono JSX component into a string
const htmlString = render(<Greeting name="Hono" />);

    // 4. Insert the rendered HTML into the JSDom body
    document.body.innerHTML = htmlString;

    // 5. Use DOM testing library or standard DOM APIs to make assertions
    const greetingElement = screen.getByText(/Hello, Hono!/i);
    expect(greetingElement).toBeInTheDocument(); // Requires jest-dom matchers
    expect(greetingElement.tagName).toBe('DIV');
});
});
Key Considerations
Server-Side Rendering (SSR) in Tests: Hono's primary use of JSX is often for SSR. The example above captures the rendered HTML string and manually inserts it into the JSDom document.body for testing purposes.
Client Components (hono/jsx/dom): If you are using Hono's client-side components with hooks like useState, you would typically mount them differently, potentially leveraging the @testing-library/react (which builds on DOM testing library and JSDom) or similar specific utilities that handle the client-side lifecycle and re-rendering.
Testing Routes: To test components rendered within a full Hono application route, the official Hono testing guide recommends using the app.request() method and asserting on the response text, rather than using JSDom to inspect the body content.
For more details on testing Hono applications, refer to the official Hono Testing documentation and Hono JSX documentation.


## PlaywrightによるWeb UIテスト

See https://gist.github.com/toms74209200/d58c127ffa88d7f508e6bf117aaa3b90

```
$ cd Hono-API-Server
$ mkdir my-playwright-project
$ bun create playwright
...
$ ls
node_modules            playwright.config.ts
package-lock.json       tests
package.json
```

ブラウザをInstall
```
$ bun x playwright install
```

依存関係のインストール
```
$ bun x playwright install-deps
```

package.jsonファイルを修正
```
  "scripts": {
    "test:e2e": "playwright test",
    "show-report": "playwright show-report"
  },
```

テストを実行する
```
$ bun run test:e2e
```

レポートをブラウザで開く
```
$ bun run playwright show-report
```
