// Express is the web framework
var express = require('express');
var store = new express.session.MemoryStore;

var app = express();
var allowCrossDomain = function(req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
	res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With');

	// intercept OPTIONS method
	if ('OPTIONS' == req.method) {
		res.send(200);
	} else {
		next();
	}
};

app.configure(function() {
	app.use(allowCrossDomain);
});

app.use(express.bodyParser());
var pg = require('pg');

var conString = "pg://postgres:post123@localhost:5432/SpruceDB";

// REST Operations
// Idea: Data is created, read, updated, or deleted through a URL that
// identifies the resource to be created, read, updated, or deleted.
// The URL and any other input data is sent over standard HTTP requests.
// Mapping of HTTP with REST
// a) POST - Created a new object. (Database create operation)
// b) GET - Read an individual object, collection of object, or simple values (Database read Operation)
// c) PUT - Update an individual object, or collection  (Database update operation)
// d) DELETE - Remove an individual object, or collection (Database delete operation)

app.put('/SpruceServer/makedefaultsaddress/:sid', function(req, res) {
	console.log("GET " + req.url);

	var client = new pg.Client(conString);
	client.connect();

	client.query("BEGIN;");

	var query = client.query({
		text : "update saddress set defaultsaddress = false where sid in (select sid from saddress natural join ships_to natural join account where accpassword = $1)",
		values : [req.body.password]
	});

	var query = client.query({
		text : "update saddress set defaultsaddress = true where sid = $1",
		values : [req.params.sid]
	});

	client.query("COMMIT;");

	query.on("end", function(result) {
		var flag = result.rows.length > 0;
		var response = {
			"success" : flag
		};
		console.log(result);
		console.log(flag);
		client.end();
		res.json(response);
	});
});

app.get('/SpruceServer/deleteusershipping/:sid', function(req, res) {
	console.log("GET " + req.url);

	var client = new pg.Client(conString);
	client.connect();

	var query = client.query({
		text : "update saddress set activesaddress = false where sid = $1",
		values : [req.params.sid]
	});

	query.on("end", function(result) {
		var flag = result.rows.length > 0;
		var response = {
			"success" : flag
		};
		console.log(result);
		console.log(flag);
		client.end();
		res.json(response);
	});
});

app.put('/SpruceServer/addUserCreditCardInfo/:name/:number/:expmonth/:expyear/:csc/:type/:street/:city/:state/:country/:zip', function(req, res) {
	console.log("PUT" + req.url);

	var client = new pg.Client(conString);
	client.connect();

	var password = req.body.password;

	client.query("BEGIN;");

	var query = client.query({
		text : "INSERT INTO credit_card VALUES (DEFAULT, $1, $2, $3, $4, $5, $6,false,false)",
		values : [req.params.number, req.params.name, req.params.type, req.params.expmonth, req.params.expyear, req.params.csc]
	});

	var query = client.query({
		text : "INSERT INTO baddress VALUES (DEFAULT, $1, $2, $3, $4, $5)",
		values : [req.params.street, req.params.city, req.params.state, req.params.country, req.params.zip]
	});

	var query = client.query({
		text : "INSERT INTO billed VALUES((SELECT accid FROM account where accpassword = $1), (SELECT max(cid) FROM credit_card));",
		values : [password]
	});

	client.query("INSERT INTO bills_to VALUES((SELECT max(cid) FROM credit_card), (SELECT max(bid) FROM baddress));", function(err, result) {
		if (err) {
			var response = {
				"success" : false
			};
			client.end();
			res.json(response);
		} else {
			client.query("COMMIT");
			var response = {
				"success" : true
			};
			client.end();
			res.json(response);
		}
	});
});

app.put('/SpruceServer/addUserShippingAddress/:street/:city/:state/:country/:zip', function(req, res) {
	console.log("GET " + req.url);

	var client = new pg.Client(conString);
	client.connect();

	var password = req.body.password;
	client.query("BEGIN;");

	var query = client.query({
		text : "INSERT INTO saddress VALUES (DEFAULT, $1, $2, $3, $4, $5, true, false)",
		values : [req.params.street, req.params.city, req.params.state, req.params.country, req.params.zip]
	});

	client.query("INSERT INTO ships_to VALUES((select accid from account where accpassword = $1), (select max(sid) from saddress))", [password], function(err, result) {
		if (err) {
			var response = {
				"success" : false
			};
			client.end();
			res.json(response);
		} else {
			client.query("COMMIT;");
			var response = {
				"success" : true
			};
			client.end();
			res.json(response);
		}
	});
});

app.put('/SpruceServer/changeUserShippingAddress/:street/:city/:state/:country/:zip/:id', function(req, res) {
	console.log("GET " + req.url);

	var client = new pg.Client(conString);
	client.connect();

	var password = req.body.password;
	var id = req.params.id;
	console.log(id);
	client.query("UPDATE saddress SET street = $1, city = $2, state = $3, country = $4, zip = $5 where sid = $6 ", [req.params.street, req.params.city, req.params.state, req.params.country, req.params.zip, id], function(err, result) {
		if (err) {
			var response = {
				"success" : false
			};
			client.end();
			res.json(response);
		} else {
			var response = {
				"success" : true
			};
			client.end();
			res.json(response);
		}
	});
});

app.put('/SpruceServer/changeUserBillingAddress/:street/:city/:state/:country/:zip/:id', function(req, res) {
	console.log("GET " + req.url);

	var client = new pg.Client(conString);
	client.connect();

	var password = req.body.password;
	var id = req.params.id.split("-");
	console.log(id);
	client.query("UPDATE baddress SET street = $1, city = $2, state = $3, country = $4, zip = $5 where bid = $6 ", [req.params.street, req.params.city, req.params.state, req.params.country, req.params.zip, id[1]], function(err, result) {
		if (err) {
			var response = {
				"success" : false
			};
			client.end();
			res.json(response);
		} else {
			var response = {
				"success" : true
			};
			client.end();
			res.json(response);
		}
	});
});

app.put('/SpruceServer/editGeneralInfo/:fname/:lname/:email/:phone', function(req, res) {
	console.log("GET " + req.url);

	var client = new pg.Client(conString);
	client.connect();

	var password = req.body.password;

	client.query("UPDATE account SET accfname = $2, acclname = $3, accemail = $4, accphonenum = $5 where accpassword = $1", [password, req.params.fname, req.params.lname, req.params.email, req.params.phone], function(err, result) {
		if (err) {
			var response = {
				"success" : false
			};
			client.end();
			res.json(response);
		} else {
			var response = {
				"success" : true
			};
			client.end();
			res.json(response);
		}
	});
});

app.put('/SpruceServer/editUserPhoto/:link', function(req, res) {
	console.log("GET " + req.url);

	var client = new pg.Client(conString);
	client.connect();

	link = "http://imgur.com/" + req.params.link + ".png";
	var password = req.body.password;

	client.query("UPDATE account SET accphoto = $1 WHERE accpassword = $2", [link, password], function(err, result) {
		if (err) {
			var response = {
				"success" : false
			};
			client.end();
			res.json(response);
		} else {
			var response = {
				"success" : true
			};
			client.end();
			res.json(response);
		}
	});
});

app.put('/SpruceServer/changeUserUsername/:username', function(req, res) {
	console.log("GET " + req.url);

	var client = new pg.Client(conString);
	client.connect();

	var password = req.body.password;

	client.query("UPDATE account SET accusername = $1 WHERE accpassword = $2", [req.params.username, password], function(err, result) {
		if (err) {
			var response = {
				"success" : false
			};
			client.end();
			res.json(response);
		} else {
			var response = {
				"success" : true
			};
			client.end();
			res.json(response);
		}
	});
});

app.get('/SpruceServer/addCreditCardInfo/:username/:name/:number/:expmonth/:expyear/:csc/:type/:street/:city/:state/:country/:zip', function(req, res) {
	console.log("GET " + req.url);

	var client = new pg.Client(conString);
	client.connect();

	var username = req.body.username;

	client.query("BEGIN;");

	var query = client.query({
		text : "INSERT INTO credit_card VALUES (DEFAULT, $1, $2, $3, $4, $5, $6,false,false)",
		values : [req.params.number, req.params.name, req.params.type, req.params.expmonth, req.params.expyear, req.params.csc]
	});

	var query = client.query({
		text : "INSERT INTO baddress VALUES (DEFAULT, $1, $2, $3, $4, $5)",
		values : [req.params.street, req.params.city, req.params.state, req.params.country, req.params.zip]
	});

	var query = client.query({
		text : "INSERT INTO billed VALUES((SELECT accid FROM account where accusername = $1), (SELECT max(cid) FROM credit_card));",
		values : [req.params.username]
	});

	client.query("INSERT INTO bills_to VALUES((SELECT max(cid) FROM credit_card), (SELECT max(bid) FROM baddress));", function(err, result) {
		if (err) {
			var response = {
				"success" : false
			};
			client.end();
			res.json(response);
		} else {
			client.query("COMMIT");
			var response = {
				"success" : true
			};
			client.end();
			res.json(response);
		}
	});
});

app.get('/SpruceServer/addAdminShippingAddress/:id/:street/:city/:state/:country/:zip', function(req, res) {
	console.log("GET " + req.url);

	var client = new pg.Client(conString);
	client.connect();

	var username = req.body.username;

	client.query("BEGIN;");

	var query = client.query({
		text : "INSERT INTO saddress VALUES (DEFAULT, $1, $2, $3, $4, $5, true, false)",
		values : [req.params.street, req.params.city, req.params.state, req.params.country, req.params.zip]
	});

	var query = client.query({
		text : "INSERT INTO ships_to VALUES((select accid from account where accusername = $1), (select max(sid) from saddress))",
		values : [req.params.id]
	});

	client.query("COMMIT;");

	query.on("row", function(row, result) {
		result.addRow(row);
	});
	query.on("end", function(result) {
		var flag = result.rows.length > 0;
		var response = {
			"success" : flag
		};
		console.log(result);
		console.log(flag);
		client.end();
		res.json(response);
	});
});

