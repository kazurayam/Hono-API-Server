See [BunからPlaywrightを使う](https://gist.github.com/toms74209200/d58c127ffa88d7f508e6bf117aaa3b90)


To install dependencies:
```sh
cd my-html-app
bun create playwright
```
chose TypeScript
where to put the tests?: tests
GitHub Actions?: false
install Playwright browsers?: true


To install Playwright browsers:
```sh
bun x playwright install
```

To install playwright dependencies
```
bun x playwright install-deps
```

package.jsonにe2eコマンドとshowコマンドを追加

```
  {
    "scripts": {
        "e2e": "bunx playwright test",
        "show": "bunx playwright show-report"
    }
  }
```

Playwrightを実行
```
bun run e2e
```

レポートをブラウザで表示
```
bun run show
```
