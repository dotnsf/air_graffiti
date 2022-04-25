//. db_postgres.js
var express = require( 'express' ),
    bodyParser = require( 'body-parser' ),
    fs = require( 'fs' ),
    { v4: uuidv4 } = require( 'uuid' ),
    api = express();

process.env.PGSSLMODE = 'no-verify';
var PG = require( 'pg' );
PG.defaults.ssl = true;
var database_url = 'DATABASE_URL' in process.env ? process.env.DATABASE_URL : ''; 
var pg = null;
if( database_url ){
  console.log( 'database_url = ' + database_url );
  pg = new PG.Pool({
    connectionString: database_url,
    //ssl: { require: true, rejectUnauthorized: false },
    idleTimeoutMillis: ( 3 * 86400 * 1000 )
  });
  pg.on( 'error', function( err ){
    console.log( 'error on working', err );
    if( err.code && err.code.startsWith( '5' ) ){
      try_reconnect( 1000 );
    }
  });
}

function try_reconnect( ts ){
  setTimeout( function(){
    console.log( 'reconnecting...' );
    pg = new PG.Pool({
      connectionString: database_url,
      //ssl: { require: true, rejectUnauthorized: false },
      idleTimeoutMillis: ( 3 * 86400 * 1000 )
    });
    pg.on( 'error', function( err ){
      console.log( 'error on retry(' + ts + ')', err );
      if( err.code && err.code.startsWith( '5' ) ){
        ts = ( ts < 10000 ? ( ts + 1000 ) : ts );
        try_reconnect( ts );
      }
    });
  }, ts );
}

var settings_cors = 'CORS' in process.env ? process.env.CORS : '';
api.all( '/*', function( req, res, next ){
  if( settings_cors ){
    res.setHeader( 'Access-Control-Allow-Origin', settings_cors );
    res.setHeader( 'Vary', 'Origin' );
  }
  next();
});


api.use( bodyParser.urlencoded( { extended: true, limit: '50mb' } ) );
api.use( bodyParser.json( { limit: '50mb' }) );
api.use( express.Router() );

//. Create
api.createOrbit = async function( orbit ){
  return new Promise( async ( resolve, reject ) => {
    if( pg ){
      conn = await pg.connect();
      if( conn ){
        try{
          var sql = 'insert into orbits( id, letter, data, created, updated ) values ( $1, $2, $3, $4, $5 )';
          if( !orbit.id ){
            orbit.id = uuidv4();
          }
          var t = ( new Date() ).getTime();
          orbit.created = t;
          orbit.updated = t;
          //console.log( orbit );
          var query = { text: sql, values: [ orbit.id, orbit.letter, JSON.stringify( orbit.data ), orbit.created, orbit.updated ] };
          conn.query( query, function( err, result ){
            if( err ){
              console.log( err );
              resolve( { status: false, error: err } );
            }else{
              resolve( { status: true, result: result } );
            }
          });
        }catch( e ){
          console.log( e );
          resolve( { status: false, error: err } );
        }finally{
          if( conn ){
            conn.release();
          }
        }
      }else{
        resolve( { status: false, error: 'no connection.' } );
      }
    }else{
      resolve( { status: false, error: 'db not ready.' } );
    }
  });
};

api.createOrbits = function( orbits ){
  return new Promise( async ( resolve, reject ) => {
    if( pg ){
      conn = await pg.connect();
      if( conn ){
        try{
          var num = 0;
          var count = 0;

          var sql = 'insert into orbits( id, letter, data, created, updated ) values ( $1, $2, $3, $4, $5 )';
          for( var i = 0; i < orbits.length; i ++ ){
            var orbit = orbits[i];
            if( !orbit.id ){
              orbit.id = uuidv4();
            }
            var t = ( new Date() ).getTime();
            orbit.created = t;
            orbit.updated = t;
            //console.log( orbit );
            var query = { text: sql, values: [ orbit.id, orbit.letter, JSON.stringify( orbit.data ), orbit.created, orbit.updated ] };
            conn.query( query, function( err, result ){
              num ++;
              if( err ){
                console.log( err );
              }else{
                count ++;
              }

              if( num == orbits.length ){
                resolve( { status: true, count: count } );
              }
            });
          }
        }catch( e ){
          console.log( e );
          resolve( { status: false, error: err } );
        }finally{
          if( conn ){
            conn.release();
          }
        }
      }else{
        resolve( { status: false, error: 'no connection.' } );
      }
    }else{
      resolve( { status: false, error: 'db not ready.' } );
    }
  });
};