app.put('/SpruceServer/editaccphoto/:username', function(req, res) {
	console.log("GET " + req.url);

	var client = new pg.Client(conString);
	client.connect();
	var photo = req.body.photo;
	var username = req.params.username;
	console.log(photo);
	client.query("UPDATE account SET accphoto = $1 WHERE accusername = $2", [photo, username], function(err, result) {
		if (err) {
			var response = {
				"success" : false
			};
			client.end();
			res.json(response);
		} else {
			var response = {
				"success" : true
			};
			client.end();
			res.json(response);
		}
	});
});

app.get('/SpruceServer/changeShippingAddressInfo/:id/:street/:city/:state/:country/:zip', function(req, res) {
	console.log("GET " + req.url);

	var id = req.params.id.split("-");

	var client = new pg.Client(conString);
	client.connect();

	var username = req.body.username;

	client.query("UPDATE saddress SET street = $1, city = $2, state = $3, country = $4, zip = $5 where sid = $6 ", [req.params.street, req.params.city, req.params.state, req.params.country, req.params.zip, id[0]], function(err, result) {
		if (err) {
			var response = {
				"success" : false
			};
			client.end();
			res.json(response);
		} else {
			var response = {
				"success" : true
			};
			client.end();
			res.json(response);
		}
	});
});

app.get('/SpruceServer/changeCreditCardInfo/:username/:street/:city/:state/:country/:zip/:id', function(req, res) {
	console.log("GET " + req.url);

	var id = req.params.id.split("-");

	var client = new pg.Client(conString);
	client.connect();

	var username = req.body.username;

	client.query("UPDATE baddress SET street = $1, city = $2, state = $3, country = $4, zip = $5 where bid = $6 ", [req.params.street, req.params.city, req.params.state, req.params.country, req.params.zip, id[1]], function(err, result) {
		if (err) {
			var response = {
				"success" : false
			};
			client.end();
			res.json(response);
		} else {
			client.query("COMMIT");
			var response = {
				"success" : true
			};
			client.end();
			res.json(response);
		}
	});
});

app.get('/SpruceServer/changeGeneralInfo/:username/:fname/:lname/:email/:phone', function(req, res) {
	console.log("GET " + req.url);

	var client = new pg.Client(conString);
	client.connect();

	var username = req.body.username;

	client.query("UPDATE account SET accfname = $2, acclname = $3, accemail = $4, accphonenum = $5 where accusername = $1", [req.params.username, req.params.fname, req.params.lname, req.params.email, req.params.phone], function(err, result) {
		if (err) {
			var response = {
				"success" : false
			};
			client.end();
			res.json(response);
		} else {
			client.query("COMMIT");
			var response = {
				"success" : true
			};
			client.end();
			res.json(response);
		}
	});
});

app.get('/SpruceServer/changeUsername/:username/:changeto', function(req, res) {
	console.log("GET " + req.url);

	var client = new pg.Client(conString);
	client.connect();

	var username = req.body.username;

	client.query("UPDATE account SET accusername = $2 where accusername = $1", [req.params.username, req.params.changeto], function(err, result) {
		if (err) {
			var response = {
				"success" : false
			};
			client.end();
			res.json(response);
		} else {
			client.query("COMMIT");
			var response = {
				"success" : true
			};
			client.end();
			res.json(response);
		}
	});
});

app.put('/SpruceServer/defaultcreditcard/:id', function(req, res) {
	console.log("GET " + req.url);
	var id = req.params.id.split("-");
	var client = new pg.Client(conString);
	client.connect();
	client.query("BEGIN");
	client.query("update credit_card set defaultcard=false where cid in (select cid from account natural join billed natural join credit_card where accpassword=$1)", [req.body.password]);
	client.query("UPDATE credit_card SET defaultcard = true where cid = $1", [id[0]], function(err, result) {
		if (err) {
			var response = {
				"success" : false
			};
			client.end();
			res.json(response);
		} else {
			client.query("COMMIT");
			var response = {
				"success" : true
			};
			client.end();
			res.json(response);
		}
	});
});

app.get('/SpruceServer/removecreditcard/:id', function(req, res) {
	console.log("GET " + req.url);
	var client = new pg.Client(conString);
	client.connect();
	client.query("UPDATE credit_card SET deleted_card = true where cid = $1", [req.params.id], function(err, result) {
		if (err) {
			var response = {
				"success" : false
			};
			client.end();
			res.json(response);
		} else {
			var response = {
				"success" : true
			};
			client.end();
			res.json(response);
		}
	});
});

app.put('/SpruceServer/authenticate1', function(req, res) {
	console.log("PUT " + req.url);

	var client = new pg.Client(conString);
	client.connect();

	var username = req.body.username;
	console.log("Login: " + username);

	var query = client.query({
		text : "SELECT accslt FROM account WHERE activeaccount = true AND accusername = $1",
		values : [username]
	});
	query.on("row", function(row, result) {
		result.addRow(row);
	});
	query.on("end", function(result) {
		if (result.rows.length > 0) {
			// req.session.accid = result.rows[0].accid;
			// console.log("Session for: "+req.session.accid);
			var response = {
				"success" : true,
				"acc" : result.rows
			};
			client.end();
			res.json(response);
			console.log("Found username " + JSON.stringify(response));
		} else {
			var query1 = client.query({
				text : "SELECT adminslt as accslt FROM administrator WHERE adminusername = $1",
				values : [username]
			});
			query1.on("row", function(row, result) {
				result.addRow(row);
			});
			query1.on("end", function(result) {
				if (result.rows.length > 0) {
					var response = {
						"success" : true,
						"acc" : result.rows
					};
					res.json(response);
					console.log("Found admin " + JSON.stringify(response));
				} else {
					res.json({
						"success" : false
					});
					console.log("No username or admin " + JSON.stringify(response));
				}
				client.end();
			});
		}
	});
});

app.put('/SpruceServer/authenticate2', function(req, res) {
	console.log("PUT " + req.url);

	var client = new pg.Client(conString);
	client.connect();

	var username = req.body.username;
	var password = req.body.hash;
	console.log("Authenticating " + username + " " + password);

	var query = client.query({
		text : "SELECT accpassword FROM account WHERE accusername = $1 AND accpassword = $2",
		values : [username, password]
	});
	query.on("row", function(row, result) {
		result.addRow(row);
	});
	query.on("end", function(result) {
		if (result.rows.length > 0) {
			// req.session.accid = result.rows[0].accid;
			// console.log("Session for: "+req.session.accid);
			var response = {
				"success" : true,
				"user" : "user",
				"acc" : result.rows
			};
			client.end();
			res.json(response);
			console.log("Found matching username" + JSON.stringify(response));
		} else {
			var query1 = client.query({
				text : "SELECT adminpassword as accpassword FROM administrator WHERE adminusername = $1 AND adminpassword = $2",
				values : [username, password]
			});
			query1.on("row", function(row, result) {
				result.addRow(row);
			});
			query1.on("end", function(result) {
				if (result.rows.length > 0) {
					var response = {
						"success" : true,
						"user" : "admin",
						"acc" : result.rows
					};
					res.json(response);
					console.log("Found matching admin" + JSON.stringify(response));
				} else {
					res.json({
						"success" : false
					});
					console.log("Failed authentication " + JSON.stringify(response));
				}
				client.end();
			});
		}
	});
});

//REST Home View
app.get('/SpruceServer/checkUsername/:username', function(req, res) {
	console.log("GET " + req.url);

	var client = new pg.Client(conString);
	client.connect();

	var query = client.query({
		text : "SELECT accusername FROM account WHERE accusername = $1",
		values : [req.params.username]
	});
	query.on("row", function(row, result) {
		result.addRow(row);
	});
	query.on("end", function(result) {
		var flag = result.rows.length > 0;
		var response = {
			"success" : flag
		};
		console.log(result);
		console.log(flag);
		client.end();
		res.json(response);
	});
});

// REST for creating a new account
app.put('/SpruceServer/signup', function(req, res) {
	console.log("PUT " + req.url);

	var client = new pg.Client(conString);
	client.connect();

	var username = req.body.username;
	var fname = req.body.fname;
	var lname = req.body.lname;
	var email = req.body.email;
	var password = req.body.password;
	var phone = req.body.phone;
	var photo = req.body.photo;
	var rating = req.body.rating;
	var slt = req.body.slt;
	var saddresLine = req.body.saddresLine;
	var scity = req.body.scity;
	var sstate = req.body.sstate;
	var szip = req.body.szip;
	var scountry = req.body.scountry;
	var baddresLine = req.body.baddresLine;
	var bcity = req.body.bcity;
	var bstate = req.body.bstate;
	var bzip = req.body.bzip;
	var bcountry = req.body.bcountry;
	var cardholderName = req.body.cardholderName;
	var card = req.body.card;
	var cardNumber = req.body.cardNumber;
	var expMonth = req.body.expMonth;
	var expYear = req.body.expYear;
	var csc = req.body.csc;
	var gid = req.body.gid;

	client.query("BEGIN;");
	// Create the new account
	client.query("INSERT INTO account VALUES(DEFAULT, $1, $2, $3, $4, $5, $6, $7, $8, $9);", [fname, lname, username, password, rating, photo, phone, email, slt]);
	if ( typeof gid == 'undefined') {
		// Create the new cart
		client.query("INSERT INTO cart VALUES(DEFAULT);");
		// Set the relationship between the account and its cart
		client.query("INSERT INTO belongs_to VALUES((SELECT max(accid) FROM account), (SELECT max(cartid) FROM cart));");
	} else {
		client.query("INSERT INTO belongs_to VALUES((SELECT max(accid) FROM account), (SELECT cartid FROM cart NATURAL JOIN has NATURAL JOIN guest WHERE guestid=$1));", [gid]);
		client.query("DELETE FROM has WHERE guestid=$1;", [gid]);
		client.query("DELETE FROM guest WHERE guestid=$1;", [gid]);
	}
	// Create the new credit_card
	client.query("INSERT INTO credit_card VALUES(DEFAULT, $1, $2, $3, $4, $5, $6, true,false);", [cardNumber, cardholderName, card, expMonth, expYear, csc]);
	// Set the relationship between he newly created account and its credit card
	client.query("INSERT INTO billed VALUES((SELECT max(accid) FROM account), (SELECT max(cid) FROM credit_card));");
	// Create the new saddress
	client.query("INSERT INTO saddress VALUES(DEFAULT, $1, $2, $3, $4, $5, true, true);", [saddresLine, scity, sstate, scountry, szip]);
	// Create the relationship between the account and the Shipping address
	client.query("INSERT INTO ships_to VALUES((SELECT max(accid) FROM account), (SELECT max(sid) FROM saddress));");
	// Create the new Billing address
	client.query("INSERT INTO baddress VALUES(DEFAULT, $1, $2, $3, $4, $5);", [baddresLine, bcity, bstate, bcountry, bzip]);
	// Create the relationship between the account and the Billing Address
	client.query("INSERT INTO bills_to VALUES((SELECT max(cid) FROM credit_card), (SELECT max(bid) FROM baddress));");
	client.query("COMMIT;");

	var response = {
		"success" : true
	};
	res.json(response);
});

