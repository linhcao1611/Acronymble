#!/usr/bin/env node
/* jshint node: true, curly: true, eqeqeq: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, nonew: true, quotmark: double, strict: true, undef: true, unused: true */
"use strict";

// source: http://mongoosejs.com/docs/guide.html, http://mongoosejs.com/docs/populate.html
var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var UserSchema = new Schema({
	username: String,
	password: String,
	date: { type: Date, default: Date.now },
	score: Number,
	level: Number,
	rank: String
});

// User model will be available to create new users or to query the database
module.exports = mongoose.model("User", UserSchema);