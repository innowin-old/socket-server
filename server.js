var client = require('socket.io').listen(9095 + parseInt(process.env.NODE_APP_INSTANCE, 10)).sockets,
//var client = require('socket.io').listen(9095).sockets,
    rest = require('restler'),
//    Client = require('node-rest-client').Client,
    fs = require('fs'),
    MongoClient = require('mongodb').MongoClient,
    datetime = require('node-datetime'),
    core_server = "";
var url = "mongodb://localhost:27017/daneshboom";

MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  console.log("Mongo Connected.");
    client.on('connection', function(socket){
        console.log("CONNECTED: " + socket.id);

        socket.on('test', function(input){
          socket.emit(input.result, "SUCCESS");
        });

        socket.on('rest request', function(input){
            console.log(input);
            try {
                if ('token' in input && input.token != "") {
                    header = {'Authorization': 'JWT ' + input.token, "Content-type": "application/json"};
                } else {
                    header = {"Content-type": "application/json"};
                }

                data = 'data' in input ? input.data : {};

                var args = {
                  headers: header,
                }

                console.log(args)

                // var client = new Client();

                /*client[input.method](input.url, args, 
                  function(data, response){
                    console.log(response)
                    console.log(data)
                    socket.emit(input.result, data);
                  });*/

                rest[input.method](input.url, {
                    headers: header,
                    data: data
                }).on('complete', function(result) {
                    socket.emit(input.result, result);
                });
            } catch (e) {
                if ('result' in input)
                  socket.emit(input.result, e);
                console.log(e);
            }
        });

      socket.on('new click', function(input){
        try {
          var query = {token: input.token}
          db.collection('tokens').find(query).count(function(err, result){
            if (err) socket.emit(input.result, {id: input.id, status: "FAILED"});
            else {
              if (result == 0) {
                rest['post']('http://restful.daneshboom.ir/api-token-verify/?format=json', {
                  headers: "",
                  data: {token: input.token}
                }).on('complete', function(result, res) {
                  var obj = {token: input.token, user: result.user.id, identity: result.identity.id, profile: result.profile.id}
                  db.collection("tokens").insertOne(obj, function(err, response){
                    if (err) socket.emit(input.result, {id: input.id, status: "FAILED"});

                    var obj = {id: input.id, user: result.user.id, created_time: datetime.create()}
                    db.collection('clicks').insertOne(obj, function(err, response){
                      if (err) console.log(err);

                      if ('result' in input){
                        if (err) socket.emit(input.result, err);
                        else socket.emit(input.result, "SUCCESS");
                      }
                    });

                  });

                }).on('error', function(error, response){
                  socket.emit(input.result, error);
                });

              }
            }
          });
        } catch(e) {
          console.log(e);
        }
      });

      socket.on('new view', function(input){
        try {
          var query = {token: input.token}
          db.collection('tokens').find(query).count(function(err, result){
            if (err) {
              socket.emit(input.result, {id: input.id, status: "FAILED"});
              console.log(err);
            } else {
              if (result == 0) {
                rest['post']('http://restful.daneshboom.ir/api-token-verify/?format=json', {
                  headers: "",
                  data: {token: input.token}
                }).on('complete', function(result, res) {
                  var obj = {token: input.token, user: result.user.id, identity: result.identity.id, profile: result.profile.id}
                  db.collection("tokens").insertOne(obj, function(err, res){
                    if (err) {
                      socket.emit(input.result, {id: input.id, status: "FAILED"});
                      console.log(err);
                    } else { 
                      var obj = {id: input.id, user: result.user.id, created_time: datetime.create()}
                      db.collection('views').insertOne(obj, function(err, response){
                        if (err) {
                          socket.emit(input.result, {status: "FAILED"});
                          console.log(err);
                        } if ('result' in input){
                          if (err) socket.emit(input.result, err);
                          else socket.emit(input.result, "SUCCESS");
                        }
                      });
                    }

                  });

                }).on('error', function(error, response){
                  socket.emit(input.result, error);
                });

              } else {
                findQuery = {token: input.token}
                db.collection("tokens").findOne(findQuery, function(err, instance){
                  if (err) {
                    socket.emit(input.result, {id: input.id, status: "FAILED"});
                    console.log(err);
                  } else {

                    var obj = {id: input.id, user: instance.user, created_time: datetime.create()}
                    db.collection('views').insertOne(obj, function(err, response){
                      if (err) {
                        console.log(err);
                        socket.emit(input.result, {status: "FAILED"});
                      } else {
                        if ('result' in input){
                          if (err) socket.emit(input.result, err);
                          else socket.emit(input.result, "SUCCESS");
                        }
                      }
                    });

                  }
                });
              }
            }
          });
        } catch(e) {
          console.log(e);
        }
      });

      socket.on('get views count', function(input){
        var query = { id: input.id }
        db.collection('views').distinct('user', query, function(err, result){
          if (err) socket.emit(input.result, err);
          else {
            console.log(result);
            socket.emit(input.result, result.length);
          }
        });
      });

      socket.on('get clicks count', function(input){
        var query = { id: input.id }
        db.collection('clicks').find(query).count(function(err, result){
          if (err) socket.emit(input.result, err);
          socket.emit(input.result, result);
        });
      });

      socket.on('send message', function(input){
        var query = {token: input.token}
        db.collection('tokens').find(query).count(function(err, result){
          if (err) socket.emit(input.result, {id: input.id, status: "FAILED"});
          else {
            if (result == 0) {

              rest['post']('http://restful.daneshboom.ir/api-token-verify/?format=json', {
                headers: "",
                data: {token: input.token}
              }).on('complete', function(result, res) {
                var obj = {token: input.token, user: result.user.id, identity: result.identity.id, profile: result.profile.id}
                db.collection("tokens").insertOne(obj, function(err, response){
                  if (err) socket.emit(input.result, {id: input.id, status: "FAILED"});
                  
                  var message = {id: input.id, to: input.to, from: result.identity.id, creator: result.identity.id, text: input.text, created_time: datetime.create()}
                  db.collection("messages").insertOne(message, function(err, message_response){
                    if (err) socket.emit(input.result, {id: input.id, status: "FAILED"});
                    else {
                      socket.emit(input.result, {id: input.id, status: "SUCCESS"});
                    }
                  });

                });
                socket.emit(input.result, result.identity.id);
              }).on('error', function(error, response){
                socket.emit(input.result, error);
              });

            } else {

              findQuery = {token: input.token}
              db.collection("tokens").findOne(findQuery, function(err, instance){
                if (err) socket.emit(input.result, {id: input.id, status: "FAILED"});
                else {

                  var message = {id: input.id, to: input.to, from: instance.identity, creator: instance.identity, text: input.text, created_time: datetime.create()}
                  db.collection("messages").insertOne(message, function(err, message_response){
                    if (err) socket.emit(input.result, {id: input.id, status: "FAILED"});
                    else {
                      socket.emit(input.result, {id: input.id, status: "SUCCESS"});
                    }
                  });

                }
              });

            }
          }
        });
      });

      socket.on('get contacts', function(input){
        var query = {token: input.token}
        db.collection('tokens').find(query).count(function(err, result){
          if (err) {
            socket.emit(input.result, {status: "FAILED"});
            console.log(err);
          } else {
            if (result == 0) {

            } else {
              db.collection('tokens').findOne(query, function(err, tokenObj){
                if (err) {
                  socket.emit(input.result, {status: "FAILED"});
                  console.log(err);
                } else {

                  db.collection('messages').distinct('to')
                }
              });
            }
          }
        });
      });

    });
});