// REST for "deleting" accounts
app.put('/SpruceServer/deleteuser/:username', function(req, res) {
	console.log("PUT " + req.url);

	var client = new pg.Client(conString);
	client.connect();

	var username = req.params.username;

	client.query("BEGIN");
	client.query("UPDATE account SET activeaccount = false WHERE accusername = $1", [username], function(err, result) {
		if (err) {
			var response = {
				"success" : false
			};
			client.end();
			res.json(response);
		} else {
			client.query("COMMIT");
			var response = {
				"success" : true
			};
			client.end();
			res.json(response);
		}
	});

});

// REST for selling item
app.put('/SpruceServer/sellitem', function(req, res) {
	console.log("PUT " + req.url);

	var client = new pg.Client(conString);
	client.connect();

	var name = req.body.name;
	var price = req.body.price;
	var model = req.body.model;
	var dimensions = req.body.dimensions;
	var password = req.body.password;
	var description = req.body.description;
	var amount = req.body.amount;
	var photo = req.body.photo;
	var category = req.body.category;
	var brand = req.body.brand;
	client.query("BEGIN");
	// If amount is one create bid event
	if (amount == 1) {
		// Put item in db with starting date and ending date 7 days from starting date
		client.query("INSERT INTO item VALUES(DEFAULT, $1, $2,LOCALTIMESTAMP, $3, $4, $5, $6, $7,0,$8,false,localtimestamp + '7 days'::interval)", [name, price, description, photo, model, brand, dimensions, amount]);
		// Associate item with its category
		client.query("INSERT INTO describe VALUES((SELECT max(itemid) from item),$1)", [category]);
		// Create bid event, end date is 7 days from todaybhzseeeeeeeeeeeegettttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttttt z (kittiy was here)
		client.query("INSERT INTO bid_event VALUES(DEFAULT,0,true)");
		client.query("INSERT INTO participates VALUES((SELECT max(itemid) FROM item),(SELECT max(eventid) FROM bid_event))");
		// Associate seller with item
		client.query("INSERT INTO sells VALUES((select max(itemid) from item),(SELECT accid from account where accpassword=$1))", [password]);
		client.query('COMMIT', function(err, result) {
			if (err) {
				var response = {
					"success" : false
				};
				client.end();
				res.json(response);
			} else {
				client.query('COMMIT');
				var response = {
					"success" : true
				};
				client.end();
				res.json(response);
			}
		});
	} else {
		// Put item in db with starting date and ending date 7 days from starting date
		client.query("INSERT INTO item VALUES(DEFAULT, $1, $2,LOCALTIMESTAMP, $3, $4, $5, $6, $7,0,$8,true,localtimestamp + '7 days'::interval)", [name, price, description, photo, model, brand, dimensions, amount]);
		// Associate item with its category
		client.query("INSERT INTO describe VALUES((SELECT max(itemid) from item),$1)", [category]);
		// Associate seller with item
		client.query("INSERT INTO sells VALUES((select max(itemid) from item),(SELECT accid from account where accpassword=$1))", [password]);
		client.query('COMMIT', function(err, result) {
			if (err) {
				var response = {
					"success" : false
				};
				client.end();
				res.json(response);
			} else {
				var response = {
					"success" : true
				};
				client.end();
				res.json(response);
			}
		});
	}
});

//REST Updating Restock of item
app.get('/SpruceServer/restockItem/:itemid/:amount', function(req, res) {
	console.log("GET " + req.url);
	var client = new pg.Client(conString);
	client.connect();
	client.query("update item set amount=amount+$1 where itemid=$2", [req.params.amount, req.params.itemid], function(err, result) {
		if (err) {
			var response = {
				"success" : false
			};
			client.end();
			res.json(response);
		} else {
			var response = {
				"success" : true
			};
			client.end();
			res.json(response);
		}
	});
});

//REST Bidding on an item
app.put('/SpruceServer/bidItem/:itemid/:amount', function(req, res) {
	console.log("GET " + req.url);
	var client = new pg.Client(conString);
	client.connect();
	client.query("BEGIN");
	var query = client.query({
		text : "select currentbidprice from bid_event natural join participates natural join item where itemid=$1",
		values : [req.params.itemid]
	});
	query.on("row", function(row, result) {
		result.addRow(row);
	});
	query.on("end", function(result) {
		if (parseFloat(result.rows[0]['currentbidprice']) < parseFloat(req.params.amount)) {
			client.query("insert into bid values(DEFAULT,$1,localtimestamp)", [req.params.amount]);
			client.query("insert into places values((select max(bidid) from bid),(select accid from account where accpassword=$1))", [req.body.password]);
			client.query("insert into on_event values((select max(bidid) from bid),(select eventid from bid_event natural join participates natural join item where itemid=$1))", [req.params.itemid]);
			client.query("update bid_event set currentbidprice=$1 where eventid in (select  eventid from bid_event natural join participates natural join item where itemid=$2)", [req.params.amount, req.params.itemid], function(err, result) {
				if (err) {
					var response = {
						"success" : false
					};
					client.end();
					res.json(response);
				} else {
					client.query('COMMIT');
					var response = {
						"success" : true
					};
					client.end();
					res.json(response);
				}
			});
		} else {
			var response = {
				"success" : false,
				"bid" : result.rows[0]['currentbidprice']
			};
			client.end();
			res.json(response);
		}
	});
});

//REST Home View
app.get('/SpruceServer/home/', function(req, res) {
	console.log("GET " + req.url);

	var client = new pg.Client(conString);
	client.connect();

	var query = client.query({
		text : "SELECT * FROM item NATURAL JOIN sells NATURAL JOIN account WHERE activeaccount = true AND item.amount > 0 AND item_end_date > current_timestamp ORDER BY views DESC LIMIT 3"
	});

	query.on("row", function(row, result) {
		result.addRow(row);
	});

	query.on("end", function(result) {
		var response = {
			"items" : result.rows
		};
		client.end();
		res.json(response);
	});

});

//REST Popular Now View
app.get('/SpruceServer/Spruce/PopularNow/', function(req, res) {
	console.log("GET " + req.url);

	var client = new pg.Client(conString);
	client.connect();

	var query = client.query({
		text : "SELECT * FROM item NATURAL JOIN sells NATURAL JOIN account WHERE activeaccount = true AND item.amount > 0 AND item_end_date > current_timestamp ORDER BY views DESC"
	});

	query.on("row", function(row, result) {
		result.addRow(row);
	});

	query.on("end", function(result) {
		var response = {
			"items" : result.rows
		};
		client.end();
		res.json(response);
	});

});

// Global search
app.get('/SpruceServer/searchpage/:parameter', function(req, res) {
	console.log("GET " + req.url);
	var parameter = req.params.parameter;
	var client = new pg.Client(conString);
	client.connect();

	var query = client.query({
		text : "SELECT * FROM item WHERE itemname ILIKE '%" + parameter + "%' AND item.amount > 0 AND item_end_date > current_timestamp"
	});
	query.on("row", function(row, result) {
		result.addRow(row);
	});

	query.on("end", function(result) {
		var response = {
			"items" : result.rows
		};
		console.log(response);
		client.end();
		res.json(response);
	});
});

// REST Operation - Info Categories
app.get('/SpruceServer/getItemsForCategory/:category/:orderby/:offset', function(req, res) {
	// console.log("GET " + req.url);
	// console.log("Account: " + req.session.accid);

	var client = new pg.Client(conString);
	client.connect();

	var categoryId = req.params.category;
	var offset = req.params.offset;
	var orderby = req.params.orderby.split("-");
	var query;
	if (orderby[0] == "none") {
		query = client.query({
			text : "SELECT item.* FROM category NATURAL JOIN describe NATURAL JOIN item NATURAL JOIN sells NATURAL JOIN account WHERE account.activeaccount = true AND item.amount > 0 AND item_end_date > current_timestamp AND catid IN (SELECT subcatid FROM subcat WHERE catid = $1 offset $2)",
			values : [categoryId, offset]
		});
	} else {
		query = client.query({
			text : "SELECT item.* FROM category NATURAL JOIN describe NATURAL JOIN item NATURAL JOIN sells NATURAL JOIN account WHERE account.activeaccount = true AND item.amount > 0 AND item_end_date > current_timestamp AND catid IN (SELECT subcatid FROM subcat WHERE catid = $1) ORDER BY " + orderby[0] + " " + orderby[1] + " OFFSET $2",
			values : [categoryId, offset]
		});
	}
	query.on("row", function(row, result) {
		result.addRow(row);
	});
	query.on("end", function(result) {
		if (result.rows.length > 0) {
			var response = {
				"items" : result.rows
			};
			//result.rows[0]['hey']='hi'
			client.end();
			res.json(response);
		} else {
			var query1;
			if (orderby[0] == "none") {
				query1 = client.query({
					text : "SELECT item.* FROM category NATURAL JOIN describe NATURAL JOIN item WHERE amount > 0 AND catid = $1 OFFSET $2",
					values : [categoryId, offset]
				});
			} else {
				query1 = client.query({
					text : "SELECT item.* FROM category NATURAL JOIN describe NATURAL JOIN item WHERE amount > 0 AND catid = $1 ORDER BY " + orderby[0] + " " + orderby[1] + " OFFSET $2",
					values : [categoryId, offset]
				});
			}
			query1.on("row", function(row, result) {
				result.addRow(row);
			});
			query1.on("end", function(result) {
				var response = {
					"items" : result.rows
				};
				client.end();
				res.json(response);
			});
		}
	});

});

