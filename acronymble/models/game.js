#!/usr/bin/env node
/* jshint node: true, curly: true, eqeqeq: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, nonew: true, quotmark: double, strict: true, undef: true, unused: true */
"use strict";

// source: http://mongoosejs.com/docs/guide.html, http://mongoosejs.com/docs/populate.html
var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var GameSchema = new Schema({
	acronym: String,
	phrases: Object,
	winner: String,
	winner_phrase: String
});

module.exports = mongoose.model("Game", GameSchema);
