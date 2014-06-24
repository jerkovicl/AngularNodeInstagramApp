var fs    = require('fs'),
    nconf = require('nconf'),
    _ = require('underscore')._,
    openurl = require("openurl"),
    request = require('request'),
    Instagram = require("instagram-node-lib");

var Server = require("./src/server").Server,
    RealTime = require("./src/realtime").RealTime,
    InstagramRss = require("./src/instagramRss").InstagramRss;

var App = function(){

    var config = require('./config.json');

    var rss = new InstagramRss(config.tag, config.take);

    var server = new Server();

    var callbackEndpoint = "/callback1";
    var hostUrl = "http://" + config.ip + ":3000";
    var callbackUrl = hostUrl + callbackEndpoint;

    var realtime = {};

    this.run = function(){
        runOnTimer(config.interval);

        //execRealTime();

        realtime = new RealTime(server.start()).onLogin(rss.query).run();
    };

    function execRealTime(){
        addCallback();
        initInstagram();
        subscribeTo(config.tag);
    }

    function initInstagram(){
        Instagram.set('client_id', config.client_id);
        Instagram.set('client_secret', config.client_secret);
        Instagram.set('callback_url', callbackUrl);
        Instagram.set('redirect_uri', hostUrl);
    }

    function subscribeTo(tag){
        Instagram.subscriptions.subscribe({
            object: 'tag',
            object_id: tag,
            aspect: 'media',
            callback_url: callbackUrl,
            type: 'subscription',
            id: '#'
        });
    }

    function runOnTimer(interval){
        setInterval(function(){
            rss.query(realtime.push)
        }, interval * 1000);
    }

    function addCallback(){
        server.addRoutes(function(app){
            app.get(callbackEndpoint, function(req, res){
                console.log("callback from instagram");

                var handshake = Instagram.subscriptions.handshake(req, res);
            });

            app.post(callbackEndpoint, function(req, res){

                req.body.forEach(function(tag){
                    request(parseTag(tag), function (error, response, body){
                        var results =
                            _.chain(JSON.parse(body).data)
                            .map(function(item){
                                return {
                                    image: item.images.standard_resolution,
                                    caption: item.caption.text
                                }
                            }).value();

                        console.log(results);
                        realtime.notify(results);
                    });
                });

                res.end();
            });
        })
    }

    function parseTag(tag){
        var url = 'https://api.instagram.com/v1/tags/' + tag.object_id + '/media/recent?client_id=' + config.client_id;//479edbf0004c42758987cf0244afd3ef'

        return url;
    }
};


new App().run();

openurl.open('http://localhost:3000');