//Get Subcategory for popup
app.get('/SpruceServer/getSubCategoryListPopup/:category/:type', function(req, res) {
	console.log("GET " + req.url);

	var client = new pg.Client(conString);
	client.connect();

	var categoryId = req.params.category;
	var type = req.params.type;
	if (type == "parent") {
		var query0 = client.query({
			text : "SELECT C.catid,C.catname FROM category AS C, subcat AS S WHERE S.subcatid=C.catid AND subcatid NOT IN (SELECT subcatid FROM subcat WHERE subcat.catid <> $1)",
			values : [categoryId],
		});
		query0.on("row", function(row, result) {
			result.addRow(row);
		});
		query0.on("end", function(result) {
			var response = {
				"categories" : result.rows
			};
			client.end();
			res.json(response);
		});
	} else {
		var query0 = client.query({
			text : "SELECT distinct C.catid,C.catname FROM category AS C, subcat AS S WHERE S.subcatid=C.catid AND subcatid IN (SELECT subcatid FROM subcat WHERE subcat.catid = $1)",
			values : [categoryId],
		});
		query0.on("row", function(row, result) {
			result.addRow(row);
		});
		query0.on("end", function(result) {
			var response = {
				"categories" : result.rows
			};
			client.end();
			res.json(response);
		});
	}
});

//Get categories for panel
app.get('/SpruceServer/getCategoriesForSidePanel', function(req, res) {
	console.log("GET " + req.url);

	var client = new pg.Client(conString);
	client.connect();

	var categoryId = -1;

	var query0 = client.query({
		text : "SELECT category.catid, category.catname FROM subcat, category WHERE category.catid = subcat.catid AND category.catid not in (SELECT subcatid FROM subcat) GROUP BY category.catid ORDER BY category.catid"
	});
	query0.on("row", function(row, result) {
		result.addRow(row);
	});
	query0.on("end", function(result) {
		var response = {
			"categories" : result.rows
		};
		client.end();
		res.json(response);
	});

});

//Get subcategories
app.get('/SpruceServer/getSubCategories', function(req, res) {
	console.log("GET " + req.url);
	var client = new pg.Client(conString);
	client.connect();
	var count = 0;
	var count2 = 0;
	var query0 = client.query({
		text : "SELECT category.catid, category.catname FROM subcat, category WHERE category.catid = subcat.catid AND category.catid not in (SELECT subcatid FROM subcat) GROUP BY category.catid ORDER BY category.catid"
	});
	query0.on("row", function(row, result) {
		row['subcat'] = new Array();
		result.addRow(row);
	});
	query0.on("end", function(result) {
		var response = {
			"categories" : result.rows
		};
		for (var i = 0; i < response.categories.length; i++) {
			var query1 = client.query({
				text : "SELECT C.catid,C.catname FROM category AS C, subcat AS S WHERE S.subcatid=C.catid AND subcatid NOT IN (SELECT subcatid FROM subcat WHERE subcat.catid <> $1)",
				values : [response.categories[i].catid],
			});
			query1.on("row", function(row, result) {
				response.categories[count].subcat.push(row);
			});
			query1.on("end", function(row, result) {
				count++;
				if (count == response.categories.length) {
					console.log(response.categories);
					res.json(response);
					client.end();
				}
			});
		}
	});
});

//REST My Spruce
app.put('/SpruceServer/mySpruce/:select', function(req, res) {
	// console.log("GET " + req.url);
	var client = new pg.Client(conString);
	client.connect();

	var queryText;
	// var index = -1;
	if (req.params.select == 'bidding') {
		var query = client.query({
			text : "SELECT item.*, max(biddate) as date, max(bidprice) FROM account NATURAL JOIN places NATURAL JOIN bid NATURAL JOIN on_event NATURAL JOIN bid_event NATURAL JOIN participates NATURAL JOIN item WHERE item.amount > 0 AND account.accpassword = $1 AND item_end_date > current_timestamp GROUP BY item.itemid ORDER BY date",
			values : [req.body.acc]
		});
		query.on("row", function(row, result) {
			result.addRow(row);
			// console.log(id);
		});
		query.on("end", function(result) {
			var response = {
				"items" : result.rows
			};
			client.end();
			res.json(response);
		});

	} else if (req.params.select == 'selling') {
		var query = client.query({
			text : "SELECT item.* FROM account NATURAL JOIN sells NATURAL JOIN item WHERE account.accpassword = $1 AND (item.amount > 0 OR restock = true) AND item_end_date > current_timestamp",
			values : [req.body.acc]
		});
		query.on("row", function(row, result) {
			result.addRow(row);
			// console.log(id);
		});
		query.on("end", function(result) {
			var response = {
				"items" : result.rows
			};
			client.end();
			res.json(response);
		});

	} else if (req.params.select == 'sold') {
		var query = client.query({
			text : "SELECT item.*, invoice.invoicedate as solddate,bid_event.currentbidprice,wins.bidwonid,invoice.invoiceid FROM account NATURAL JOIN keeps NATURAL JOIN invoice NATURAL JOIN of NATURAL JOIN item left outer join participates on(item.itemid=participates.itemid) left outer join bid_event on(participates.eventid=bid_event.eventid) left outer join wins on(item.itemid=wins.itemid) WHERE accpassword <> $1 AND item.itemid IN (SELECT itemid FROM account NATURAL JOIN sells WHERE accpassword = $1) ORDER BY solddate DESC",
			values : [req.body.acc]
		});
		query.on("row", function(row, result) {
			result.addRow(row);
			// console.log(id);
		});
		query.on("end", function(result) {
			var response = {
				"items" : result.rows
			};
			client.end();
			res.json(response);
		});
	} else {
		var query = client.query({
			text : "select item.* from account natural join sells natural join item left outer join participates on (item.itemid=participates.itemid) left outer join bid_event on (bid_event.eventid=participates.eventid) where item_end_date < localtimestamp and currentbidprice != 0 and accpassword=$1 and active=true and item.itemid not in(SELECT itemid FROM account NATURAL JOIN keeps NATURAL JOIN invoice NATURAL JOIN of NATURAL JOIN item WHERE accpassword <> $1 AND item.itemid IN (SELECT itemid FROM account NATURAL JOIN sells WHERE accpassword = $1))",
			values : [req.body.acc]
		});
		query.on("row", function(row, result) {
			result.addRow(row);
			// console.log(id);
		});
		query.on("end", function(result) {
			var response = {
				"items" : result.rows
			};
			client.end();
			res.json(response);
		});
	}
});

//REST Bids for item
app.get('/SpruceServer/negotiateBid/:itemid', function(req, res) {
	console.log("GET " + req.url);
	var client = new pg.Client(conString);
	client.connect();
	var query0 = client.query({
		text : "select itemid,accrating,accusername,accphoto,currentbidprice,itemname,model,brand,price,photo from account natural join places natural join bid natural join on_event natural join bid_event natural join participates natural join item where bidprice=currentbidprice and itemid=$1",
		values : [req.params.itemid],
	});
	query0.on("row", function(row, result) {
		result.addRow(row);
	});
	query0.on("end", function(result) {
		var response = {
			"bidinfo" : result.rows
		};
		client.end();
		res.json(response);
	});
});

//REST Get sold reciept for seller
app.get('/SpruceServer/soldReciept/:invoiceid/:itemid', function(req, res) {
	console.log("GET " + req.url);
	var client = new pg.Client(conString);
	client.connect();
	var query0 = client.query({
		text : "select accusername,accphoto,accrating,invoice.invoicedate,saddress.*,of.itemquantity,brand,photo,model,itemname from account natural join keeps natural join invoice natural join send_to natural join saddress natural join of natural join item where invoice.invoiceid=$1 and item.itemid=$2",
		values : [req.params.invoiceid, req.params.itemid],
	});
	query0.on("row", function(row, result) {
		result.addRow(row);
	});
	query0.on("end", function(result) {
		var response = {
			"recieptinfo" : result.rows
		};
		client.end();
		res.json(response);
	});
});

//REST Bids for item
app.get('/SpruceServer/declineBid/:itemid', function(req, res) {
	console.log("GET " + req.url);
	var client = new pg.Client(conString);
	client.connect();
	client.query("BEGIN");
	client.query("update bid_event set active=false from item natural join participates where item.itemid=$1 and bid_event.eventid=participates.eventid", [req.params.itemid], function(err, result) {
		if (err) {
			client.query("COMMIT");
			var response = {
				"success" : false
			};
			client.end();
			res.json(response);
		} else {
			client.query("COMMIT");
			var response = {
				"success" : true
			};
			client.end();
			res.json(response);
		}
	});
});

//REST Get an item for the buyer
app.put('/SpruceServer/getProduct/:id', function(req, res) {
	var id = req.params.id;
	console.log("Get product for account with password: " + req.body.password);
	var client = new pg.Client(conString);
	client.connect();
	client.query("BEGIN");
	// Incremetn view
	client.query("update item set views=views+1 where itemid=$1", [id]);
	// Get item with its bid event, bid event can be null (left outer join) this will facilitate the app
	var query = client.query({
		text : "select item.*,bid_event.*,account.accusername,account.accrating from account natural join sells natural join item left outer join participates on (item.itemid=participates.itemid) left outer join bid_event on (bid_event.eventid=participates.eventid)  where item.itemid=$1",
		values : [id]
	});
	query.on("row", function(row, result) {
		result.addRow(row);
	});
	query.on("end", function(result) {
		// Is a user check cart for quantity
		if (req.body.password != null) {
			var query2 = client.query({
				text : "SELECT quantity FROM account NATURAL JOIN belongs_to NATURAL JOIN cart NATURAL JOIN contains WHERE itemid = $1 AND accpassword = $2",
				values : [id, req.body.password]
			});
			query2.on("row", function(row3, result3) {
				result.rows[0]['quantityincart'] = row3.quantity;
			});
			query2.on("end", function(result3) {
				if (result.rows[0]['quantityincart'] == null) {
					result.rows[0]['quantityincart'] = 0;
				}
				var response = {
					"product" : result.rows
				};
				client.query("COMMIT");
				client.end();
				console.log(response);
				res.json(response);
			});
		} else {
			// Is a guest check cart for quantity
			var query2 = client.query({
				text : "SELECT quantity FROM guest NATURAL JOIN has NATURAL JOIN cart NATURAL JOIN contains WHERE itemid = $1 AND guestid = $2",
				values : [id, req.body.gid]
			});
			query2.on("row", function(row3, result3) {
				result.rows[0]['quantityincart'] = row3.quantity;
			});
			query2.on("end", function(result3) {
				if (result.rows[0]['quantityincart'] == null) {
					result.rows[0]['quantityincart'] = 0;
				}
				var response = {
					"product" : result.rows
				};
				client.query("COMMIT");
				client.end();
				console.log(response);
				res.json(response);
			});
		}
	});
});

