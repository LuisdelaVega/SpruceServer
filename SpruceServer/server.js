// Express is the web framework 
var express = require('express');
var store = new express.session.MemoryStore;

var app = express();
app.configure(function() {
	app.use(express.bodyParser());
	app.use(express.errorHandler());
	app.use(express.cookieParser());
  	app.use(express.session({
    	secret: 'yoursecret',
    	cookie: {
      		path: '/',
      		domain: '127.0.0.1:8020',
      		maxAge: 1000 * 60 * 24 // 24 hours
    	}
}));
	app.use(function(req, res, next) {
		res.header('Access-Control-Allow-Credentials', true);
		res.header('Access-Control-Allow-Origin',      '*');
		res.header('Access-Control-Allow-Methods',     'GET,PUT,POST,DELETE');
		res.header('Access-Control-Allow-Headers',     'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
		next();
	});
});


var fs = require('fs');
var item = require("./objects/item.js");
var pg = require('pg');

var conString = "pg://postgres:post123@localhost:5432/SpruceDB";

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

// REST Operations
// Idea: Data is created, read, updated, or deleted through a URL that 
// identifies the resource to be created, read, updated, or deleted.
// The URL and any other input data is sent over standard HTTP requests.
// Mapping of HTTP with REST 
// a) POST - Created a new object. (Database create operation)
// b) GET - Read an individual object, collection of object, or simple values (Database read Operation)
// c) PUT - Update an individual object, or collection  (Database update operation)
// d) DELETE - Remove an individual object, or collection (Database delete operation)


app.put('/SpruceServer/authenticate1', function(req, res) {
	console.log("PUT " + req.url);
	
	var client = new pg.Client(conString);
	client.connect();
	
	var username = req.body.username;
	console.log(username);
	
	var query = client.query({
		text: "SELECT accslt FROM account WHERE accusername = $1",
		values: [username]
	});
	query.on("row", function (row, result) {
		console.log(row.accusername);
    	result.addRow(row);
	});
	query.on("end", function (result) {
		if(result.rows.length > 0){	
			console.log(result.rows);
			// req.session.accid = result.rows[0].accid;
			// console.log("Session for: "+req.session.accid);
			var response = {"acc" : result.rows};
			client.end();
  			res.json(response);
  		}
  		else{
  			client.end();
  		}
 	});
});

app.put('/SpruceServer/authenticate2', function(req, res) {
	console.log("PUT " + req.url);
	
	var client = new pg.Client(conString);
	client.connect();
	
	var username = req.body.username;
	console.log(username);
	var password = req.body.hash;
	console.log(password);
	
	var query = client.query({
		text: "SELECT accpassword FROM account WHERE accusername = $1 AND accpassword = $2",
		values: [username, password]
	});
	query.on("row", function (row, result) {
		console.log(row.accusername);
    	result.addRow(row);
	});
	query.on("end", function (result) {
		if(result.rows.length > 0){	
			console.log(result.rows);
			// req.session.accid = result.rows[0].accid;
			// console.log("Session for: "+req.session.accid);
			var response = {"acc" : result.rows};
			client.end();
  			res.json(response);
  		}
  		else{
  			client.end();
  		}
 	});
});

app.put('/SpruceServer/signup', function(req, res){
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
	
	var query = client.query({
		text: "INSERT INTO account VALUES(DEFAULT, $1, $2, $3, $4, $5, $6, $7, $8, $9)",
		values: [fname, lname, username, password, rating, photo, phone, email, slt]
	});
	query.on("end", function (result) {
		if(result.rows.length > 0){	
			// var response = ;
			client.end();
  			res.json(true);
  		}
  		else{
  			client.end();
  		}
 	});
	
});

// REST Operation - Info Categories
app.get('/SpruceServer/getItemsForCategory/:category/:orderby/:offset', function(req, res) {
	console.log("GET " + req.url);
	console.log("Account: "+req.session.accid);
	
	var client = new pg.Client(conString);
	client.connect();
	
	var categoryId = req.params.category;
	var offset = req.params.offset;
	var orderby = req.params.orderby.split("-");
	var query;
	if (orderby[0] == "none") {
		query = client.query({
		text : "SELECT item.* FROM category NATURAL JOIN describe NATURAL JOIN item WHERE amount > 0 AND catid IN (SELECT subcatid FROM subcat WHERE catid = $1 offset $2)",
		values : [categoryId,offset]
		});
	} 
	else {
		query = client.query({
		text : "SELECT item.* FROM category NATURAL JOIN describe NATURAL JOIN item WHERE amount > 0 AND catid IN (SELECT subcatid FROM subcat WHERE catid = $1) ORDER BY "+orderby[0]+" "+orderby[1]+" OFFSET $2",
		values : [categoryId,offset]
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
		} 
		else {
			var query1;
			if (orderby[0] == "none") {
				query1 = client.query({
					text : "SELECT item.* FROM category NATURAL JOIN describe NATURAL JOIN item WHERE amount > 0 AND catid = $1 OFFSET $2",
					values : [categoryId,offset]
				});
			} 
			else {
				query1 = client.query({
					text : "SELECT item.* FROM category NATURAL JOIN describe NATURAL JOIN item WHERE amount > 0 AND catid = $1 ORDER BY "+orderby[0]+" "+orderby[1]+" OFFSET $2",
					values : [categoryId,offset]
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

app.get('/SpruceServer/getSubCategoryListPopup/:category', function(req, res) {
	console.log("GET " + req.url);
	
	var client = new pg.Client(conString);
	client.connect();
	
	var categoryId = req.params.category;;
	
	var query0 = client.query({
		text: "SELECT C.catid,C.catname FROM category AS C, subcat AS S WHERE S.subcatid=C.catid AND subcatid NOT IN (SELECT subcatid FROM subcat WHERE subcat.catid <> $1)",
		values: [categoryId],
	});
	query0.on("row", function (row, result) {
		result.addRow(row);
	});
	query0.on("end", function(result){
		var response = {"categories" : result.rows};
		client.end();
  		res.json(response);
	});
});

app.get('/SpruceServer/getCategoriesForSidePanel', function(req, res) {
	console.log("GET " + req.url);
	
	var client = new pg.Client(conString);
	client.connect();
	
	var categoryId = -1;
	
	var query0 = client.query({
		text: "SELECT category.catid, category.catname FROM subcat, category WHERE category.catid = subcat.catid AND category.catid not in (SELECT subcatid FROM subcat) GROUP BY category.catid ORDER BY category.catid"
	});
	query0.on("row", function (row, result) {
		result.addRow(row);
	});
	query0.on("end", function(result){
		var response = {"categories" : result.rows};
		client.end();
  		res.json(response);
	});
	
});

app.get('/SpruceServer/getSubCategories', function(req, res) {
	console.log("GET " + req.url);
	var response;
		
	var file = "subcategories.json";
		
	fs.readFile(file, 'utf8', function(err, data){
		if(err){
			console.log('Error: '+err);
		}
		else{
			data = JSON.parse(data);
			
			response = {"subcategories" : data};
			res.json(response);
		}
	});
});

//REST My Spruce
app.get('/SpruceServer/mySpruce/:select', function(req, res) {
	console.log("GET " + req.url);
	var response;
	var index = -1;
	if(req.params.select=='bidding'){
		index=0;		
	}
	else if(req.params.select=='selling'){
		index=1;			
	}
	else{
		index=2;
	}
	var file = "items.json";
		
	fs.readFile(file, 'utf8', function(err, data){
		if(err){
			console.log('Error: '+err);
		}
		else{
			data = JSON.parse(data);
			
			response = {"items" : data[index]};
			res.json(response);
		}
	});
});

//REST Get an item for the buyer
app.get('/SpruceServer/getProduct/:id', function(req, res) {

	console.log("GET " + req.url);

	var id = req.params.id;

	var client = new pg.Client(conString);
	client.connect();

	var query = client.query({
		text : "SELECT item.*,accusername,accrating,accpassword FROM item NATURAL JOIN sells NATURAL JOIN account WHERE itemid = $1",
		values : [id]
	});
	query.on("row", function(row, result) {
		result.addRow(row);
		console.log(id);
	});
	query.on("end", function(result) {
		console.log(result.rows);
		var query1 = client.query({
			text : "select bidevent.* from item natural join bidevent natural join participates where itemid=$1",
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
		text : "SELECT accusername,bidprice FROM item NATURAL JOIN participates NATURAL JOIN bidevent NATURAL JOIN onevent NATURAL JOIN bid NATURAL JOIN places NATURAL JOIN account WHERE itemid=$1 ORDER BY bidprice desc",
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

//REST for admin tools, user and category
app.get('/SpruceServer/myadmintools/:id', function(req, res) {
	console.log("GET " + req.url);
	var response;
	var id=req.params.id;
	var file = id+".json";
		
	fs.readFile(file, 'utf8', function(err, data){
		if(err){
			console.log('Error: '+err);
		}
		else{
			data = JSON.parse(data);
			if(id=='category'){
				response = {"category": data};	
			}
			else if(id=='users'){
				response = {"users": data};
			}
			res.json(response);
		}
	});
});

//REST for cart
app.put('/SpruceServer/mycart', function(req, res) {
	console.log("GET " + req.url);
	console.log("Cart for account: "+req.body.acc);
	
	var client = new pg.Client(conString);
	client.connect();

	var query = client.query({
		text : "SELECT item.*,quantity FROM cart NATURAL JOIN contains NATURAL JOIN item NATURAL JOIN belongs_to NATURAL JOIN account WHERE account.accpassword = $1",
		values : [req.body.acc]
	});
	query.on("row", function (row, result) {
   		result.addRow(row);
	});
	query.on("end", function (result){
		var response = {"cart" : result.rows};
		client.end();
 		res.json(response);
	});
		
});

//REST for user store
app.get('/SpruceServer/user/store', function(req, res) {
	console.log("GET " + req.url);
	var response;
	var file = "items.json";
		
	fs.readFile(file, 'utf8', function(err, data){
		if(err){
			console.log('Error: '+err);
		}
		else{
			data = JSON.parse(data);
			var result=[];
			for(var i=0;i<data[2].length;i++){
				result.push(data[2][i]);
			}
			response = {"items": result};	
			res.json(response);
		}
	});
});

//REST for user profile
app.put('/SpruceServer/userProfile', function(req, res) {
	console.log("GET " + req.url);
		
	var client = new pg.Client(conString);
	client.connect();
	
	var password = req.body.password; 

	var query = client.query({
		text : "SELECT * FROM account natural join shipsto natural join saddress WHERE accpassword = $1",
		values: [password]
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

//REST Popular Now View
app.get('/SpruceServer/Spruce/PopularNow/', function(req, res) {
	console.log("GET " +req.url);

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
	console.log("GET " +req.url);

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



// Server starts running when listen is called.
app.listen(process.env.PORT || 3412);
console.log("server listening");
