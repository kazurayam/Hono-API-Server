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

ユニット・テストが動いた。

## HTMLを応答するWebサーバを作る

### JSXを使えるようにする

### ユニットテストをする、documentオブジェクトにアクセスしながら

### E2Eテストをする

## Lorem ipsum

Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.

### Ut enim ad minim veriam

Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

#### Duis aute irure dolor

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.

##### Excepteur sint occaecat cupidatat

Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

## Quo usque tandem abutere

Quo usque tandem abutere, Catilina, patientia nostra?

## Header with (& - \_ : ; ) non Latin Characters

Quam diu etiam furor iste tuus nos eludet?

## Source code inclusion example

    #!/bin/bash

    # Under the current working directory, convert all the files
    # with name ending with `_.adoc` into `.md`.
    # A file with name `*_.adoc` is an Asciidoc document file.
    # A file with name `*.md` is a Markdown document file.
    # E.g, `index_.adoc` will be converted into `index.md`
    #
    # However, ffiles with name which starts with with `_` will be ignored.
    # E.g, `_index_.adoc` will be ignored.
    #
    # How to run this: in the command line, just type
    #
    #     `> ./adoc2md.sh`
    #
    # By specifying `-t` option in the command line,
    #
    #     `> ./adoc2md.sh -t`
    #
    # you can prepend a text segment into the output .md file:
    #
    # ```
    # - Table of Contents
    # {:toc}
    #
    # ```
    # This text segment will affect the [Jekyll](https://docs.github.com/en/pages/setting-up-a-github-pages-site-with-jekyll/about-github-pages-and-jekyll)
    # used by GitHub Pages to generate a table of contents.
    #

    requireTOC=false

    optstring="t"
    while getopts ${optstring} arg; do
      case ${arg} in
        t)
            requireTOC=true
            ;;
        ?)
            ;;
      esac
    done

    function processFile() {
      fname=$1
      #echo "fname=${fname}"
      #  using Asciidoctor, convert a *.adoc file into a docbook in XML
      md=${fname//adoc/md}
      xml=${fname//adoc/xml}
      echo "converting $fname into $md"
      asciidoctor -b docbook -a leveloffset=+1 -o - "$fname" > "$xml"
      # using Pandoc, generate a Markdown file without TOC
      cat "$xml" | pandoc --markdown-headings=atx --wrap=preserve -t markdown_strict -f docbook - > "$md"
      #echo deleting $xml
      rm -f "$xml"

      # We named `index_.adoc` rather than `index.adoc` because GitHub puts precedence to `index.adoc` over `index.md`. We want `index.md` to be presented first, not `*.adoc`. Therefore we named our adoc file with `*_.adoc` postfix.
      # This trick required further treatment.
      # `index_.adoc` will result `index_.adoc`. But we
      # want the final result to be `index.md`.
      # So, we will rename `*_.md` into `*.md`.
      # in other words, chomp an underline character (_) before `.md``
      # e.g,
      #   ./index_.adoc    -> ./index.md
      #   ./index-ja_.md -> ./index-ja.md
      newmd=${md%_.md}.md
      echo renaming $md to $newmd
      mv $md $newmd

      # Slightly modify the generated *.md file.
      # Prepend a text segment:
      # ```
      # - Table of contents
      # {:toc}
      # ```
      if [ $requireTOC = true ]; then
        echo "- Table of contents" > temp.md
        echo "{:toc}" >> temp.md
        echo "" >> temp.md
        cat $newmd >> temp.md
        cat temp.md > $newmd
        rm temp.md
        echo prepended the TOC segement in $newmd
      fi
      # just a blank line to separate the *.adoc files processed
      echo ""
    }



    # iterate over all *.adoc files
    find . -iname "*_.adoc" -type f -maxdepth 1 -not -name "_*.adoc" | while read fname; do
      processFile $fname
    done

## Diagram example

Generated using [PlantUML](https://plantuml.com/ja/)

<figure>
<img src="https://kazurayam.github.io/adoc2md/diagrams/out/sequence/sequence.png" alt="sequence" />
</figure>

## 宮沢賢治の詩その1

心象スケッチ　春と修羅

    わたくしといふ現象は
    仮定された有機交流電燈の
    ひとつの青い照明です
    （あらゆる透明な幽霊の複合体）
    風景やみんなといつしよに
    せはしくせはしく明滅しながら
    いかにもたしかにともりつづける
    因果交流電燈の
    ひとつの青い照明です
    （ひかりはたもち　その電燈は失はれ）

    これらは二十二箇月の
    過去とかんずる方角から
    紙と鉱質インクをつらね
    （すべてわたくしと明滅し
    　みんなが同時に感ずるもの）
    ここまでたもちつゞけられた
    かげとひかりのひとくさりづつ
    そのとほりの心象スケッチです

## 宮沢賢治の詩その2

    雨ニモマケズ
    風ニモマケズ
    雪ニモ夏ノ暑サニモマケヌ
    丈夫ナカラダヲモチ
    欲ハナク
    決シテ瞋ラズ
    イツモシヅカニワラッテヰル
    一日ニ玄米四合ト
    味噌ト少シノ野菜ヲタベ
    アラユルコトヲ
    ジブンノカンジョウニ入レズニ
    ヨクミキキシワカリ
    ソシテワスレズ
    野原ノ松ノ林ノ蔭ノ
    小サナ萱ブキノ小屋にヰテ
    東に病気ノコドモアレバ
    行ッテ看病シテヤリ
    西ニ疲レタ母アレバ
    行ッテソノ稲ノ束ヲ負ヒ
    南ニシニサウナ人アレバ
    行ッテコハガラナクテモイゝトイヒ
    北にケンクヮヤソショウガアレバ
    ツマラナイカラヤメロとイヒ
    ヒドリノトキハナミダヲナガし
    サムサノナツハオロオロアルキ
    ミンナニデクノボー トヨバレ
    ホメラレモセズ
    クニモサレズ
    サウイフモノニ
    ワタシハナリタイ

    南無無辺行菩薩
    南無上行菩薩
    南無多宝如来
    南無妙法蓮華経
    南無釈迦牟尼仏
    南無浄行菩薩
    南無安立行菩薩

## Dolorem ipsum

Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Sed tempus urna et pharetra pharetra massa. Praesent tristique magna sit amet purus. Fermentum et sollicitudin ac orci phasellus egestas tellus rutrum tellus. In cursus turpis massa tincidunt dui ut. Massa tincidunt nunc pulvinar sapien et ligula ullamcorper. Facilisis mauris sit amet massa vitae tortor condimentum. Sapien faucibus et molestie ac feugiat sed lectus vestibulum. Eu turpis egestas pretium aenean pharetra magna ac placerat. Nulla aliquet porttitor lacus luctus accumsan tortor posuere. Sit amet purus gravida quis blandit turpis cursus. Suspendisse sed nisi lacus sed. Laoreet non curabitur gravida arcu ac. Dolor sit amet consectetur adipiscing elit pellentesque. Egestas quis ipsum suspendisse ultrices gravida dictum fusce ut placerat.

Praesent tristique magna sit amet purus gravida quis blandit turpis. Vitae congue mauris rhoncus aenean vel elit scelerisque mauris. Suspendisse faucibus interdum posuere lorem ipsum dolor sit. Sem integer vitae justo eget magna fermentum iaculis eu. Felis bibendum ut tristique et egestas. Vel orci porta non pulvinar neque laoreet. Ac tortor vitae purus faucibus ornare suspendisse sed. In mollis nunc sed id semper. Pellentesque id nibh tortor id aliquet lectus proin. Id faucibus nisl tincidunt eget nullam non nisi est. Senectus et netus et malesuada fames ac turpis egestas. Viverra vitae congue eu consequat ac. Vel pharetra vel turpis nunc eget lorem dolor sed viverra. Sodales ut eu sem integer vitae. Pharetra vel turpis nunc eget lorem. Nam at lectus urna duis convallis convallis tellus. Massa tempor nec feugiat nisl pretium fusce id velit ut. Et ultrices neque ornare aenean euismod elementum nisi. Ut morbi tincidunt augue interdum velit. Fermentum iaculis eu non diam phasellus vestibulum lorem sed risus.

Et sollicitudin ac orci phasellus egestas tellus. Sit amet purus gravida quis blandit turpis cursus. Interdum varius sit amet mattis vulputate enim nulla aliquet. Quam id leo in vitae turpis massa sed elementum. Justo donec enim diam vulputate ut pharetra sit amet aliquam. Mauris commodo quis imperdiet massa tincidunt nunc pulvinar sapien. Leo integer malesuada nunc vel risus commodo viverra maecenas. Neque viverra justo nec ultrices dui sapien eget mi. Vel risus commodo viverra maecenas. Purus in massa tempor nec feugiat nisl pretium fusce. In nisl nisi scelerisque eu ultrices vitae. Nulla aliquet porttitor lacus luctus accumsan tortor posuere ac ut. Elit ut aliquam purus sit amet luctus venenatis lectus. Ultrices sagittis orci a scelerisque purus semper. Aliquam sem et tortor consequat id. Sed vulputate odio ut enim blandit volutpat maecenas volutpat. Sed euismod nisi porta lorem mollis aliquam.

Faucibus ornare suspendisse sed nisi lacus sed viverra. Duis at tellus at urna. Sem fringilla ut morbi tincidunt augue interdum. Proin libero nunc consequat interdum varius sit amet. Elementum facilisis leo vel fringilla est. In fermentum posuere urna nec tincidunt. Urna id volutpat lacus laoreet non curabitur gravida arcu ac. Arcu ac tortor dignissim convallis aenean et tortor. Odio facilisis mauris sit amet massa vitae tortor condimentum. At tellus at urna condimentum mattis pellentesque. Sed tempus urna et pharetra pharetra massa. Gravida quis blandit turpis cursus in hac. Enim neque volutpat ac tincidunt vitae semper quis lectus nulla. Egestas sed tempus urna et pharetra pharetra massa massa ultricies.

Aliquam purus sit amet luctus venenatis lectus magna. Vitae ultricies leo integer malesuada. Sit amet facilisis magna etiam tempor orci eu. Nec nam aliquam sem et tortor consequat id porta. Est ante in nibh mauris. Eu feugiat pretium nibh ipsum consequat nisl vel. Tristique risus nec feugiat in fermentum posuere urna nec tincidunt. Mauris vitae ultricies leo integer malesuada nunc vel risus commodo. Ultrices neque ornare aenean euismod elementum nisi quis eleifend quam. Lacus vel facilisis volutpat est velit egestas. Non curabitur gravida arcu ac tortor dignissim convallis aenean et. Volutpat est velit egestas dui id ornare arcu odio ut. Venenatis a condimentum vitae sapien pellentesque. Amet nisl suscipit adipiscing bibendum est ultricies integer. Lectus quam id leo in. Non curabitur gravida arcu ac tortor dignissim convallis aenean.