//REST Get an item for the seller
app.get('/SpruceServer/getProduct/:id', function(req, res) {
	var id = req.params.id;
	var client = new pg.Client(conString);
	client.connect();
	client.query("BEGIN");
	// Get item with its bid event if bid event can be null (left outer join) this will facilitate the app
	var query = client.query({
		text : "SELECT item.*, bid_event.*, account.accusername, account.accrating FROM account NATURAL JOIN sells NATURAL JOIN item LEFT OUTER JOIN participates ON (item.itemid = participates.itemid) LEFT OUTER JOIN bid_event ON (bid_event.eventid = participates.eventid) WHERE item.itemid = $1",
		values : [id]
	});
	query.on("row", function(row, result) {
		result.addRow(row);
	});
	query.on("end", function(result) {
		var response = {
			"product" : result.rows
		};
		client.query("COMMIT");
		client.end();
		console.log(response);
		res.json(response);
	});
});

//REST Get password of the seller of an item to do some checking in the app
app.get('/SpruceServer/checkProduct/:id', function(req, res) {
	var id = req.params.id;
	var client = new pg.Client(conString);
	client.connect();
	var query = client.query({
		text : "SELECT accpassword FROM item NATURAL JOIN sells NATURAL JOIN account WHERE itemid = $1",
		values : [id]
	});
	query.on("row", function(row, result) {
		result.addRow(row);
	});
	query.on("end", function(result) {
		var response = {
			"password" : result.rows
		};
		client.end();
		console.log(response);
		res.json(response);
	});
});

//REST Bids for item
app.get('/SpruceServer/seller-product-bids/:id', function(req, res) {
	console.log("GET " + req.url);
	var client = new pg.Client(conString);
	client.connect();
	var query0 = client.query({
		text : "SELECT accusername, bidprice FROM item NATURAL JOIN participates NATURAL JOIN bid_event NATURAL JOIN on_event NATURAL JOIN bid NATURAL JOIN places NATURAL JOIN account WHERE itemid = $1 ORDER BY bidprice DESC",
		values : [req.params.id],
	});
	query0.on("row", function(row, result) {
		result.addRow(row);
	});
	query0.on("end", function(result) {
		var response = {
			"bids" : result.rows
		};
		client.end();
		res.json(response);
	});
});

//Get seller profile for user
app.get('/SpruceServer/sellerprofile/:username', function(req, res) {
	console.log("GET " + req.url);

	var client = new pg.Client(conString);
	client.connect();

	var query = client.query({
		text : "SELECT * FROM account NATURAL JOIN ships_to NATURAL JOIN saddress WHERE activeaccount = true AND  accusername = $1",
		values : [req.params.username]
	});
	query.on("row", function(row, result) {
		result.addRow(row);
	});
	query.on("end", function(result) {
		if (result.rows.length == 0) {
			var response = {
				"success" : true
			};
			client.end();
			res.json(response);
		} else {
			var response = {
				"sellerprofile" : result.rows
			};
			client.end();
			res.json(response);
		}
	});

});

//REST for cart
app.put('/SpruceServer/mycart', function(req, res) {
	console.log("GET " + req.url);
	var client = new pg.Client(conString);
	client.connect();
	client.query("BEGIN");
	client.query("DELETE FROM contains WHERE itemid in(SELECT itemid FROM item WHERE amount < 1 OR item_end_date < current_timestamp )");
	//Its a guest so find guest cart
	if (req.body.acc == null) {
		console.log("Is a guest");
		console.log("Cart for guest: " + req.body.gid);
		var query = client.query({
			text : "SELECT item.*, quantity FROM cart NATURAL JOIN contains NATURAL JOIN item NATURAL JOIN has NATURAL JOIN guest WHERE guest.guestid = $1;",
			values : [req.body.gid]
		});
		query.on("row", function(row, result) {
			result.addRow(row);
		});
		query.on("end", function(result) {
			var response = {
				"cart" : result.rows
			};
			client.query("COMMIT;");
			client.end();
			res.json(response);
		});
	}
	//Its a user get user cart
	else {
		console.log("Cart for account: " + req.body.acc);
		var query = client.query({
			text : "SELECT item.*, quantity FROM cart NATURAL JOIN contains NATURAL JOIN item NATURAL JOIN belongs_to NATURAL JOIN account WHERE account.accpassword = $1",
			values : [req.body.acc]
		});
		query.on("row", function(row, result) {
			result.addRow(row);
		});
		query.on("end", function(result) {
			client.query("COMMIT;");
			var response = {
				"cart" : result.rows
			};
			client.end();
			res.json(response);
		});
	}
});

//REST for adding item to cart
app.put('/SpruceServer/addToCart/:itemid/:quantity', function(req, res) {
	console.log("GET " + req.url);
	var itemid = req.params.itemid;
	var quantity = req.params.quantity;
	//Its a new guest, create everything and add item
	if (req.body.password == null && req.body.gid == null) {
		console.log("Is a guest for the first time");
		var client = new pg.Client(conString);
		client.connect();
		var query = client.query({
			text : "BEGIN; INSERT INTO guest VALUES(DEFAULT); INSERT INTO cart VALUES(DEFAULT); INSERT INTO has VALUES((SELECT max(guestid) FROM guest), (SELECT max(cartid) FROM cart)); SELECT max(cartid) as cartid, max(guestid) as guestid FROM cart, guest; COMMIT;"
		});
		query.on("row", function(row, result) {
			result.addRow(row);
		});
		query.on("end", function(result) {
			var query1 = client.query({
				text : "INSERT INTO contains VALUES($1,$2,$3)",
				values : [result.rows[0]['cartid'], itemid, quantity]
			});
			query1.on("end", function(result2) {
				var response = {
					"guest" : result.rows
				};
				client.end();
				res.json(response);
			});
		});
	} else {
		//its a guest add item to guest cart
		if (req.body.password == null) {
			console.log("Adding item to cart for guest: " + req.body.gid);
			var client = new pg.Client(conString);
			client.connect();
			var query = client.query({
				text : "INSERT INTO contains SELECT cartid,$1,$2 from guest natural join has natural join cart where guestid=$3",
				values : [itemid, quantity, req.body.gid]
			});
			query.on("end", function(result) {
				var response = {
					"success" : true
				};
				client.end();
				res.json(response);
			});
		}
		//its a user add item to user cart
		else {
			console.log("Adding item to cart for account: " + req.body.password);
			var client = new pg.Client(conString);
			client.connect();
			var query = client.query({
				text : "INSERT INTO contains SELECT cartid, $1, $2 FROM account NATURAL JOIN belongs_to NATURAL JOIN cart WHERE accpassword = $3",
				values : [itemid, quantity, req.body.password]
			});
			query.on("end", function(result) {
				var response = {
					"success" : true
				};
				client.end();
				res.json(response);
			});
		}
	}
});

//REST for updating quantity of item in cart
app.put('/SpruceServer/updateToCart/:itemid/:quantity', function(req, res) {
	console.log("GET " + req.url);

	if (req.body.password == null) {
		console.log("Is a guest");
		console.log("Updating item to cart for guest: " + req.body.password);
		var itemid = req.params.itemid;
		var quantity = req.params.quantity;
		var client = new pg.Client(conString);
		client.connect();
		var query = client.query({
			text : "UPDATE contains SET quantity = $1 FROM guest NATURAL JOIN has NATURAL JOIN cart WHERE itemid = $2 AND guestid = $3",
			values : [quantity, itemid, req.body.gid]
		});
		query.on("end", function(result) {
			var response = {
				"success" : true
			};
			client.end();
			res.json(response);
		});
	} else {
		console.log("Updating item to cart for account: " + req.body.password);
		var itemid = req.params.itemid;
		var quantity = req.params.quantity;
		var client = new pg.Client(conString);
		client.connect();
		var query = client.query({
			text : "UPDATE contains SET quantity = $1 FROM account NATURAL JOIN belongs_to NATURAL JOIN cart WHERE itemid = $2 AND accpassword = $3",
			values : [quantity, itemid, req.body.password]
		});
		query.on("end", function(result) {
			var response = {
				"success" : true
			};
			client.end();
			res.json(response);
		});
	}
});

//REST for deleting item in cart
app.put('/SpruceServer/deleteFromCart/:itemid', function(req, res) {
	console.log("GET " + req.url);
	if (req.body.password == null) {
		console.log("Is a guest");
		console.log("Deleting item to cart for guest: " + req.body.gid);
		var itemid = req.params.itemid;
		var quantity = req.params.quantity;
		var client = new pg.Client(conString);
		client.connect();
		var query = client.query({
			text : "DELETE FROM contains WHERE cartid in (SELECT cartid FROM guest NATURAL JOIN has NATURAL JOIN cart WHERE guestid = $1) AND itemid = $2",
			values : [req.body.gid, itemid]
		});
		query.on("end", function(result) {
			var response = {
				"success" : true
			};
			client.end();
			res.json(response);
		});
	} else {
		console.log("Deleting item to cart for account: " + req.body.password);
		var itemid = req.params.itemid;
		var quantity = req.params.quantity;
		var client = new pg.Client(conString);
		client.connect();
		var query = client.query({
			text : "delete from contains where cartid in ( select cartid from account natural join belongs_to natural join cart where accpassword=$1) and itemid=$2",
			values : [req.body.password, itemid]
		});
		query.on("end", function(result) {
			var response = {
				"success" : true
			};
			client.end();
			res.json(response);
		});
	}
});

