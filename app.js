//. app.js
var express = require( 'express' ),
    ejs = require( 'ejs' ),
    fs = require( 'fs' ),
    session = require( 'express-session' ),
    app = express();

var db = require( './api/db_postgres' );
app.use( '/api/db', db );

app.use( express.Router() );
app.use( express.static( __dirname + '/docs' ) );

app.set( 'views', __dirname + '/views' );
app.set( 'view engine', 'ejs' );

//. Session
var sess = {
  secret: 'air_graffiti',
  cookie: {
    path: '/',
    maxAge: (7 * 24 * 60 * 60 * 1000)
  },
  resave: false,
  saveUninitialized: false //true
};
app.use( session( sess ) );


//. #1
var webhook_url = process.env.WEBHOOK_URL ? process.env.WEBHOOK_URL : '';


app.get( '/', function( req, res ){
  res.render( 'index', { webhook_url: webhook_url } );
});

app.get( '/query', function( req, res ){
  res.render( 'query', {} );
});

app.get( '/training', function( req, res ){
  res.render( 'training', {} );
});



var port = process.env.PORT || 8080;
app.listen( port );
console.log( "server starting on " + port + " ..." );
