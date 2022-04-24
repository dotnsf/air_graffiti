//. common.js
var isTouch = false;
var orientationData = [];
var letter = null;

function ClickRequestDeviceSensorForTraining(){
  //. ユーザーに「許可」を明示させる必要がある
  DeviceOrientationEvent.requestPermission().then( function( response ){
    if( response === 'granted' ){
      letter = prompt( '学習させる文字を入力してください。', 'あ' );
      if( letter ){
        window.addEventListener( "deviceorientation", deviceOrientation );
        $('#sensorrequest').css( 'display', 'none' );
        $('#cdiv').css( 'display', 'block' );
      }
    }
  }).catch( function( e ){
    console.log( e );
  });
}

function ClickRequestDeviceSensorForQuery(){
  //. ユーザーに「許可」を明示させる必要がある
  DeviceOrientationEvent.requestPermission().then( function( response ){
    if( response === 'granted' ){
      window.addEventListener( "deviceorientation", deviceOrientation );
      $('#sensorrequest').css( 'display', 'none' );
      $('#cdiv').css( 'display', 'block' );
    }
  }).catch( function( e ){
    console.log( e );
  });
}

$(function(){
  init();
});

function init(){
  //. リサイズ時に Canvas サイズを変更する
  $(window).on( 'load resize', function(){
    resized();
  });
  resized();

  //. スクロール禁止
  var movefun = function( event ){
    event.preventDefault();
  }
  window.addEventListener( 'touchmove', movefun, { passive: false } );
}

var canvas_width = 200;
var canvas_height = 200;
function resized(){
  var browserWidth = window.innerWidth;
  var browserHeight = window.innerHeight;
  var canvas = document.getElementById( 'mycanvas' );
  if( canvas && canvas.getContext ){
    canvas.width = canvas_width = browserWidth * 0.8;
    canvas.height = canvas_height = browserHeight * 0.4;

    canvas_width = canvas.width;
    canvas_height = canvas.height;
  }
}

function touchStart( e ){
  e.preventDefault();
  isTouch = true;
  orientationData = [];
}

function touchEndForTraining( e ){
  e.preventDefault();
  isTouch = false;

  if( orientationData && orientationData.length > 50 ){
    //. 描画
    var cvs = document.getElementById( "mycanvas" );
    var ctx = cvs.getContext( "2d" );
    ctx.beginPath();

    //. 全体を白でベタ塗り
    ctx.fillStyle = "rgb( 255, 255, 255 )";
    ctx.fillRect( 0, 0, canvas_width, canvas_height );

    var abg = null;
    var x, y;

    //. 最初のデータ
    abg = orientationData[0];
    x = abg['lr'];
    y = abg['fb'];

    //. 始点をマーク（緑）
    ctx.beginPath();
    ctx.fillStyle = "rgb( 0, 255, 0 )";
    ctx.arc( 2 * x + canvas_width / 2, -2 * y + canvas_height / 2, 10, 0, Math.PI * 2, true );
    ctx.fill();

    //. 最後のデータ
    abg = orientationData[orientationData.length-1];
    x = abg['lr'];
    y = abg['fb'];

    //. 終点をマーク（赤）
    ctx.beginPath();
    ctx.fillStyle = "rgb( 255, 0, 0 )";
    ctx.arc( 2 * x + canvas_width / 2, -2 * y + canvas_height / 2, 10, 0, Math.PI * 2, true );
    ctx.fill();

    //. もう一度、最初のデータ
    abg = orientationData[0];
    x = abg['lr'];
    y = abg['fb'];

    //. 入力データの正規化
    var min_x = orientationData[0].lr;
    var max_x = orientationData[0].lr;
    var min_y = orientationData[0].fb;
    var max_y = orientationData[0].fb;

    //. ペンを始点に移動
    ctx.beginPath();
    ctx.strokeStyle = "rgb( 0, 0, 0 )";
    ctx.lineWidth = 5;
    ctx.moveTo( 2 * x + canvas_width / 2 , -2 * y + canvas_height / 2 );

    //. ２つ目以降のデータ
    for( var i = 1; i < orientationData.length; i ++ ){
      //. ペンの移動を繰り返す
      abg = orientationData[i];
      x = abg['lr'];
      y = abg['fb'];
      ctx.lineTo( 2 * x + canvas_width / 2 , -2 * y + canvas_height / 2 );

      //. 入力データの正規化
      if( x < min_x ){ min_x = x; }
      if( x > max_x ){ max_x = x; }
      if( y < min_y ){ min_y = y; }
      if( y > max_y ){ max_y = y; }
    }
    ctx.stroke();

    //. 入力データの座標を 0-100 の範囲に置き換える
    //. max_x - min_x を 100 とする時、x - min_x はどの位置になるか
    var dx = max_x - min_x;
    var dy = max_y - min_y;
    var px = [];
    var py = [];
    for( var i = 0; i < orientationData.length; i ++ ){
      px.push( 100 * ( orientationData[i].lr - min_x ) / dx );
      py.push( 100 * ( orientationData[i].fb - min_y ) / dy );
    }

    //. letter, px, py を学習データとして保存する
    var letterdata = { letter: letter, px: px, py: py };

    $.ajax({
      type: "POST",
      url: "./data",
      data: letterdata,
      success: function( data, dataType ){
        console.log( data );
      },
      error: function( jqXHR, textStatus, errorThrown ){
        console.log( textStatus + ": " + errorThrown );
      }
    });

    /*
    //. Canvas => Image
    var png = cvs.toDataURL( 'image/png' );
    document.getElementById( "resultimg" ).src = png;

    //. 画像データ取得
    png = png.replace( /^.*,/, '' );

    //. バイナリ変換
    var bin = atob( png );
    var buffer = new Uint8Array( bin.length );
    for( var i = 0; i < bin.length; i ++ ){
      buffer[i] = bin.charCodeAt( i );
    }
    var blob = new Blob( [buffer.buffer], {
      type: 'image/png'
    });

    //. POST
    var formdata = new FormData();
    formdata.append( 'image', blob );

    $.ajax({
      type: "POST",
      url: "./image",
      data: formdata,
      contentType: false,
      processData: false,
      success: function( data, dataType ){
        console.log( data );
      },
      error: function( jqXHR, textStatus, errorThrown ){
        console.log( textStatus + ": " + errorThrown );
      }
    });
    */

    orientationData = [];
  }
}