//REST for last purchase sumary
app.put('/SpruceServer/purchaseSumary', function(req, res) {
	console.log("GET " + req.url);
	console.log("Cart for account: " + req.body.acc);

	var client = new pg.Client(conString);
	client.connect();

	var query = client.query({
		text : "SELECT item.*, itemquantity as quantity, credit_card.number, saddress.* FROM keeps NATURAL JOIN invoice NATURAL JOIN of NATURAL JOIN item NATURAL JOIN account NATURAL JOIN send_to NATURAL JOIN saddress NATURAL JOIN paid_with NATURAL JOIN credit_card WHERE account.accpassword = $1 AND invoice.invoiceid = (SELECT max(invoiceid) FROM invoice)",
		values : [req.body.acc]
	});
	query.on("row", function(row, result) {
		result.addRow(row);
	});
	query.on("end", function(result) {
		var response = {
			"items" : result.rows
		};
		client.end();
		res.json(response);
	});

});

//REST for purchase sumary
app.put('/SpruceServer/purchaseSumary/:id', function(req, res) {
	console.log("GET " + req.url);
	console.log("Cart for account: " + req.body.acc);

	var client = new pg.Client(conString);
	client.connect();

	var query = client.query({
		text : "SELECT item.*, itemquantity as quantity, credit_card.number, saddress.* FROM keeps NATURAL JOIN invoice NATURAL JOIN of NATURAL JOIN item NATURAL JOIN account NATURAL JOIN send_to NATURAL JOIN saddress NATURAL JOIN paid_with NATURAL JOIN credit_card WHERE account.accpassword = $1 AND invoice.invoiceid = $2",
		values : [req.body.acc, req.params.id]
	});
	query.on("row", function(row, result) {
		result.addRow(row);
	});
	query.on("end", function(result) {
		var response = {
			"items" : result.rows
		};
		client.end();
		res.json(response);
	});

});

app.put('/SpruceServer/checkout', function(req, res) {
	console.log("GET " + req.url);

	var client = new pg.Client(conString);
	client.connect();

	var password = req.body.password;

	var query = client.query({
		text : "SELECT number, cid FROM account NATURAL JOIN billed NATURAL JOIN credit_card WHERE accpassword = $1 AND deleted_card=false",
		values : [password]
	});
	query.on("row", function(row, result) {
		result.addRow(row);
	});
	query.on("end", function(result) {
		var address = [];
		var query1 = client.query({
			text : "SELECT street, city, sid FROM account NATURAL JOIN ships_to NATURAL JOIN saddress WHERE accpassword = $1 AND activesaddress = true",
			values : [password]
		});
		query1.on("row", function(row, result2) {
			address.push(row);
		});
		query1.on("end", function(row, result2) {
			var response = {
				"creditnumber" : result.rows,
				"shippinginfo" : address
			};
			client.end();
			res.json(response);
			console.log(response);
		});
	});
});

app.put('/SpruceServer/generateInvoice/cart', function(req, res) {
	console.log("GET " + req.url);
	var client = new pg.Client(conString);
	client.connect();

	var acc = req.body.acc;
	var total = req.body.total;
	var card = req.body.card;
	var address = req.body.address;

	client.query("BEGIN;");
	// Create the new invoice
	client.query("INSERT INTO invoice VALUES(DEFAULT, current_timestamp, $1);", [total]);
	// Create the realetionship between the Invoice and the Shipping Address
	client.query("INSERT INTO send_to VALUES((SELECT max(invoiceid) FROM invoice), (SELECT sid FROM account NATURAL JOIN ships_to WHERE accpassword = $1 AND sid = $2));", [acc, address]);
	// Create the realetionship between the Invoice and the Credit Card
	client.query("INSERT INTO paid_with VALUES((SELECT max(invoiceid) FROM invoice), (SELECT cid FROM account NATURAL JOIN billed WHERE accpassword = $1 AND cid = $2));", [acc, card]);
	// Create the realetionship between the Account and the Invoice
	client.query("INSERT INTO keeps VALUES((SELECT max(invoiceid) FROM invoice), (SELECT accid FROM account WHERE accpassword = $1));", [acc]);
	// Get the items in the cart
	var query = client.query({
		text : "SELECT item.*, quantity FROM cart NATURAL JOIN contains NATURAL JOIN item NATURAL JOIN belongs_to NATURAL JOIN account WHERE account.accpassword = $1",
		values : [acc]
	});
	query.on("row", function(row, result) {
		result.addRow(row);
	});
	query.on("end", function(result) {
		for (var i = 0; i < result.rows.length; i++) {
			// Create the relationship between the Item and the Invoice
			client.query("INSERT INTO of VALUES((SELECT max(invoiceid) FROM invoice), $1, $2);", [result.rows[i].itemid, result.rows[i].quantity]);
			// Update the amount left for the item
			client.query("UPDATE item SET amount = amount - (SELECT itemquantity FROM account NATURAL JOIN keeps NATURAL JOIN invoice NATURAL JOIN of NATURAL JOIN item WHERE account.accid = (SELECT accid FROM account WHERE accpassword = $1) AND invoice.invoiceid = (SELECT max(invoiceid) FROM invoice) AND item.itemid = $2) WHERE item.itemid = $2", [acc, result.rows[i].itemid]);
			if (i + 1 == result.rows.length) {
				client.query("DELETE FROM contains WHERE cartid = (SELECT cartid FROM account NATURAL JOIN belongs_to WHERE accpassword = $1)", [acc]);
				client.query("COMMIT;");
			}
		}
	});

	var response = {
		"success" : true
	};
	res.json(response);
});

app.put('/SpruceServer/generateInvoice/buyitnow', function(req, res) {
	console.log("GET " + req.url);
	var client = new pg.Client(conString);
	client.connect();

	var acc = req.body.acc;
	var total = req.body.total;
	var card = req.body.card;
	var address = req.body.address;
	var itemid = req.body.itemid;
	var quantity = req.body.quantity;
	client.query("BEGIN;");
	var query = client.query({
		text : "SELECT item.amount FROM item WHERE item.itemid = $1;",
		values : [itemid]
	});
	query.on("row", function(row, result) {
		result.addRow(row);
	});

	query.on("end", function(result) {
		if (result.rows[0]['amount'] >= quantity) {
			//client.query("BEGIN;");
			// Create the new invoice
			client.query("INSERT INTO invoice VALUES(DEFAULT, current_timestamp, $1);", [total]);
			// Create the realetionship between the Invoice and the Shipping Address
			client.query("INSERT INTO send_to VALUES((SELECT max(invoiceid) FROM invoice), (SELECT sid FROM account NATURAL JOIN ships_to WHERE accpassword = $1 AND sid = $2));", [acc, address]);
			// Create the realetionship between the Invoice and the Credit Card
			client.query("INSERT INTO paid_with VALUES((SELECT max(invoiceid) FROM invoice), (SELECT cid FROM account NATURAL JOIN billed WHERE accpassword = $1 AND cid = $2));", [acc, card]);
			// Create the realetionship between the Invoice and the Account
			client.query("INSERT INTO keeps VALUES((SELECT max(invoiceid) FROM invoice), (SELECT accid FROM account WHERE accpassword = $1));", [acc]);
			// Create the relationship between the Invoice and the Item
			client.query("INSERT INTO of VALUES((SELECT max(invoiceid) FROM invoice), $1, $2);", [itemid, quantity]);
			// Update the amount left for the item
			client.query("UPDATE item SET amount = amount - (SELECT itemquantity FROM account NATURAL JOIN keeps NATURAL JOIN invoice NATURAL JOIN of NATURAL JOIN item WHERE account.accid = (SELECT accid FROM account WHERE accpassword = $1) AND invoice.invoiceid = (SELECT max(invoiceid) FROM invoice) AND item.itemid = $2) WHERE item.itemid = $2", [acc, itemid]);
			client.query("COMMIT;");

			var response = {
				"success" : true
			};
			res.json(response);
		} else {
			client.query("COMMIT;");
			var response = {
				"success" : false
			};
			res.json(response);
		}
	});

});

app.put('/SpruceServer/generateInvoice/auction', function(req, res) {
	console.log("GET " + req.url);
	var client = new pg.Client(conString);
	client.connect();

	var username = req.body.username;
	var total = req.body.price;
	var itemid = req.body.itemid;
	var acc = req.body.password;

	client.query("BEGIN;");
	// Create the new invoice
	client.query("INSERT INTO invoice VALUES(DEFAULT, current_timestamp, $1);", [total]);
	// Create the realetionship between the Invoice and the Shipping Address
	client.query("INSERT INTO send_to VALUES((SELECT max(invoiceid) FROM invoice), (SELECT sid FROM account NATURAL JOIN ships_to NATURAL JOIN saddress WHERE accpassword = $1 AND defaultaddress = true));", [acc]);
	// Create the realetionship between the Invoice and the Credit Card
	client.query("INSERT INTO paid_with VALUES((SELECT max(invoiceid) FROM invoice), (SELECT cid FROM account NATURAL JOIN billed NATURAL JOIN credit_card WHERE accpassword = $1 AND defaultcard = true));", [acc]);
	// Create the realetionship between the Account and the Invoice
	client.query("INSERT INTO keeps VALUES((SELECT max(invoiceid) FROM invoice), (SELECT accid FROM account WHERE accusername = $1));", [username]);
	// Create the relationship between the Item and the Invoice
	client.query("INSERT INTO of VALUES((SELECT max(invoiceid) FROM invoice), $1, 1);", [itemid]);
	// Update the amount left for the item
	client.query("UPDATE item SET amount = amount - (SELECT itemquantity FROM account NATURAL JOIN keeps NATURAL JOIN invoice NATURAL JOIN of NATURAL JOIN item WHERE account.accid = (SELECT accid FROM account WHERE accusername = $1) AND invoice.invoiceid = (SELECT max(invoiceid) FROM invoice) AND item.itemid = $2) WHERE item.itemid = $2", [username, itemid]);
	// Set active state of bid event false
	client.query("update bid_event set active=false from item natural join participates where item.itemid=$1 and bid_event.eventid=participates.eventid", [itemid]);
	// Create winning bid
	client.query("INSERT INTO winning_bid VALUES(DEFAULT,$1,localtimestamp)", [total]);
	// Create winning bid relation with bid event
	client.query("INSERT INTO determines VALUES((SELECT eventid FROM item NATURAL JOIN participates NATURAL JOIN bid_event where item.itemid=$1),(SELECT max(bidwonid) from winning_bid ))", [itemid]);
	// Create winning bid item relation
	client.query("INSERT INTO wins VALUES($1,(SELECT max(bidwonid) from winning_bid))", [itemid]);
	// Create winning bid account relation
	client.query("INSERT INTO placed_by VALUES((SELECT accid FROM account WHERE accusername=$1),(SELECT max(bidwonid) FROM winning_bid))", [username]);
	client.query("COMMIT;");

	var response = {
		"success" : true
	};
	res.json(response);
});

