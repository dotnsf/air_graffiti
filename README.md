# Air Graffiti

## Overview

スマートフォンを簡易オリエンテーションセンサー化してスマートフォンをペンに見立て、センサーの先端で描画した手描き文字を認識するサンプルです。


## Requisites

ジャイロセンサーが搭載されたスマートフォンのウェブブラウザが必要です。 スマートフォンが Android の場合はほぼ問題なく大丈夫だと思っています。

iOS 搭載機を使って Safari ブラウザで利用する場合、iOS のバージョンによってはジャイロセンサー情報を取得するために以下の設定が事前・動作中に必要です：

- iOS 12.1 以下の場合、

  - 事前設定、動作中設定ともに不要です。そのまま動くはずです。

- iOS 12.2 以上 13 未満の場合、

  - 事前に **設定 - Safari の「モーションと画面の向きのアクセス」を ON** に設定しておいてください。以下の画面では OFF の状態です。

  - ![設定 - Safari](./imgs/ios12.2.png "設定 - Safari")

- iOS 13 以上の場合、

  - 事前設定は不要ですが、起動直後に **「センサーの有効化」** と書かれた画面上部のボタンをクリックする必要があります：

  - ![センサーの有効化](./imgs/ios13_sensor1.png "センサーの有効化")

  - すると **「動作と方向へのアクセス」** への許可を求めるダイアログが表示されます。ここで **「許可」** を選択してください：

  - ![センサーの有効化を許可](./imgs/ios13_sensor2.png "センサーの有効化を許可")

  - 「センサーの有効化」ボタンが消え、画面にピンクの矩形が表示されれば準備完了です：

  - ![センサーの有効化完了](./imgs/ios13_sensor3.png "センサーの有効化完了")


## Reference

[端末画面の向きと端末のモーション](https://developers.google.com/web/fundamentals/native-hardware/device-orientation?hl=ja)


## Licensing

This code is licensed under MIT.


## Copyright

2022 [K.Kimura @ Juge.Me](https://github.com/dotnsf) all rights reserved.
