var main = function (toDoObjects) {
    "use strict";
    var socket;

    var app = angular.module("acronymble", ["ngMessages"]);

    var acronym = "";
    var game_timer_started = false;

    socket = io.connect("http://localhost:3000");
// TODO: consider the case of a user loggin in while a game is in progress
    app.controller("start_game", function ($scope) {
        $scope.users_joined = [];
        $scope.acronym = "";
        $scope.start = function () {
            console.log("emitting start_game event");
            socket.emit("start_new_game");            
        }

        socket.on("game_started", function (data) {
            console.log("received game_started event from server");
            angular.element(document.querySelector("#start")).addClass("ng-hide");
            angular.element(document.querySelector("#join")).removeClass("ng-hide");                                  
        });

        $scope.join = function (user) {
            console.log("user clicked join game: " + user);
            console.log("emitting join_game");
            socket.emit("join_game", user);
            angular.element(document.querySelector("#join")).addClass("ng-hide");
        }

        
        socket.on("user_joined_game", function (data) {
            console.log("received user_joined_game event from server,data: " + data);
            $scope.users_joined.push(data);
            $scope.$apply();
            // wait for 10 s for other users to join after 3 players join, after which send the acronym
            if ($scope.users_joined.length >= 2) {
                setTimeout(function() { 
                    console.log($scope.users_joined.length + " joined the game");
                    if (!$scope.acronym) {
                        socket.emit("generate_acronym");
                    }                    
                }, 5000);
            }
        });

        socket.on("acronym_generated", function (new_acronym) {
            console.log("acronym received from server: " + new_acronym);
            if (!$scope.acronym) {
                $scope.acronym = new_acronym;
                $scope.acronym_message = "Come up with a phrase for: ";
                $scope.$apply();
                angular.element(document.querySelector("#playGame")).removeClass("ng-hide");
                acronym = $scope.acronym;
            }
            // TODO: consider moving this to server since it could happen that multiple clients start timers and emit the event
            // start the game timer for 60s
            if (!game_timer_started) {
                game_timer_started = true;
                console.log("timer started");
                               
                setTimeout(function() {
                    console.log("emiting game_ended"); 
                    socket.emit("game_ended");
                }, 60000);
            }
        });
    });

    app.controller("play_game", function ($scope) {
        var ac_arr, ph_arr, i;
        $scope.add_phrase = function (user) {
            console.log("acronym in play_game:" + acronym);
            console.log("user " + user + " added : " + $scope.phrase);
            // validate phrase entered
            ac_arr = acronym.split(".");
            ph_arr = $scope.phrase.split(" ");

            if (ac_arr.length === ph_arr.length) {
                for (i = 0; i <  ac_arr.length; i++) {
                    if (ph_arr[i].charAt(0).toUpperCase() !== ac_arr[i]) {
                        return $scope.error_message = "phrase doesn't match acronym";
                    }
                }
                // phrase is valid emit phrase_added event to the server
                // TODO: emit the event and add listener on server side
                console.log("phrase valid")

            } else {
                return $scope.error_message = "invalid phrase, length doesn't match";
            }                      
        }
    });
    
    // in case we need the username here, we can retrieve it as below
    // console.log("username:" + $(".username").text());

}

$(document).ready(function () {
    "use strict";
    main();
});