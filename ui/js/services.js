function ServiceInitializer(){
    this.initServices = function (app){
        app.service('realtime', realtime);
    };

    function realtime(){
        function basePath(){
            var pathArray = window.location.href.split( '/' );
            var protocol = pathArray[0];
            var host = pathArray[2];
            return protocol + '//' + host;
        }

        var socket = io.connect(basePath());

        var rssQueryClients = [];
        var realTimeClients = [];


        socket.on('realtime', function(data){
            _.forEach(realTimeClients, function(client){
                client(data);
            });
        });

        socket.on('data', function(data){
            _.forEach(rssQueryClients, function(client){
                client(data);
            });
        });

        this.registerRssPush = function (client){
            rssQueryClients.push(client);
        };

        this.registerRealTime = function (client){
            realTimeClients.push(client);
        }
    }
}