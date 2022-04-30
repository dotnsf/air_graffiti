# Air Graffiti

## Overview

スマートフォンを簡易オリエンテーションセンサー化してスマートフォンをペンに見立て、センサーの先端で描画した手描き文字を認識するサンプルです。


## Requisites

ジャイロセンサーが搭載されたスマートフォンのウェブブラウザが必要です。 スマートフォンが iOS / Android の場合はほぼ問題なく大丈夫だと思っています。


## Environment Values

- `DATABASE_URL`

  - Required

  - URI string of PostgreSQL database, ex "postgres://user:pass@host:port/db"

- `PGSSLMODE`

  - Optional. Required if you want to set PostgreSQL SSL mode.

  - Ex. `no-verify`

- `WEBHOOK_URL`

  - Optional. Required if you want to enable Webhook.

  - URI string of Webhook which would be fired if letter would be recognized.

- `CORS`

  - Optional. Required if you want to enable CORS for PostgreSQL/Webhook API.

  - Origin URL to allow CORS.

- `PORT`

  - Optional. Required if you want to change server's listening port from 8080.

  - Port number(Default 8080).


## Reference

[端末画面の向きと端末のモーション](https://developers.google.com/web/fundamentals/native-hardware/device-orientation?hl=ja)


## Licensing

This code is licensed under MIT.


## Copyright

2022 [K.Kimura @ Juge.Me](https://github.com/dotnsf) all rights reserved.
