//. app.js
const express = require( 'express' );
const log4js = require( 'log4js' );
const session = require( 'express-session' );
const passport = require( 'passport' );
const WebAppStrategy = require( 'ibmcloud-appid' ).WebAppStrategy;

const settings = require( './settings' );

//. logger
var logger = log4js.getLogger( 'MyAppId' );

//. setup express-session.
const app = express(); 
app.use( session( 
  {
    secret: 'myappid',
    resave: false,
    saveUninitialized: false
  }
));

//. setup passport
app.use( passport.initialize() ); // initialization
app.use( passport.session() );  // use session
passport.serializeUser( ( user, cb ) => cb( null, user ) );
passport.deserializeUser((user, cb) => cb(null, user));
passport.use(new WebAppStrategy({ // WebAppStragegy is passport Strategy 
  tenantId: settings.tenantId,
  clientId: settings.clientId,
  secret: settings.secret,
  oauthServerUrl: settings.oauthServerUrl,
  redirectUri: settings.redirectUri
}));


//. Login
app.get( '/appid/login', 
  passport.authenticate( WebAppStrategy.STRATEGY_NAME, {
	  successRedirect: '/',
	  forceLogin: true
}));

//. Callback from App ID
app.get( '/appid/callback', function( req, res, next ){
    logger.info( 'callback: authorized Code =' + req.query.code );
    next();
  },
  passport.authenticate( WebAppStrategy.STRATEGY_NAME )
);

//. Logout
app.get('/appid/logout', function( req, res ){
  WebAppStrategy.logout( req );
  res.redirect( '/' );
});

//. Get user info API
app.get( "/api/user", function( req, res ){ 
  if( !req.user ){ 
    res.status( 401 ); 
    res.send( '' ); 
  }else{
    logger.info( req );
    res.json({
      user: {
        name: req.user.name,
        email: req.user.email,
        given_name: req.user.given_name,
        family_name: req.user.family_name
      }
    });
  }
});

//. Server static resources
app.use( express.static( './public' ) );

//. Start server
var port = process.env.port || settings.port || 8080;
app.listen( port );
console.log( 'server started on ' + port );