//. Read
api.readOrbit = async function( orbit_id ){
  return new Promise( async ( resolve, reject ) => {
    if( pg ){
      conn = await pg.connect();
      if( conn ){
        try{
          var sql = "select * from orbits where id = $1";
          var query = { text: sql, values: [ orbit_id ] };
          conn.query( query, function( err, result ){
            if( err ){
              console.log( err );
              resolve( { status: false, error: err } );
            }else{
              if( result && result.rows && result.rows.length > 0 ){
                result.rows[0].data = JSON.parse( result.rows[0].data );
                resolve( { status: true, result: result.rows[0] } );
              }else{
                resolve( { status: false, error: 'no data' } );
              }
            }
          });
        }catch( e ){
          console.log( e );
          resolve( { status: false, error: err } );
        }finally{
          if( conn ){
            conn.release();
          }
        }
      }else{
        resolve( { status: false, error: 'no connection.' } );
      }
    }else{
      resolve( { status: false, error: 'db not ready.' } );
    }
  });
};

//. Reads
api.readOrbits = async function( limit, offset ){
  return new Promise( async ( resolve, reject ) => {
    if( pg ){
      conn = await pg.connect();
      if( conn ){
        try{
          var sql = "select * from orbits order by updated";
          if( limit ){
            sql += " limit " + limit;
          }
          if( offset ){
            sql += " start " + offset;
          }
          var query = { text: sql, values: [] };
          conn.query( query, function( err, result ){
            if( err ){
              console.log( err );
              resolve( { status: false, error: err } );
            }else{
              for( var i = 0; i < result.rows.length; i ++ ){
                result.rows[i].data = JSON.parse( result.rows[i].data );
              }
              resolve( { status: true, results: result.rows } );
            }
          });
        }catch( e ){
          console.log( e );
          resolve( { status: false, error: err } );
        }finally{
          if( conn ){
            conn.release();
          }
        }
      }else{
        resolve( { status: false, error: 'no connection.' } );
      }
    }else{
      resolve( { status: false, error: 'db not ready.' } );
    }
  });
};

api.queryOrbits = async function( key, limit, offset ){
  return new Promise( async ( resolve, reject ) => {
    if( pg ){
      conn = await pg.connect();
      if( conn ){
        try{
          var sql = "select * from orbits where letter = '" + key + "' order by updated";
          if( limit ){
            sql += " limit " + limit;
          }
          if( offset ){
            sql += " start " + offset;
          }
          var query = { text: sql, values: [] };
          conn.query( query, function( err, result ){
            if( err ){
              console.log( err );
              resolve( { status: false, error: err } );
            }else{
              for( var i = 0; i < result.rows.length; i ++ ){
                result.rows[i].data = JSON.parse( result.rows[i].data );
              }
              resolve( { status: true, results: result.rows } );
            }
          });
        }catch( e ){
          console.log( e );
          resolve( { status: false, error: err } );
        }finally{
          if( conn ){
            conn.release();
          }
        }
      }else{
        resolve( { status: false, error: 'no connection.' } );
      }
    }else{
      resolve( { status: false, error: 'db not ready.' } );
    }
  });
};

//. Compare(Find Closest)
api.findClosest = async function( data ){
  return new Promise( async ( resolve, reject ) => {
    if( pg ){
      conn = await pg.connect();
      if( conn ){
        try{
          var sql = "select * from orbits order by updated";
          var query = { text: sql, values: [] };
          conn.query( query, function( err, result ){
            if( err ){
              console.log( err );
              resolve( { status: false, error: err } );
            }else{
              //resolve( { status: true, results: result.rows } );
              if( result && result.rows && result.rows.length > 0 ){
                var idx = -1;
                var closest = -1;
                for( var i = 0; i < result.rows.length; i ++ ){
                  var orbit = result.rows[i];
                  var d = 0.0;
                  for( var j = 0; j < orbit.data.length; j ++ ){
                    console.log( 'j = ' + j );
                    console.log( orbit.data[j] );
                    console.log( data[j] );
                    d += Math.pow( orbit.data[j][0] - parseFloat( data[j][0] ), 2 ) 
                      + Math.pow( orbit.data[j][1] - parseFloat( data[j][1] ), 2 );
                    console.log( ' d = ' + d );
                  }

                  if( i == 0 || d < closest ){
                    closest = d;
                    idx = i;
                  }
                }

                if( closest > -1 && idx > -1 ){
                  resolve( { status: true, letter: result.rows[idx].letter } );
                }else{
                  resolve( { status: false, error: 'no closest.' } );
                }
              }else{
                resolve( { status: false, error: 'no result.' } );
              }
            }
          });
        }catch( e ){
          console.log( e );
          resolve( { status: false, error: err } );
        }finally{
          if( conn ){
            conn.release();
          }
        }
      }else{
        resolve( { status: false, error: 'no connection.' } );
      }
    }else{
      resolve( { status: false, error: 'db not ready.' } );
    }
  });
};


