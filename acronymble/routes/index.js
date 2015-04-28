#!/usr/bin/env node
/* jshint node: true, curly: true, eqeqeq: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, nonew: true, quotmark: double, strict: true, undef: true, unused: true */
"use strict";

var express = require("express");
var router = express.Router();

// index page is our main page, include routes and events related to it here
router.get("/", function(req, res, next) {
	if (req.session.current_user) {
		console.log("current_user in session: " + req.session.current_user.username);
		res.render("index", { title: "Acronymble" });	
	} else {
		res.render("login", { title: "login to Acronymble" });
	}
});

module.exports = router;
