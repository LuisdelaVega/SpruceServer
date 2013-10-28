// Express is the web framework 
var express = require('express');
var fs = require('fs');
var item = require("./objects/item.js");
var pg = require('pg');

var conString = "pg://postgres:post123@localhost:5432/SpruceDB";

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

// REST Operations
// Idea: Data is created, read, updated, or deleted through a URL that 
// identifies the resource to be created, read, updated, or deleted.
// The URL and any other input data is sent over standard HTTP requests.
// Mapping of HTTP with REST 
// a) POST - Created a new object. (Database create operation)
// b) GET - Read an individual object, collection of object, or simple values (Database read Operation)
// c) PUT - Update an individual object, or collection  (Database update operation)
// d) DELETE - Remove an individual object, or collection (Database delete operation)

var itemList;

// REST Operation - Info Categories
app.get('/SpruceServer/getItemsForCategory/:category', function(req, res) {
	/*
	console.log("GET " + req.url);
		var response;
		var index = -1;
			
		switch(req.params.category){
			case "Books":
				index = 0;
				break;
			case "Electronics":
				index = 1;
				break;
			case "Computers":
				index = 2;
				break;
			case "Clothing":
				index = 3;
				break;
			case "Shoes":
				index = 4;
				break;
			case "Sports":
				index = 5;
				break;
			default:
				console.log("Error!");
				return;
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
		});*/
	
	var client = new pg.Client(conString);
	client.connect();

	var query = client.query("SELECT item.* FROM category NATURAL JOIN describe NATURAL JOIN item WHERE catid IN (SELECT subcatid FROM subcat WHERE catid = 1)");
		
	query.on("row", function (row, result) {
    	result.addRow(row);
	});
	query.on("end", function (result) {
		var response = {"items" : result.rows};
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
app.get('/SpruceServer/getProduct/:category/:id', function(req, res) {
	console.log("GET " + req.url);
	var response;
	var id=req.params.id;
	var category = req.params.category;
	var file = "items.json";
	
	switch(category){
		case "Books":
			category = 0;
			break;
		case "Electronics":
			category = 1;
			break;
		case "Computers":
			category = 2;
			break;
		case "Clothing":
			category = 3;
			break;
		case "Shoes":
			category = 4;
			break;
		case "Sports":
			category = 5;
			break;
		default:
			console.log("Error!");
			return;
	}
		
	fs.readFile(file, 'utf8', function(err, data){
		if(err){
			console.log('Error: '+err);
		}
		else{
			data = JSON.parse(data);
			if(category<data.length){
				if(id<data[category].length){
					response = {"product" : data[category][id]};
				}
				else{
					console.log("Error: product not found")
				}
			}
			else{
					console.log("Error: category not found")
			}
			res.json(response);
		}
	});
});

//REST get an item view for the seller
app.get('/SpruceServer/getSellerProduct/:category/:id', function(req, res) {
	console.log("GET " + req.url);
	var response;
	var id=req.params.id;
	var category = req.params.category;
	var file = "items.json";
		
	fs.readFile(file, 'utf8', function(err, data){
		if(err){
			console.log('Error: '+err);
		}
		else{
			data = JSON.parse(data);
			if(category<data.length){
				if(id<data[category].length){
					response = {"product" : data[category][id]};
				}
				else{
					console.log("Error: product not found")
				}
			}
			else{
					console.log("Error: category not found")
			}
			res.json(response);
		}
	});
});

//REST Bids for item
app.get('/SpruceTestServer/seller-product/:category/:id/bids', function(req, res) {
	console.log("GET " + req.url);
	var response;
	var id=req.params.id;
	var category = req.params.category;
	var file = "bids.json";
		
	fs.readFile(file, 'utf8', function(err, data){
		if(err){
			console.log('Error: '+err);
		}
		else{
			data = JSON.parse(data);
			response = {"bids" : data};
			res.json(response);
		}
	});
});

//REST for admin tools, user and category
app.get('/SpruceTestServer/myadmintools/:id', function(req, res) {
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
app.get('/SpruceTestServer/user/cart', function(req, res) {
	console.log("GET " + req.url);
	var response;
	var id=req.params.id;
	var file = "items.json";
		
	fs.readFile(file, 'utf8', function(err, data){
		if(err){
			console.log('Error: '+err);
		}
		else{
			data = JSON.parse(data);
			response = {"cart": data[2]};	
			res.json(response);
		}
	});
});

//REST for user store
app.get('/SpruceTestServer/user/store', function(req, res) {
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
app.get('/SpruceTestServer/user/profile', function(req, res) {
	console.log("GET " + req.url);
	var response;
	var file = "user.json";
		
	fs.readFile(file, 'utf8', function(err, data){
		if(err){
			console.log('Error: '+err);
		}
		else{
			data = JSON.parse(data);
			response = {"user": data[0]};	
			res.json(response);
		}
	});
});

//REST Home View
app.get('/SpruceTestServer/Spruce/home/', function(req, res) {
	console.log("GET " + req.url);
		
		var response;
		var file = "images.json";
		fs.readFile(file, 'utf8', function(err, data){
		if(err){
			console.log('Error: '+err);
		}
		else{
			
			data = JSON.parse(data);			
			response = {"images" : data};
			res.json(response);
		}
		});
});

// REST Operation - HTTP GET to read a car based on its id
app.get('/SpruceTestServer/:category/:id', function(req, res) {
	var category = req.params.category;
	var id = req.params.id;
	console.log("GET "+category+": "+ id);

	if ((id < 0) || (id >= itemList.length)){
		// not found
		res.statusCode = 404;
		res.send("Item not found.");
	}
	else {
		var target = -1;
		for (var i=0; i < itemList.length; ++i){
			if (itemList[i].id == id){
				target = i;
				break;	
			}
		}
		if (target == -1){
			res.statusCode = 404;
			res.send("Item not found.");
		}
		else {
			var response = {"item" : itemList[target]};
  			res.json(response);	
  		}	
	}
});

// REST Operation - HTTP PUT to updated a car based on its id

app.put('/SpruceTestServer/:category/:id', function(req, res) {
	var category = req.params.category;
	var id = req.params.id;
	console.log("PUT "+category+": "+ id);

	if ((id < 0) || (id >= itemList.length)){
		// not found
		res.statusCode = 404;
		res.send("Item not found.");
	}
	else if(!req.body.hasOwnProperty('make') || !req.body.hasOwnProperty('model')
  	|| !req.body.hasOwnProperty('year') || !req.body.hasOwnProperty('price') || !req.body.hasOwnProperty('description')) {
    	res.statusCode = 400;
    	return res.send('Error: Missing fields for car.');
  	}
	else {
		var target = -1;
		for (var i=0; i < itemList.length; ++i){
			if (itemList[i].id == id){
				target = i;
				break;	
			}
		}
		if (target == -1){
			res.statusCode = 404;
			res.send("Car not found.");			
		}	
		else {
			var theItem= itemList[target];
			theItem.make = req.body.make;
			theItem.model = req.body.model;
			theItem.year = req.body.year;
			theItem.price = req.body.price;
			theItem.description = req.body.description;
			var response = {"item" : theItem};
  			res.json(response);		
  		}
	}
});


// REST Operation - HTTP DELETE to delete a car based on its id
app.del('/SpruceTestServer/:category/:id', function(req, res) {
	var category = req.params.category;
	var id = req.params.id;
	console.log("DELETE "+category+": "+ id);

	if ((id < 0) || (id >= itemList.length)){
		// not found
		res.statusCode = 404;
		res.send("Car not found.");
	}
	else {
		var target = -1;
		for (var i=0; i < itemList.length; ++i){
			if (itemList[i].id == id){
				target = i;
				break;
			}
		}
		if (target == -1){
			res.statusCode = 404;
			res.send("Item not found.");
		}	
		else {
			itemList.splice(target, 1);
  			res.json(true);
  		}		
	}
});

// REST Operation - HTTP POST to add a new a car
app.post('/SpruceTestServer/:category', function(req, res) {
	var category = req.params.category;
	console.log("POST");

  	if(!req.body.hasOwnProperty('itemName') || !req.body.hasOwnProperty('price')
  	|| !req.body.hasOwnProperty('model') || !req.body.hasOwnProperty('brand')
  	|| !req.body.hasOwnProperty('category') || !req.body.hasOwnProperty('width')
  	|| !req.body.hasOwnProperty('height') || !req.body.hasOwnProperty('depth')
  	|| !req.body.hasOwnProperty('description') || !req.body.hasOwnProperty('uploadpicture')) {
    	res.statusCode = 400;
    	return res.send('Error: Missing fields for car.');
  	}
  	
  	var currentdate = new Date(); 
	var datetime = currentdate.getDate() + "/"
                + (currentdate.getMonth()+1)  + "/" 
                + currentdate.getFullYear() + " "  
                + currentdate.getHours() + ":"  
                + currentdate.getMinutes() + ":" 
                + currentdate.getSeconds();

  	var newItem = new Item(req.body.name,
  		req.body.category,
  		req.body.price,
  		req.body.description,
  		req.body.uploadpicture,
  		req.body.model,
  		req.body.brand,
  		req.body.height+"x"+req.body.width+"x"+req.body.depth,
  		datetime,
  		null,
  		null,
  		"-1",
  		0);
  	
  	console.log("New item: " + JSON.stringify(newItem));
  	newItem.id = itemList.length;
  	itemList.push(newItem);
  	res.json(true);
});


// Server starts running when listen is called.
app.listen(process.env.PORT || 3412);
console.log("server listening");
