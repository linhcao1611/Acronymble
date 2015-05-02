var main = function (toDoObjects) {
    "use strict";
    var socket;

    var app = angular.module("acronymble", []);

    socket = io.connect("http://localhost:3000");

    app.controller("start_game", function ($scope) {
        $scope.start = function () {
            console.log("emitting start_game event");
            socket.emit("start_game");        
        }
    });   
    

    socket.on("acronym_generated", function (data) {
    	console.log("data received from server: " + data);
    	$(".game").append($("<p>").text(data));
    });
}

$(document).ready(function () {
    "use strict";
    main();
});