//REST for user store
app.put('/SpruceServer/getUserStore', function(req, res) {
	console.log("GET " + req.url);

	var client = new pg.Client(conString);
	client.connect();
	console.log(req.body.accusername);

	var query = client.query({
		text : "SELECT item.* FROM account NATURAL JOIN sells NATURAL JOIN item WHERE account.accusername = $1 AND item.amount > 0 AND item_end_date > current_timestamp",
		values : [req.body.accusername]
	});
	query.on("row", function(row, result) {
		result.addRow(row);
	});

	query.on("end", function(result) {
		var response = {
			"items" : result.rows
		};
		client.end();
		res.json(response);
	});
});

//REST for Buyers List
app.get('/SpruceServer/getBuyers/:id', function(req, res) {
	console.log("GET " + req.url);

	var client = new pg.Client(conString);
	client.connect();

	var query = client.query({
		text : "SELECT accusername, accphoto, accfname, acclname, itemquantity, item.price FROM account NATURAL JOIN keeps NATURAL JOIN invoice NATURAL JOIN of NATURAL JOIN item WHERE itemid = $1",
		values : [req.params.id]
	});
	query.on("row", function(row, result) {
		result.addRow(row);
	});

	query.on("end", function(result) {
		var response = {
			"buyers" : result.rows
		};
		client.end();
		res.json(response);
	});

});

//REST for user profile
app.put('/SpruceServer/userProfile', function(req, res) {
	console.log("GET " + req.url);

	var client = new pg.Client(conString);
	client.connect();

	var password = req.body.password;

	var query = client.query({
		text : "SELECT * FROM account natural join ships_to natural join saddress WHERE accpassword = $1",
		values : [password]
	});
	query.on("row", function(row, result) {
		result.addRow(row);
	});

	query.on("end", function(result) {
		var response = {
			"user" : result.rows
		};
		client.end();
		res.json(response);
	});
});

//Add rating
app.put('/SpruceServer/rateUser/:accid/:rating', function(req, res) {
	console.log("GET " + req.url);
	var client = new pg.Client(conString);
	console.log("Rating user with accountid=" + req.params.accid + " and comment= " + req.body.comment);
	client.connect();
	// Query a tuple to see if the customer has rated the seller
	var query = client.query({
		text : "with rater(accid) as(select accid from account where accpassword=$1) select rating.* from rater,rating where seller=$2 and customer=rater.accid",
		values : [req.body.password, req.params.accid]
	});
	query.on("row", function(row, result) {
		result.addRow(row);
	});
	query.on("end", function(result) {
		// If no rating are found insert it
		if (result.rows.length == 0) {
			client.query("BEGIN");
			client.query("insert into rating select $1,accid,$2,$3 from account where accpassword=$4", [req.params.accid, req.params.rating, req.body.comment, req.body.password]);
			client.query("update account set accrating = (select sum(rating) from rating where seller=$1)/(select count(*) from rating where seller=$1) where accid =$1", [req.params.accid], function(err, result) {
				if (err) {
					var response = {
						"success" : false
					};
					client.end();
					res.json(response);
				} else {
					client.query('COMMIT');
					var response = {
						"success" : true
					};
					client.end();
					res.json(response);
				}
			});
		}
		// Else update current rating
		else {
			client.query("BEGIN");
			client.query("update rating set rating=$1,comment=$2 where customer=$3 and seller=$4", [req.params.rating, req.body.comment, result.rows[0]['customer'], req.params.accid]);
			client.query("update account set accrating = (select sum(rating) from rating where seller=$1)/(select count(*) from rating where seller=$1) where accid =$1", [req.params.accid], function(err, result) {
				if (err) {
					var response = {
						"success" : false
					};
					client.end();
					res.json(response);
				} else {
					client.query('COMMIT');
					var response = {
						"success" : true
					};
					client.end();
					res.json(response);
				}
			});
		}
	});
});

//Get list of ratings
app.get('/SpruceServer/getRating/:accid', function(req, res) {
	console.log("GET " + req.url);
	var client = new pg.Client(conString);
	client.connect();
	var query = client.query({
		text : "with users(accid,accusername,accphoto,accfname,acclname) as(select accid,accusername,accphoto,accfname,acclname from account)SELECT rating.*,users.accusername,users.accphoto,users.accfname,users.acclname FROM account, rating,users WHERE  seller = account.accid AND account.accid = $1 AND users.accid = customer",
		values : [req.params.accid]
	});
	query.on("row", function(row, result) {
		result.addRow(row);
		console.log(row);
	});

	query.on("end", function(result) {
		var response = {
			"ratings" : result.rows
		};
		client.end();
		res.json(response);
		console.log(response);
	});

});

//Get list of messages in a conversation
app.put('/SpruceServer/chatUser/:accid', function(req, res) {
	console.log("GET " + req.url);
	var client = new pg.Client(conString);
	client.connect();
	var query = client.query({
		text : "select accid from account where accpassword=$1",
		values : [req.body.password]
	});
	query.on("row", function(row, result) {
		result.addRow(row);
	});
	query.on("end", function(result) {
		var query1 = client.query({
			text : "select * from message where (fromid=$1 and toid=$2) or (fromid=$2 and toid=$1) order by mdate asc",
			values : [result.rows[0]['accid'], req.params.accid]
		});
		query1.on("row", function(row, result1) {
			result1.addRow(row);
		});
		query1.on("end", function(result1) {
			var query2 = client.query({
				text : "select accid,accpassword,accusername,accphoto from account where accid=$1",
				values : [req.params.accid]
			});
			query2.on("row", function(row, result2) {
				result2.addRow(row);
			});
			query2.on("end", function(result2) {
				var query3 = client.query({
					text : "select accid,accpassword,accusername,accphoto from account where accid=$1",
					values : [result.rows[0]['accid']]
				});
				query3.on("row", function(row, result3) {
					result3.addRow(row);
				});
				query3.on("end", function(result3) {
					var response = {
						"messages" : result1.rows,
						"id1" : result2.rows,
						"id2" : result3.rows
					};
					client.end();
					res.json(response);
					console.log(response);
				});
			});
		});
	});
});

//PUT for reply to a user
app.put('/SpruceServer/replyUser/:accid', function(req, res) {
	console.log("GET " + req.url);
	var client = new pg.Client(conString);
	client.connect();
	var query = client.query({
		text : "select accid from account where accpassword=$1",
		values : [req.body.password]
	});
	query.on("row", function(row, result) {
		result.addRow(row);
	});
	query.on("end", function(result) {
		client.query("insert into message values(DEFAULT,$1,$2,localtimestamp,$3)", [result.rows[0]['accid'], req.params.accid, req.body.reply], function(err, result) {
			if (err) {
				var response = {
					"success" : false
				};
				client.end();
				res.json(response);
			} else {
				client.query('COMMIT');
				var response = {
					"success" : true
				};
				client.end();
				res.json(response);
			}
		});
	});
});

//PUT for getting all conversation of a user
app.put('/SpruceServer/conversationUser', function(req, res) {
	console.log("GET " + req.url);
	var client = new pg.Client(conString);
	client.connect();
	var query = client.query({
		text : "select accid from account where accpassword=$1",
		values : [req.body.password]
	});
	query.on("row", function(row, result) {
		result.addRow(row);
	});
	query.on("end", function(result) {
		var query1 = client.query({
			text : "select distinct accid,accusername, accphoto from account, message where (fromid=$1 or toid=$1) and accid!=$1 and (accid=fromid or accid=toid)",
			values : [result.rows[0]['accid']]
		});
		query1.on("row", function(row, result) {
			result.addRow(row);
		});
		query1.on("end", function(result) {
			var response = {
				"conversations" : result.rows
			};
			client.end();
			res.json(response);
		});
	});
});

//REST for purchase history
app.put('/SpruceServer/purchaseHistory', function(req, res) {
	console.log("GET " + req.url);

	var client = new pg.Client(conString);
	client.connect();

	var acc = req.body.acc;

	var query = client.query({
		text : "SELECT invoice.* FROM account NATURAL JOIN keeps NATURAL JOIN invoice WHERE account.accpassword = $1 ORDER BY invoicedate DESC",
		values : [acc]
	});
	query.on("row", function(row, result) {
		result.addRow(row);
	});
	query.on("end", function(result) {
		var response = {
			"invoices" : result.rows
		};
		client.end();
		res.json(response);
	});

});

//Account info
app.put('/SpruceServer/usergeneralinfo', function(req, res) {
	console.log("GET " + req.url);

	var client = new pg.Client(conString);
	client.connect();

	var password = req.body.password;

	var query = client.query({
		text : "SELECT accfname,acclname,accemail,accphonenum FROM account WHERE accpassword = $1",
		values : [password]
	});
	query.on("row", function(row, result) {
		result.addRow(row);
	});

	query.on("end", function(result) {
		var response = {
			"user" : result.rows
		};
		console.log(response);
		client.end();
		res.json(response);
	});
});

//Use for getting name for general info
app.put('/SpruceServer/usercreditcardinfo', function(req, res) {
	console.log("GET " + req.url);

	var client = new pg.Client(conString);
	client.connect();

	var password = req.body.password;

	var query = client.query({
		text : "SELECT credit_card.*,street,bid FROM account NATURAL JOIN billed natural join credit_card natural join bills_to natural join baddress  WHERE accpassword =$1 AND deleted_card=false",
		values : [password]
	});
	query.on("row", function(row, result) {
		result.addRow(row);
	});
	query.on("end", function(result) {
		var response = {
			"creditcard" : result.rows
		};
		console.log(response);
		client.end();
		res.json(response);
	});
});

