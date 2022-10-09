console.clear();
const express = require("express");
const crypto = require("crypto");
const { encrypt, newUserKeys, decrypt } = require("./encryption.js");

const app = express();
const configFile = require("./database/config.json");
let userDataFile = require("./database/userdatabase.json");
const fs = require("fs");
const database = require("./database/data.json");
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(__dirname + "/"));
/*
 */

// TODO: UUID
class UUID {
	constructor() {
		let isValid = false;
		while (isValid == false) {
			var uuid = crypto.randomUUID({ disableEntropyCache: false });
			const foundUUIDs = database.users.filter((user) => {
				return user.uuid == uuid;
			});
			if (foundUUIDs) {
				isValid = true;
			}
		}
		return { uuid: uuid.toString("utf-8") };
	}
}
// TODO: Random Letter Function
const randomLetter = function () {
	return Math.random().toString(36).substr(2);
};
// TODO: Signup Request
app.post("/signup", async (req, res) => {
	var { email, name, password, ip } = req.body;
	let data = {
		message: "",
		code: "",
		errorCode: 200,
	};
	if (!email?.includes("@") && email?.split("@")[0]?.length > 2) {
		data.code = "invalid_email";
		data.errorCode = 400;
		data.message = "Invalid Email";
	}
	if (!name?.replace(" ", "")?.length > 5) {
		data.code = "username_short";
		data.errorCode = 400;
		data.message = "Username Too Short";
	}
	if (!name?.replace(" ", "".length < 20)) {
		data.code = "username_long";
		data.errorCode = 400;
		data.message = "Username Too Long";
	}
	if (!password?.length >= 8) {
		data.code = "password_short";
		data.errorCode = 400;
		data.message = "Password too short";
	}
	const foundUserNames = userDataFile.filter((user) => {
		return user.username.toLowerCase() == name?.toLowerCase();
	});
	if (foundUserNames?.length > 0) {
		data.code = "username_exists";
		data.errorCode = 400;
		data.message = "Username Already Exists";
	}
	const foundUserEmails = userDataFile.filter((user) => {
		return user.email.toLowerCase() == email.toLowerCase();
	});
	if (foundUserEmails.length > 0) {
		data.code = "email_exists";
		data.errorCode = 400;
		data.message = "Emain Already Exists";
	}
	if (data.errorCode == 400) {
		res.status(400).json(data);
		return;
	}
	console.log(`Creating a new account (${name})`);
	const keys = newUserKeys();
	const obj = {
		email: email,
		password: password,
		username: name,
		keys,
		uuid: new UUID().uuid,
		isActivated: false,
		isDisabled: false,
		punishments: [],
		creationDate: new Date().toString(),
		ip: ip,
	};
	userDataFile.push(obj);
	const userKeys = {
		public: keys.public,
		private: keys.private,
	};
	fs.writeFile(`./database/userdatabase.json`, JSON.stringify(userDataFile, null, 4), (err) => {
		if (err) {
			console.log(`ERROR: ${err}`);
			res.status(400).json({ errorCode: 500, error: "unable_to_add_to_database", message: "Unable To Add to Database (contact support)" });
			return;
		}
		res.status(201).json({ errorCode: 201, message: "User Added To Database", redirectURL: `https://localhost:${configFile.server.port}/activate_account`, keys: userKeys });
		console.log(`Added to database`);
	});
	console.log(obj);
});
// TODO: Activate Account Request
app.post("/activate_account", async (req, res) => {
	const { username, cookies } = req.body;
	const userDataFile = require("./database/userdatabase.json");
	console.log(username);
	const userIndex = userDataFile.findIndex((user) => user.username == username);
	if (userIndex < -1) {
		res.status(400).json({ code: "invalid_username", mesasge: "No user found" });
		return;
	}
	if (userDataFile[userIndex]?.isActivated) {
		res.status(400).json({ code: "account_already_activated", mesasge: "The account is activated!" });
		return;
	}
});
// TODO: Disable Account Request
app.post("/disable_account", (req, res) => {
	const { username, reason } = req.body;
	const userDataFile = require("./database/userdatabase.json");
	console.log(username);
	const userIndex = userDataFile.findIndex((user) => user.username == username);
	if (userIndex < -1) {
		res.status(400).json({ code: "invalid_username", mesasge: "No user found" });
		return;
	}
	if (userDataFile[userIndex].isDisabled) {
		res.status(400).json({ code: "account_already_disabled", mesasge: "The account has already been disabled!" });
		return;
	}
	userDataFile[userIndex].isDisabled = true;
	const punishment = {
		date: new Date().toString(),
		reason,
		typeOfPunishment: "disable_account",
	};
	userDataFile[userIndex].punishments.push(punishment);
	fs.writeFile(`./database/userdatabase.json`, JSON.stringify(userDataFile, null, 4), (err) => {
		if (err) {
			console.log(`ERROR: ${err}`);
			res.status(400).json({ errorCode: 500, error: "unable_to_add_to_database", message: "Unable To Add to Database (contact support)" });
			return;
		}
		res.status(201).json({ errorCode: 201, message: "User Added To Database", redirectURL: `https://localhost:${configFile.server.port}/activate_account`, keys: userKeys });
		console.log(`Added to database`);
	});
	console.log(obj);
});

// TODO: E N D
app.listen(configFile.server.port, () => {
	console.log("Server is running on port " + configFile.server.port);
});