//. Update
api.updateOrbit = async function( orbit ){
  return new Promise( async ( resolve, reject ) => {
    if( pg ){
      conn = await pg.connect();
      if( conn ){
        if( !orbit.id ){
          resolve( { status: false, error: 'no id.' } );
        }else{
          try{
            var sql = 'update orbits set letter = $1, data = $2, updated = $3 where id = $4';
            //var sql = "select * from items";
            var t = ( new Date() ).getTime();
            quiz.updated = t;
            var query = { text: sql, values: [ orbit.letter, JSON.stringify( orbit.data ), orbit.updated, orbit.id ] };
            //console.log( {query} );
            conn.query( query, function( err, result ){
              if( err ){
                console.log( err );
                resolve( { status: false, error: err } );
              }else{
                resolve( { status: true, result: result } );
              }
            });
          }catch( e ){
            console.log( e );
            resolve( { status: false, error: err } );
          }finally{
            if( conn ){
              conn.release();
            }
          }
        }
      }else{
        resolve( { status: false, error: 'no connection.' } );
      }
    }else{
      resolve( { status: false, error: 'db not ready.' } );
    }
  });
};

//. Delete
api.deleteOrbit = async function( orbit_id ){
  return new Promise( async ( resolve, reject ) => {
    if( pg ){
      conn = await pg.connect();
      if( conn ){
        try{
          var sql = "delete from orbits where id = $1";
          var query = { text: sql, values: [ orbit_id ] };
          conn.query( query, function( err, result ){
            if( err ){
              console.log( err );
              resolve( { status: false, error: err } );
            }else{
              resolve( { status: true, result: result } );
            }
          });
        }catch( e ){
          console.log( e );
          resolve( { status: false, error: err } );
        }finally{
          if( conn ){
            conn.release();
          }
        }
      }else{
        resolve( { status: false, error: 'no connection.' } );
      }
    }else{
      resolve( { status: false, error: 'db not ready.' } );
    }
  });
};

api.deleteOrbits = async function(){
  return new Promise( async ( resolve, reject ) => {
    if( pg ){
      conn = await pg.connect();
      if( conn ){
        try{
          var sql = "delete from orbits";
          var query = { text: sql, values: [] };
          conn.query( query, function( err, result ){
            if( err ){
              console.log( err );
              resolve( { status: false, error: err } );
            }else{
              resolve( { status: true, result: result } );
            }
          });
        }catch( e ){
          console.log( e );
          resolve( { status: false, error: err } );
        }finally{
          if( conn ){
            conn.release();
          }
        }
      }else{
        resolve( { status: false, error: 'no connection.' } );
      }
    }else{
      resolve( { status: false, error: 'db not ready.' } );
    }
  });
};


api.post( '/orbit', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var orbit = req.body;
  api.createOrbit( orbit ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

api.post( '/orbits', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var orbits = req.body;
  orbits.forEach( function( orbit ){
    if( !orbit.id ){
      orbit.id = uuidv4();
    }
  });

  api.createOrbits( orbits ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

api.get( '/orbit/:id', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var orbit_id = req.params.id;
  api.readOrbit( orbit_id ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

api.get( '/orbits', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var limit = req.query.limit ? parseInt( limit ) : 0;
  var offset = req.query.offset ? parseInt( offset ) : 0;
  api.readOrbits( limit, offset ).then( function( results ){
    res.status( results.status ? 200 : 400 );
    res.write( JSON.stringify( results, null, 2 ) );
    res.end();
  });
});

api.get( '/orbits/:key', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var key = req.params.key;
  api.queryOrbits( key ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});


api.put( '/orbit/:id', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var orbit_id = req.params.id;
  var orbit = req.body;
  orbit.id = orbit_id;
  api.updateOrbit( orbit ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

api.delete( '/orbit/:id', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var orbit_id = req.params.id;
  api.deleteOrbit( orbit_id ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

api.delete( '/orbits', function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  api.deleteOrbits().then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});

api.post( '/find', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  var data = req.body;
  console.log( 'POST /find' );
  console.log( data );
  api.findClosest( data.data ).then( function( result ){
    res.status( result.status ? 200 : 400 );
    res.write( JSON.stringify( result, null, 2 ) );
    res.end();
  });
});



//. api をエクスポート
module.exports = api;