//Use for getting all shipping address
app.put('/SpruceServer/usershippinginfo', function(req, res) {
	console.log("GET " + req.url);

	var client = new pg.Client(conString);
	client.connect();

	var password = req.body.password;

	var query = client.query({
		text : "SELECT saddress.* FROM account NATURAL JOIN ships_to NATURAL JOIN saddress WHERE accpassword =$1 AND activesaddress = true",
		values : [password]
	});
	query.on("row", function(row, result) {
		result.addRow(row);
	});
	query.on("end", function(result) {
		var response = {
			"address" : result.rows
		};
		console.log(response);
		client.end();
		res.json(response);
	});
});

//Use for getting a shipping address
app.put('/SpruceServer/usereditshipping/:id', function(req, res) {
	console.log("GET " + req.url);
	var id = req.params.id;
	var client = new pg.Client(conString);
	client.connect();

	var password = req.body.password;

	var query = client.query({
		text : "SELECT saddress.* FROM account NATURAL JOIN ships_to NATURAL JOIN saddress WHERE accpassword =$1 AND sid = $2",
		values : [password, id]
	});
	query.on("row", function(row, result) {
		result.addRow(row);
	});
	query.on("end", function(result) {
		var response = {
			"address" : result.rows
		};
		console.log(response);
		client.end();
		res.json(response);
	});
});

//Use for getting a billing address
app.put('/SpruceServer/usereditcreditcard/:id', function(req, res) {
	console.log("GET " + req.url);
	var id = req.params.id.split("-");
	var client = new pg.Client(conString);
	client.connect();

	var password = req.body.password;

	var query = client.query({
		text : "SELECT baddress.* FROM account NATURAL JOIN billed natural join credit_card natural join bills_to natural join baddress WHERE accpassword =$1 AND cid = $2 AND bid = $3",
		values : [password, id[0], id[1]]
	});
	query.on("row", function(row, result) {
		result.addRow(row);
	});
	query.on("end", function(result) {
		var response = {
			"address" : result.rows
		};
		console.log(response);
		client.end();
		res.json(response);
	});
});

app.get('/SpruceServer/admincreditcardinfo/:username', function(req, res) {
	console.log("GET " + req.url);

	var client = new pg.Client(conString);
	client.connect();

	var password = req.body.password;

	var query = client.query({
		text : "SELECT credit_card.*,street,bid FROM account NATURAL JOIN billed natural join credit_card natural join bills_to natural join baddress  WHERE accusername =$1 AND deleted_card=false",
		values : [req.params.username]
	});
	query.on("row", function(row, result) {
		result.addRow(row);
	});
	query.on("end", function(result) {
		var response = {
			"creditcard" : result.rows
		};
		console.log(response);
		client.end();
		res.json(response);
	});
});

app.get('/SpruceServer/myadmintools/users', function(req, res) {
	console.log("GET " + req.url);
	var client = new pg.Client(conString);
	client.connect();

	var query = client.query({
		text : "SELECT accusername FROM account WHERE activeaccount = true",
	});
	query.on("row", function(row, result) {
		result.addRow(row);
	});
	query.on("end", function(result) {
		var response = {
			"users" : result.rows
		};
		client.end();
		res.json(response);
	});
});

app.get('/SpruceServer/myadmintools/category/:cat/:sub', function(req, res) {
	console.log("GET " + req.url);
	var client = new pg.Client(conString);
	client.connect();
	client.query("BEGIN");
	client.query("INSERT INTO category VALUES(DEFAULT,$1)", [req.params.cat]);
	client.query("INSERT INTO category VALUES(DEFAULT,$1)", [req.params.sub]);
	client.query("INSERT INTO subcat VALUES(((SELECT max(catid) FROM category)-1),(SELECT max(catid) FROM category))", function(err, result) {
		if (err) {
			var response = {
				"success" : false
			};
			client.end();
			res.json(response);
		} else {
			client.query("COMMIT");
			var response = {
				"success" : true
			};
			client.end();
			res.json(response);
		}
	});
});

app.get('/SpruceServer/myadmintools/subcategory/:cat/:sub', function(req, res) {
	console.log("GET " + req.url);
	var client = new pg.Client(conString);
	client.connect();
	client.query("BEGIN");
	client.query("INSERT INTO category VALUES(DEFAULT,$1)", [req.params.sub]);
	client.query("INSERT INTO subcat VALUES($1,(SELECT max(catid) FROM category))", [req.params.cat], function(err, result) {
		if (err) {
			var response = {
				"success" : false
			};
			client.end();
			res.json(response);
		} else {
			client.query("COMMIT");
			var response = {
				"success" : true
			};
			client.end();
			res.json(response);
		}
	});
});

app.get('/SpruceServer/myadmintools/removecategory/:cat', function(req, res) {
	console.log("GET " + req.url);
	var client = new pg.Client(conString);
	client.connect();
	client.query("BEGIN");
	// Borra la categoria de la tabla category y su relation con sus subcategoria mas cercanas
	client.query("DELETE FROM category WHERE catid=$1", [req.params.cat]);
	// Borra las categorias que se quedaron sin relacion
	client.query("DELETE FROM category WHERE catid NOT IN (SELECT catid FROM subcat) AND catid NOT IN (SELECT subcatid FROM subcat)", function(err, result) {
		if (err) {
			var response = {
				"success" : false
			};
			client.end();
			res.json(response);
		} else {
			client.query("COMMIT");
			var response = {
				"success" : true
			};
			client.end();
			res.json(response);
		}
	});
});

app.get('/SpruceServer/admineditshipping/:user/:id', function(req, res) {
	console.log("GET " + req.url);
	var client = new pg.Client(conString);
	client.connect();

	var query = client.query({
		text : "SELECT saddress.* FROM account natural join ships_to natural join saddress where accusername = $1 and sid = $2",
		values : [req.params.user, req.params.id]

	});
	query.on("row", function(row, result) {
		result.addRow(row);
	});
	query.on("end", function(result) {
		var response = {
			"address" : result.rows
		};
		client.end();
		res.json(response);
	});
});

app.get('/SpruceServer/admineditcreditcard/:user/:id', function(req, res) {
	console.log("GET " + req.url);
	var client = new pg.Client(conString);
	client.connect();
	var id = req.params.id.split("-");
	var query = client.query({
		text : "SELECT baddress.* FROM account NATURAL JOIN billed natural join credit_card natural join bills_to natural join baddress WHERE accusername =$1 AND cid = $2 AND bid=$3",
		values : [req.params.user, id[0], id[1]]
	});
	query.on("row", function(row, result) {
		result.addRow(row);
	});
	query.on("end", function(result) {
		var response = {
			"address" : result.rows
		};
		client.end();
		res.json(response);
	});
});

app.get('/SpruceServer/adminaccountedit/:username', function(req, res) {
	console.log("GET " + req.url);

	var client = new pg.Client(conString);
	client.connect();

	var query = client.query({
		text : "SELECT account.* FROM account where accusername = $1",
		values : [req.params.username]
	});
	query.on("row", function(row, result) {
		result.addRow(row);
	});
	query.on("end", function(result) {
		var response = {
			"userinfo" : result.rows
		};
		client.end();
		res.json(response);
	});

});

app.get('/SpruceServer/adminshippinginfo/:username', function(req, res) {
	console.log("GET " + req.url);

	var client = new pg.Client(conString);
	client.connect();

	var password = req.body.password;

	var query = client.query({
		text : "SELECT saddress.* FROM account NATURAL JOIN ships_to NATURAL JOIN saddress WHERE accusername =$1",
		values : [req.params.username]
	});
	query.on("row", function(row, result) {
		result.addRow(row);
	});
	query.on("end", function(result) {
		var response = {
			"address" : result.rows
		};
		console.log(response);
		client.end();
		res.json(response);
	});
});

//REST for Total Sells
app.get('/SpruceServer/totalSellsReport', function(req, res) {
	console.log("GET " + req.url);

	var client = new pg.Client(conString);
	client.connect();

	var query = client.query({
		text : "SELECT count(itemid) as sells FROM item NATURAL JOIN of NATURAL JOIN invoice"
	});
	query.on("row", function(row, result) {
		result.addRow(row);
	});

	query.on("end", function(result) {
		var response = {
			"sells" : result.rows
		};
		client.end();
		res.json(response);
	});

});

//REST for Total Sells for given category and time
app.get('/SpruceServer/totalSellsReport/:category/:time', function(req, res) {
	console.log("GET " + req.url);

	var client = new pg.Client(conString);
	client.connect();

	console.log("Category: " + req.params.category);
	console.log("Time: " + req.params.time);

	var query = client.query({
		text : "SELECT count(itemid) as sells FROM item NATURAL JOIN of NATURAL JOIN invoice NATURAL JOIN describe NATURAL JOIN category WHERE invoicedate > $2 AND catid IN (SELECT subcatid FROM subcat NATURAL JOIN category WHERE catname = $1)",
		values : [req.params.category, req.params.time]
	});
	query.on("row", function(row, result) {
		result.addRow(row);
	});

	query.on("end", function(result) {
		var response = {
			"sells" : result.rows
		};
		client.end();
		res.json(response);
	});

});

//REST for Total Revenue for given category and time
app.get('/SpruceServer/totalRevenueReport/:category/:time', function(req, res) {
	console.log("GET " + req.url);

	var client = new pg.Client(conString);
	client.connect();

	console.log("Category: " + req.params.category);
	console.log("Time: " + req.params.time);

	var query = client.query({
		text : "SELECT sum(item.price) as sells FROM item NATURAL JOIN of NATURAL JOIN invoice NATURAL JOIN describe NATURAL JOIN category WHERE invoicedate > $2 AND catid IN (SELECT subcatid FROM subcat NATURAL JOIN category WHERE catname = $1)",
		values : [req.params.category, req.params.time]
	});
	query.on("row", function(row, result) {
		result.addRow(row);
	});

	query.on("end", function(result) {
		var response = {
			"sells" : result.rows
		};
		client.end();
		res.json(response);
	});

});

app.get('/', function(req, res) {
	// console.log("GET " + req.url);
	// console.log("Cart for account: "+req.body.acc);

	var client = new pg.Client(conString);
	client.connect();

	var query = client.query({
		text : "SELECT * FROM account"
	});
	query.on("row", function(row, result) {
		result.addRow(row);
	});
	query.on("end", function(result) {
		var response = {
			"accounts" : result.rows
		};
		client.end();
		res.json(response);
	});
});

var port = process.env.PORT || 5000;
app.listen(port, function() {
	console.log("Listening on " + port);
});
