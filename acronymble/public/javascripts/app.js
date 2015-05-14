var main = function() {
    "use strict";
    var socket;

    var app = angular.module("acronymble", ["ngMessages"]);

    var acronym = "";
    var game_timer_started = false;

    socket = io.connect("http://localhost:3000", {
        query: "userName=" + $(".username").text()
    });
    // TODO: consider the case of a user loggin in while a game is in progress
    app.controller("start_game", function($scope, $http) {
        $scope.users_joined = [];
        $scope.acronym = "";
        $scope.start = function() {
            console.log("sending start_game request");
            socket.emit("start_new_game");
        };

        socket.on("game_started", function(data) {
            console.log("received game_started event from server, data: " + data.game_in_progress);
            if (data.game_in_progress === "false") {
                angular.element(document.querySelector("#start")).addClass("ng-hide");
                angular.element(document.querySelector("#join")).removeClass("ng-hide");
            } else {
                angular.element(document.querySelector("#start")).addClass("ng-hide");
                angular.element(document.querySelector("#gameInProgress")).removeClass("ng-hide");
            }

        });

        $scope.join = function(user) {
            // console.log("user clicked join game: " + user);
            // console.log("emitting join_game");
            socket.emit("join_game", user);
            angular.element(document.querySelector("#join")).addClass("ng-hide");
        };


        socket.on("user_joined_game", function(data) {
            // console.log("received user_joined_game event from server,data: " + data);
            $scope.users_joined.push(data);
            $scope.$apply();
            // wait for 10 s for other users to join after 3 players join, after which send the acronym
            // TODO: change this back to 3 before submission
            if ($scope.users_joined.length >= 2) {
                setTimeout(function() {
                    // console.log($scope.users_joined.length + " joined the game");
                    if (!$scope.acronym) {
                        socket.emit("generate_acronym");
                    }
                }, 5000);
            }
        });

        socket.on("acronym_generated", function(new_acronym) {
            // console.log("acronym received from server: " + new_acronym);

            if (!$scope.acronym) {
                $scope.acronym = new_acronym;
                $scope.acronym_message = "Come up with a phrase for: ";
                $scope.$apply();
                angular.element(document.querySelector("#playGame")).removeClass("ng-hide");
                angular.element(document.querySelector("#addPhraseForm")).removeClass("ng-hide");
                acronym = $scope.acronym;
            }

            // start the game timer for 60s
            if (!game_timer_started) {
                game_timer_started = true;
                console.log("timer started");

                var n = 60;
                var tm = setInterval(function() {
                    n--;
                    if (n === 0) {
                        clearInterval(tm);
                        $scope.timer = undefined;
                        $scope.$apply();
                    } else {
                        $scope.timer = "(Time Left: " + n.toString() + ")";
                        $scope.$apply();
                    }
                }, 1000);

                setTimeout(function() {
                    console.log("emiting game_ended");
                    socket.emit("game_ended");

                }, 60000);
            }
        });
        socket.on("server_another_game_started", function() {
            console.log("cleaning up: start_game");
            // clean up after the game ends
            $scope.acronym = "";
            $scope.acronym_message = "";
            $scope.users_joined = [];
            game_timer_started = false;
            angular.element(document.querySelector("#gameInProgress")).addClass("ng-hide");
        });

    });

    app.controller("play_game", function($scope) {
        var ac_arr, ph_arr, i;
        $scope.recv_phrases_list = [];
        $scope.add_phrase = function(user) {

            // validate phrase entered
            ac_arr = acronym.split(".");
            ph_arr = $scope.phrase.split(" ");

            if (ac_arr.length === ph_arr.length) {
                for (i = 0; i < ac_arr.length; i++) {
                    if (ph_arr[i].charAt(0).toUpperCase() !== ac_arr[i]) {
                        angular.element(document.querySelector("#phrase_error")).addClass("alert alert-danger");
                        $scope.error_message = "phrase doesn't match acronym";
                        return $scope.error_message;
                    }
                }
                // phrase is valid emit add_server event to the server
                socket.emit("add_phrase", {
                    user: user,
                    phrase: $scope.phrase
                });
                angular.element(document.querySelector("#phrase_error")).removeClass("alert alert-danger");
                $scope.error_message = "";

            } else {
                angular.element(document.querySelector("#phrase_error")).addClass("alert alert-danger");
                $scope.error_message = "invalid phrase, length doesn't match";
                return $scope.error_message;
            }
            $scope.recv_phrases_list.push({
                user: user,
                phrase: $scope.phrase
            });
            $scope.phrase = "";
            angular.element(document.querySelector("#addPhraseForm")).addClass("ng-hide");
        };

        socket.on("phrase_added", function(data) {
            $scope.recv_phrases_list.push(data);
            $scope.$apply();
        });

        socket.on("server_another_game_started", function() {
            console.log("cleaning up: play_game");
            $scope.recv_phrases_list = [];
            $scope.error_message = "";
        });
    });

    app.controller("voting", function($scope) {
        $scope.phrases = [];
        $scope.myVal = 0;

        socket.on("vote_started", function(data) {
            angular.element(document.querySelector("#voting")).removeClass("ng-hide");
            angular.element(document.querySelector("#playGame")).addClass("ng-hide");
            angular.element(document.querySelector("#start_new_game")).addClass("ng-hide");
            $scope.phrases = data;
            $scope.$apply();
            // players have 10s to vote, after that, emit vote_ended even
            console.log("voting timer started");

            var n = 10;
            var tm = setInterval(function() {
                n--;
                if (n === 0) {
                    clearInterval(tm);
                    $scope.timer = undefined;
                    $scope.$apply();
                } else {
                    $scope.timer = "(Time to Vote: " + n.toString() + ")";
                    $scope.$apply();
                }
            }, 1000);

            setTimeout(function() {
                socket.emit("vote_ended");
            }, 10000);
        });

        $scope.vote = function(author) {
            socket.emit("voted_phrase", author);
            angular.element(document.querySelector(".vote_btn")).addClass("ng-hide");
            $scope.myVal = 1;
        };

        socket.on("update_vote", function(data) {
            $scope.phrases = data;
            $scope.$apply();
        });

        socket.on("winner", function(data) {
            $scope.winner = data;
            $scope.$apply();
            angular.element(document.querySelector("#winner")).removeClass("ng-hide");
            angular.element(document.querySelector("#start_new_game")).removeClass("ng-hide");

        });

        $scope.start_new_game = function() {
            socket.emit("another_game_started");
        };

        socket.on("server_another_game_started", function() {
            $scope.phrases = [];
            $scope.winner = "";
            $scope.myVal = 0;
            $scope.$apply();

            angular.element(document.querySelector("#voting")).addClass("ng-hide");
            angular.element(document.querySelector("#playGame")).addClass("ng-hide");
            angular.element(document.querySelector("#join")).removeClass("ng-hide");
            angular.element(document.querySelector("#winner")).addClass("ng-hide");
        });

    });

    app.controller("chat_controller", function($scope) {
        $scope.messages = [];
        $scope.addMessage = function(username) {
            if ($scope.message !== undefined && $scope.message !== "") {
                var messageArray = $scope.message.split(" ");
                var message = "";
                if (messageArray[0] === "/w") {
                    if (messageArray.length > 2) {
                        var count = 2;
                        while (count < messageArray.length) {
                            message += messageArray[count] + " ";
                            count++;
                        }
                        socket.emit("sendWhisper", messageArray[1], message, username);
                        $scope.messages.push("To " + messageArray[1] + ": " + message);
                    }
                } else {
                    socket.emit("sendChat", $scope.message, username);
                    $scope.messages.push(username + ": " + $scope.message);
                }
            }
            $scope.message = "";
        };

        socket.on("recieveMessage", function(message, username) {
            $scope.messages.push(username + ": " + message);
            $scope.$apply();
        });

        socket.on("recieveWhisper", function(message, username) {
            $scope.messages.push(username + " whispers: " + message);
            $scope.$apply();
        });

        socket.on("notFound", function(target) {
            $scope.messages.push("User " + target + " not found");
            $scope.$apply();
        });
    });

    // in case we need the username here, we can retrieve it as below
    // console.log("username:" + $(".username").text());

};

$(document).ready(function() {
    "use strict";
    main();
});