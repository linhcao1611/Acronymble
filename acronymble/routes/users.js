#!/usr/bin/env node
/* jshint node: true, curly: true, eqeqeq: true, forin: true, immed: true, indent: 4, latedef: true, newcap: true, nonew: true, quotmark: double, strict: true, undef: true, unused: true */
"use strict";

var express = require("express");
var router = express.Router();
var User = require("../models/user");


router.get("/", function (req, res) {
  res.render("login", { title: "login to Acronymble" });
});

router.get("/signup", function (req, res) {
  res.render("signup", { title: "Signup on Acronymble to start playing" });
});

// create new user
router.post("/new", function (req, res) {
	var new_user = new User ({
		username: req.body.username,
		password: req.body.password,
		score: 0,
		level: 1,
		rank: "beginner"
	});

	new_user.save(function (err) {
		if (err) {
			console.log("error saving user : " + err);
		}
		console.log("new user : " + new_user);
		//fill the new users session
		req.session.current_user = new_user;
		return res.redirect("/");
	}); 
});

// login user
router.post("/login", function (req, res) {
	// validate user, fill session, redirect to index
	console.log(req.body.username);
	User.findOne({username: req.body.username, password: req.body.password}, function (err, user) {
		if (err || !user) {
			console.log("user not found");
			res.render("login", { title: "login to Acronymble", message: "username or password are invalid" });
		} else {
			req.session.current_user = user;
			return res.redirect("/");
		}
	});	
});

// logout
router.get("/logout", function (req, res) {
// destroy session, render login page, login.jade view contains the login form
	req.session.destroy();
	// res.render("login", { title: "login to Acronymble" });
	return res.redirect("/");
});

module.exports = router;
