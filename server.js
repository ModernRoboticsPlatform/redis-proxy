//const express = require("express");
const WebSocket = require('ws');
const redis = require("redis");

//  Config settings.
const WS_PORT = process.env.WS_PORT || 8080;
const REDIS_HOST = process.env.REDIS_HOST || "redis";
const REDIS_PORT = process.env.REDIS_HOST || 6379;

// Web Socket
const wss = new WebSocket.Server({ port: WS_PORT });

wss.on('connection', function connection(ws, req) {
  console.log( "Connection from: " + req.socket.remoteAddress )

  // New ws connection, lets connect to redis.
  const subscriber = redis.createClient({ host: REDIS_HOST, port: REDIS_PORT });
  
  // Received a message.
  ws.on('message', function incoming(message) {
    console.log('received: %s', message);
    subscriber.subscribe("telemetry");    
  });
  
  // New message from redis Pub/Sub.
  subscriber.on("message", function(channel, message) {
    ws.send(message);
  })

  // Error with redis.
  subscriber.on("error", function(error) {
    console.log( error )
    ws.send( '{"redis": "error", "data": error}' );
  })

  // ws client has disconnected.
  ws.on('close', function close() {
    subscriber.end(true)
    console.log('Client Disconnected: ' + req.socket.remoteAddress );
  });

});
