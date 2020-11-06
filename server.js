//const express = require("express");
const WebSocket = require('ws');
const redis = require("redis");

//  Config settings.
const WS_PORT = process.env.WS_PORT || 8080;
const REDIS_HOST = process.env.REDIS_HOST || "redis";
const REDIS_PORT = process.env.REDIS_HOST || 6379;


const client = redis.createClient({ host: REDIS_HOST, port: REDIS_PORT });
client.pubsub('channels', (err, channels) => {
  if (err) {
    console.log( err )
  } else {
    console.log('Channels:', channels); 
  }
});
client.quit();


// Web Socket
const wss = new WebSocket.Server({ port: WS_PORT });

wss.on('connection', function connection(ws, req) {
  console.log( "Connection from: " + req.socket.remoteAddress )

  // New ws connection, lets connect to redis.
  const subscriber = redis.createClient({ host: REDIS_HOST, port: REDIS_PORT });
  const publisher = redis.createClient({ host: REDIS_HOST, port: REDIS_PORT });
  
  // Received a message.
  ws.on('message', function incoming(message) {
   
    // Make sure it's json
    obj = {} 
    try {
      obj = JSON.parse(message);
    }
    catch(e) {
      console.log( "Message error: " + e )
      return
    }

    // We are looking for a type and data
    if( !obj.type || !obj.data )
      return

    // Do something with the message
    switch (obj.type) {
      case 'subscribe':
        obj.data.forEach( function( channel ) {
           subscriber.subscribe( channel );
        });
        break;
      case 'ping':
        ws.send( JSON.stringify( {"type":"pong", "data": { "time": obj.data }}) );
        break;
      case 'command':
        publisher.publish( "commands", obj.data );
        break;
 
      default:
        console.log("Huh?: " + obj.type)
      }

  });
  
  // New message from redis Pub/Sub.
  subscriber.on("message", function(channel, message) {
    ws.send( message );
  })

  // Error with redis.
  subscriber.on("error", function(error) {
    console.log( error )
    ws.send( '{"type": "redis", "data": {"error": error}}' );
  })

  // ws client has disconnected.
  ws.on('close', function close() {
    subscriber.end(true)
    console.log('Client Disconnected: ' + req.socket.remoteAddress );
  });

});