function touchEndForQuery( e ){
  e.preventDefault();
  isTouch = false;

  if( orientationData && orientationData.length > 50 ){
    //. 描画
    var cvs = document.getElementById( "mycanvas" );
    var ctx = cvs.getContext( "2d" );
    ctx.beginPath();

    //. 全体を白でベタ塗り
    ctx.fillStyle = "rgb( 255, 255, 255 )";
    ctx.fillRect( 0, 0, canvas_width, canvas_height );

    var abg = null;
    var x, y;

    //. 最初のデータ
    abg = orientationData[0];
    x = abg['lr'];
    y = abg['fb'];

    //. 始点をマーク（緑）
    ctx.beginPath();
    ctx.fillStyle = "rgb( 0, 255, 0 )";
    ctx.arc( 2 * x + canvas_width / 2, -2 * y + canvas_height / 2, 10, 0, Math.PI * 2, true );
    ctx.fill();

    //. 最後のデータ
    abg = orientationData[orientationData.length-1];
    x = abg['lr'];
    y = abg['fb'];

    //. 終点をマーク（赤）
    ctx.beginPath();
    ctx.fillStyle = "rgb( 255, 0, 0 )";
    ctx.arc( 2 * x + canvas_width / 2, -2 * y + canvas_height / 2, 10, 0, Math.PI * 2, true );
    ctx.fill();

    //. もう一度、最初のデータ
    abg = orientationData[0];
    x = abg['lr'];
    y = abg['fb'];

    //. 入力データの正規化
    var min_x = orientationData[0].lr;
    var max_x = orientationData[0].lr;
    var min_y = orientationData[0].fb;
    var max_y = orientationData[0].fb;

    //. ペンを始点に移動
    ctx.beginPath();
    ctx.strokeStyle = "rgb( 0, 0, 0 )";
    ctx.lineWidth = 5;
    ctx.moveTo( 2 * x + canvas_width / 2 , -2 * y + canvas_height / 2 );

    //. ２つ目以降のデータ
    for( var i = 1; i < orientationData.length; i ++ ){
      //. ペンの移動を繰り返す
      abg = orientationData[i];
      x = abg['lr'];
      y = abg['fb'];
      ctx.lineTo( 2 * x + canvas_width / 2 , -2 * y + canvas_height / 2 );

      //. 入力データの正規化
      if( x < min_x ){ min_x = x; }
      if( x > max_x ){ max_x = x; }
      if( y < min_y ){ min_y = y; }
      if( y > max_y ){ max_y = y; }
    }
    ctx.stroke();

    //. 入力データの座標を 0-100 の範囲に置き換える
    //. max_x - min_x を 100 とする時、x - min_x はどの位置になるか
    var dx = max_x - min_x;
    var dy = max_y - min_y;
    var px = [];
    var py = [];
    for( var i = 0; i < orientationData.length; i ++ ){
      px.push( 100 * ( orientationData[i].lr - min_x ) / dx );
      py.push( 100 * ( orientationData[i].fb - min_y ) / dy );
    }

    //. letter, px, py を学習データとして保存する
    var letterdata = { letter: letter, px: px, py: py };

    $.ajax({
      type: "POST",
      url: "./data",
      data: letterdata,
      success: function( data, dataType ){
        console.log( data );
      },
      error: function( jqXHR, textStatus, errorThrown ){
        console.log( textStatus + ": " + errorThrown );
      }
    });

    /*
    //. Canvas => Image
    var png = cvs.toDataURL( 'image/png' );
    document.getElementById( "resultimg" ).src = png;

    //. 画像データ取得
    png = png.replace( /^.*,/, '' );

    //. バイナリ変換
    var bin = atob( png );
    var buffer = new Uint8Array( bin.length );
    for( var i = 0; i < bin.length; i ++ ){
      buffer[i] = bin.charCodeAt( i );
    }
    var blob = new Blob( [buffer.buffer], {
      type: 'image/png'
    });

    //. POST
    var formdata = new FormData();
    formdata.append( 'image', blob );

    $.ajax({
      type: "POST",
      url: "./image",
      data: formdata,
      contentType: false,
      processData: false,
      success: function( data, dataType ){
        console.log( data );
      },
      error: function( jqXHR, textStatus, errorThrown ){
        console.log( textStatus + ": " + errorThrown );
      }
    });
    */

    orientationData = [];
  }
}

function deviceOrientation( e ){
  e.preventDefault();
  if( isTouch ){
    var gamma = e.gamma; //. Left/Right
    var beta = e.beta;   //. Front/Back
    var alpha = e.alpha; //. Direction

    var ori = {};
    ori['dir'] = alpha;
    ori['fb'] = beta;
    ori['lr'] = gamma;

    orientationData.push( ori );
  }
}