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
    }
    else {
      next();
    }
};

app.configure(function () {
  app.use(allowCrossDomain);
});


app.use(express.bodyParser());


var fs = require('fs');
var pg = require('pg');

var conString = "pg://postgres:post123@localhost:5432/SpruceDB";

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

// REST Operations
// Idea: Data is created, read, updated, or deleted through a URL that
// identifies the resource to be created, read, updated, or deleted.
// The URL and any other input data is sent over standard HTTP requests.
// Mapping of HTTP with REST
// a) POST - Created a new object. (Database create operation)
// b) GET - Read an individual object, collection of object, or simple values (Database read Operation)
// c) PUT - Update an individual object, or collection  (Database update operation)
// d) DELETE - Remove an individual object, or collection (Database delete operation)

app.get('/SpruceServer/myadmintools/users', function(req, res) {
	console.log("GET " + req.url);
	var client = new pg.Client(conString);
	client.connect();

	var query = client.query({
		text : "SELECT accusername FROM account",
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

app.get('/SpruceServer/sellerprofile/:username', function(req, res) {
	console.log("GET " + req.url);

	var client = new pg.Client(conString);
	client.connect();

	var query = client.query({
		text : "SELECT * FROM account natural join ships_to natural join saddress where accusername = $1",
		values : [req.params.username]
	});
	query.on("row", function(row, result) {
		result.addRow(row);
	});
	query.on("end", function(result) {
		var response = {
			"sellerprofile" : result.rows
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
		text : "select number FROM account NATURAL JOIN billed NATURAL JOIN  credit_card WHERE accpassword = $1",
		values : [password]
	});
	query.on("row", function(row, result) {
		result.addRow(row);
	});

	query.on("end", function(result) {
		var address=[];
		var query1 = client.query({
			text : "select street,city FROM account NATURAL JOIN ships_to NATURAL JOIN  saddress WHERE accpassword = $1",
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

app.put('/SpruceServer/authenticate1', function(req, res) {
	console.log("PUT " + req.url);

	var client = new pg.Client(conString);
	client.connect();

	var username = req.body.username;
	console.log("Login: " + username);

	var query = client.query({
		text : "SELECT accslt FROM account WHERE accusername = $1",
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

	console.log(username);
	console.log(fname);
	console.log(lname);
	console.log(email);
	console.log(password);
	console.log(phone);
	console.log(photo);
	console.log(slt);
	console.log(rating);

	var query = client.query({ // Create the new account
		text : "INSERT INTO account VALUES(DEFAULT, $1, $2, $3, $4, $5, $6, $7, $8, $9)",
		values : [fname, lname, username, password, rating, photo, phone, email, slt]
	});
	query.on("end", function(result) {
		var query1 = client.query({ // Create the new cart
			text : "INSERT INTO cart VALUES(DEFAULT)"
		});
		query1.on("end", function(result1) {
			var query2 = client.query({ // Get both new ids
				text : "SELECT max(accid) as acc, max(cartid) as caid FROM account, cart"
			});
			query2.on("row", function(row, result2) {
						result2.addRow(row);
			});
			query2.on("end", function(result2) {
				var query3 = client.query({ // Set the relationship between the account and its cart
					text : "insert into belongs_to values($1,$2)",
					values : [result2.rows[0].acc, result2.rows[0].caid]
				});
				query3.on("end", function(result3) {
					client.end();
				});
			});
		});
	});
	var response = {
		"success" : true
	};
	res.json(response);
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
			text : "SELECT item.* FROM category NATURAL JOIN describe NATURAL JOIN item WHERE (amount > 0 OR restock = true) AND catid IN (SELECT subcatid FROM subcat WHERE catid = $1 offset $2)",
			values : [categoryId, offset]
		});
	} else {
		query = client.query({
			text : "SELECT item.* FROM category NATURAL JOIN describe NATURAL JOIN item WHERE (amount > 0 OR restock = true) AND catid IN (SELECT subcatid FROM subcat WHERE catid = $1) ORDER BY " + orderby[0] + " " + orderby[1] + " OFFSET $2",
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
	}
	else{
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

app.get('/SpruceServer/getSubCategories', function(req, res) {
	console.log("GET " + req.url);
	var client = new pg.Client(conString);
	client.connect();
	var count=0;
	var count2=0;
	var query0 = client.query({
		text : "SELECT category.catid, category.catname FROM subcat, category WHERE category.catid = subcat.catid AND category.catid not in (SELECT subcatid FROM subcat) GROUP BY category.catid ORDER BY category.catid"
	});
	query0.on("row", function(row, result) {
		row['subcat']=new Array();
		result.addRow(row);
	});
	query0.on("end", function(result) {
		var response = {
			"categories" : result.rows
		}
		for (var i = 0; i < response.categories.length; i++) {
			var query1 = client.query({
				text : "SELECT C.catid,C.catname FROM category AS C, subcat AS S WHERE S.subcatid=C.catid AND subcatid NOT IN (SELECT subcatid FROM subcat WHERE subcat.catid <> $1)",
				values : [response.categories[i].catid],
			});
			query1.on("row", function(row, result) {
				response.categories[count].subcat.push(row);
			});
			query1.on("end", function(row, result) {
				count++
				if(count == response.categories.length){
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
			text : "SELECT item.*, max(biddate) as date, max(bidprice) FROM account NATURAL JOIN places NATURAL JOIN bid NATURAL JOIN on_event NATURAL JOIN bid_event NATURAL JOIN participates NATURAL JOIN item WHERE account.accpassword = $1 AND bideventenddate > current_timestamp GROUP BY item.itemid ORDER BY date",
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
			text : "SELECT item.* FROM account NATURAL JOIN sells NATURAL JOIN item WHERE account.accpassword = $1 AND (item.amount > 0 OR item.restock = true)",
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
			text : "SELECT item.*, invoice.invoicedate as solddate FROM account NATURAL JOIN keeps NATURAL JOIN invoice NATURAL JOIN of NATURAL JOIN item WHERE accpassword <> $1 AND item.itemid IN (SELECT itemid FROM account NATURAL JOIN sells WHERE accpassword = $1) GROUP BY item.itemid, invoice.invoicedate ORDER BY solddate DESC",
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

//REST Get an item for the buyer
app.get('/SpruceServer/getProduct/:id', function(req, res) {

	// console.log("GET " + req.url);

	var id = req.params.id;

	var client = new pg.Client(conString);
	client.connect();

	var query = client.query({
		text : "SELECT item.*,accusername,accrating,accpassword FROM item NATURAL JOIN sells NATURAL JOIN account WHERE itemid = $1",
		values : [id]
	});
	query.on("row", function(row, result) {
		result.addRow(row);
		// console.log(id);
	});
	query.on("end", function(result) {
		var query1 = client.query({
			text : "select bid_event.* from item natural join bid_event natural join participates where itemid=$1",
			values : [result.rows[0].itemid]
		});
		query1.on("row", function(row2, result2) {
			result.rows[0]['currentbidprice'] = row2.currentbidprice;
			result.rows[0]['bideventdate'] = row2.bideventdate;
		});
		query1.on("end", function(row, result2) {
			var response = {
				"product" : result.rows
			};
			client.end();
			res.json(response);
		});
	});

});

//REST Bids for item
app.get('/SpruceServer/seller-product-bids/:id', function(req, res) {
	console.log("GET " + req.url);
	var client = new pg.Client(conString);
	client.connect();
	var query0 = client.query({
		text : "SELECT accusername,bidprice FROM item NATURAL JOIN participates NATURAL JOIN bid_event NATURAL JOIN on_event NATURAL JOIN bid NATURAL JOIN places NATURAL JOIN account WHERE itemid=$1 ORDER BY bidprice desc",
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

//REST for cart
app.put('/SpruceServer/mycart', function(req, res) {
	console.log("GET " + req.url);
	console.log("Cart for account: " + req.body.acc);

	var client = new pg.Client(conString);
	client.connect();

	var query = client.query({
		text : "SELECT item.*,quantity FROM cart NATURAL JOIN contains NATURAL JOIN item NATURAL JOIN belongs_to NATURAL JOIN account WHERE account.accpassword = $1",
		values : [req.body.acc]
	});
	query.on("row", function(row, result) {
		result.addRow(row);
	});
	query.on("end", function(result) {
		var response = {
			"cart" : result.rows
		};
		client.end();
		res.json(response);
	});

});

//REST for user store
app.put('/SpruceServer/getUserStore', function(req, res) {
	console.log("GET " + req.url);
	
	var client = new pg.Client(conString);
	client.connect();
	console.log(req.body.accusername);

	var query = client.query({
		text : "SELECT item.* FROM account NATURAL JOIN sells NATURAL JOIN item WHERE account.accusername = $1 AND (item.amount > 0 OR item.restock = true)",
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

//REST for user profile
app.put('/SpruceServer/userRating', function(req, res) {
	console.log("GET " + req.url);

	var client = new pg.Client(conString);
	client.connect();

	var password = req.body.password;

	var query = client.query({
		text : "SELECT accrating FROM account WHERE accpassword = $1",
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

//REST Popular Now View
app.get('/SpruceServer/Spruce/PopularNow/', function(req, res) {
	console.log("GET " + req.url);

	var client = new pg.Client(conString);
	client.connect();

	var query = client.query({
		text : "SELECT * FROM item WHERE amount > 0 ORDER BY views DESC"
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

//REST Home View
app.get('/SpruceServer/home/', function(req, res) {
	console.log("GET " + req.url);

	var client = new pg.Client(conString);
	client.connect();

	var query = client.query({
		text : "SELECT * FROM item ORDER BY views DESC LIMIT 5"
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
		text : "SELECT credit_card.*,street,bid FROM account NATURAL JOIN billed natural join credit_card natural join bills_to natural join baddress  WHERE accpassword =$1",
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

app.get('/SpruceServer/admincreditcardinfo/:username', function(req, res) {
	console.log("GET " + req.url);

	var client = new pg.Client(conString);
	client.connect();

	var password = req.body.password;

	var query = client.query({
		text : "SELECT credit_card.*,street,bid FROM account NATURAL JOIN billed natural join credit_card natural join bills_to natural join baddress  WHERE accusername =$1",
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

//Use for getting all shipping address
app.put('/SpruceServer/usershippinginfo', function(req, res) {
	console.log("GET " + req.url);

	var client = new pg.Client(conString);
	client.connect();

	var password = req.body.password;

	var query = client.query({
		text : "SELECT saddress.* FROM account NATURAL JOIN ships_to NATURAL JOIN saddress WHERE accpassword =$1",
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

app.put('/SpruceServer/generateInvoice', function(req, res) {
	console.log("GET " + req.url);
	var client = new pg.Client(conString);
	client.connect();

	var acc = req.body.acc;
	var total = req.body.total;

	var query0 = client.query({ // Get the accid
		text : "SELECT accid FROM account WHERE accpassword = $1",
		values : [acc]
	});
	query0.on("row", function(row, result0) {
		result0.addRow(row);
	});
	query0.on("end", function(result0) {
		var query = client.query({ // Get the items in the cart
			text : "SELECT item.*,quantity FROM cart NATURAL JOIN contains NATURAL JOIN item NATURAL JOIN belongs_to NATURAL JOIN account WHERE account.accpassword = $1",
			values : [acc]
		});
		query.on("row", function(row, result) {
			result.addRow(row);
		});
		query.on("end", function(result) {
			var query1 = client.query({ // Create the invoice
				text : "INSERT INTO invoice VALUES(DEFAULT, current_timestamp, $1)",
				values : [total]
			});
			query1.on("row", function(row, result1) {
				result1.addRow(row);
			});
			query1.on("end", function(result1) {
				var query4 = client.query({ // Create the relationshipp between the invoice and the account
					text : "SELECT max(invoiceid) as invid FROM invoice",
				});
				query4.on("row", function(row, result4) {
					result4.addRow(row);
				});
				query4.on("end", function(result4) {
					var query2 = client.query({ // Create the relationshipp between the invoice and the account
						text : "INSERT INTO keeps VALUES($1, $2)",
						values : [result4.rows[0].invid,result0.rows[0].accid]
					});
					query2.on("row", function(row, result2) {
						result2.addRow(row);
					});
					query2.on("end", function(result2) {
						for (var i = 0; i < result.rows.length; i++) {
							var query3 = client.query({ // Create the relationship between invoice and the items bought
								text : "INSERT INTO of VALUES($1, $2, $3)",
								values : [result4.rows[0].invid, result.rows[i].itemid, result.rows[i].quantity]
							});
							query3.on("row", function(row, result3) {
								result3.addRow(row);
							});
							query3.on("end", function(result3) {
								if(i+1 == result.rows.length){
									client.end();
								}
							});
						}
					});
				});

			});

		});
	});
	var response = {
		"success" : true
	};
	res.json(response);
});

//REST for purchase sumary
app.put('/SpruceServer/purchaseSumary', function(req, res) {
	console.log("GET " + req.url);
	console.log("Cart for account: " + req.body.acc);

	var client = new pg.Client(conString);
	client.connect();

	var query = client.query({
		text : "SELECT item.*, itemquantity as quantity, max(invoiceid) FROM keeps NATURAL JOIN invoice NATURAL JOIN of NATURAL JOIN item NATURAL JOIN account WHERE account.accpassword = $1 group by item.itemid, quantity",
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
		text : "SELECT item.*, itemquantity as quantity, max(invoiceid) FROM keeps NATURAL JOIN invoice NATURAL JOIN of NATURAL JOIN item NATURAL JOIN account WHERE account.accpassword = $1 AND invoice.invoiceid = $2 group by item.itemid, quantity",
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

//Search
app.get('/SpruceServer/searchpage/:parameter', function(req, res) {
	console.log("GET " + req.url);
	var parameter = req.params.parameter;
	var client = new pg.Client(conString);
	client.connect();

	var query = client.query({
		text : "SELECT * FROM item WHERE itemname ILIKE '%" + parameter + "%'"
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

var port = process.env.PORT || 5000;
app.listen(port, function() {
	console.log("Listening on " + port);
});
