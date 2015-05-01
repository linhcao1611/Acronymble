#!/usr/bin/env node
/* jshint node: true, curly: true, eqeqeq: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, nonew: true, quotmark: double, strict: true, undef: true, unused: true */
"use strict";

var express = require("express");
var router = express.Router();
var Game = require("../models/game");

// when user submit a phrase
router.post("/phraseSubmit", function (req, res) {

	var new_game = new Game({
		//user: req.body.user,
		//phrase: req.body.phrase
	});



	new_game.save(function (err) {
		if (err) {
			console.log("error saving game object : " + err);
		}
		console.log("the game has been saved");
		return res.redirect("/");
	}); 
});

module.exports = router;
