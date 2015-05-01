#!/usr/bin/env node
/* jshint node: true, curly: true, eqeqeq: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, nonew: true, quotmark: double, strict: true, undef: true, unused: true */
"use strict";

var express = require("express");
var router = express.Router();
var Game = require("../models/game");


// global variable to keep all phrase submit by player
var phrases=[];
// when user submit a phrase
router.post("/phrase", function(req, res){
	author = req.body.user;
	phrase = req.body.phrase;
	phrases.push({author,phrase,0});
});

// keep track voting
router.post("/vote", function(req, res){
	author = req.body.author;
	phrase = req.body.phrase;
	// find and update number of vote for a phrase
	var index = phrases.indexOf({author,phrase});
	// update voting
	phrases[index][2]++;
})

// end_game event
router.post("/endGame", function (req, res) {
// loop through the phrases array and find the winner
	var i,
		win = phrases[0];
	for(i = 1; i < phrases.length; i++){
		if(phrases[i][2]>win[2]){
			win = phrases[i];
		}
	}
	res.json({winner: win[0], win_phrase: win[1], numOfVote: phrases[2] );
});

module.exports = router;
