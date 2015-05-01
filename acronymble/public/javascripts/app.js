var main = function (toDoObjects) {
    "use strict";
    var socket = io.connect("http://localhost:3000");
    $("#test").on("click", function() {
    	socket.emit("start_game");
    });

    socket.on("acronym_generated", function (data) {
    	console.log("data received from server: " + data);
    	$(".content").append($("<p>").text(data));
    });
}


$(document).ready(function () {
    "use strict";
   main();
});