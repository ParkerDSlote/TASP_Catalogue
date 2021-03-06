// server init + mods
var express = require('express');
var app = express();
var http = require('http');
var fs = require('fs');
var path = require('path');
var server = http.createServer(app);
var io = require('socket.io').listen(server);
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var crypto = require('crypto');
var randomstring = require("randomstring");
var multer = require('multer');
var multiparty = require('connect-multiparty');

//database modules
var Db = require('mongodb').Db,
    MongoClient = require('mongodb').MongoClient,
    Server = require('mongodb').Server,
    ReplSetServers = require('mongodb').ReplSetServers,
    ObjectID = require('mongodb').ObjectID,
    Binary = require('mongodb').Binary,
    GridStore = require('mongodb').GridStore,
    Grid = require('mongodb').Grid,
    Code = require('mongodb').Code,
    assert = require('assert'),
    mongodb = require('mongodb');
	
//mongodb bktlstr db url	
var url = 'mongodb://localhost:27017/TASP';	


//cookies and body parser implementation
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());




//app.use(express.static(__dirname + '/public'));
//allow usage of static files for external css and js
app.use(express.static(path.join(__dirname, 'public')));

var storage = multer.diskStorage({
  destination: 'public/itemimages/',
  filename: function (req, file, cb) {
    cb(null, file.originalname.replace(path.extname(file.originalname), "") + '-' + Date.now() + path.extname(file.originalname))
  }
})
 
var upload = multer({ storage: storage })
var filename = ''; 

 
app.post('/savedata', upload.single('file'), function(req,res,next){
    filename = req.file.filename;
    res.send(req.file.filename);
});

app.get('/fileuploadname', function(req,res) {
   res.send(filename); 
});

//get page for getting user logged in via cookies
app.get('/user', function(req,res) {
	res.send(req.cookies.user);
});


//post request for getting a user logged in
app.post('/login',function(req,res){
  var user_name=req.body.user;
  res.cookie('user', user_name);
  res.end("yes");
});

//logout page for clearing user cookies
app.get('/logout', function(req,res) {
	res.clearCookie('user');
	res.writeHead(307, {'Location':'/index.html'});
	res.end();
});

//mongodb find user function
var findUser = function(db, user,data,callback) {
	var cursor = db.collection('users').find({"userName": user});
	cursor.each(function(err,doc) {
		assert.equal(err,null);
		if (doc != null) {
			data.push(doc);
		}else {
			callback();
		}
	});
}

//mongodb get list function
var getList = function(db, coll,data, callback) {
	var cursor = db.collection(coll).find();
	cursor.each(function(err,doc) {
		assert.equal(err,null);
		if (doc != null) {
			data.push(doc);
		}else {
			callback();
		}
	});
}

//mongodb get list function
var getCategory = function(db, coll,data, callback) {
	var cursor = db.collection('items').find({category: coll});
	cursor.each(function(err,doc) {
		assert.equal(err,null);
		if (doc != null) {
			data.push(doc);
		}else {
			callback();
		}
	});
}



//mongodb get public bucketlist function
var browsePublic = function(db, search, data,callback) {
	var cursor = db.collection('items').find({desc: new RegExp(search)});
	cursor.each(function(err,doc) {
		assert.equal(err,null);
		if (doc != null) {
			data.push(doc);
		}else {
			callback();
		}
	});
}


//gets data from the index.html and functions accordingly
io.on('connection', function(socket) {
	//browse data
	socket.on('searchThis', function(search) {
		MongoClient.connect(url, function(err,db) {
			var data = [];
			assert.equal(null,err);
			browsePublic(db,search,data,function() {
				db.close();
				socket.emit('browseRes',data);
			})
		});
	});
	
	//end browse
	
	
	
	//items
    
    //move from items to other tables **********
	socket.on('moveDiffTable', function(item) {
		MongoClient.connect(url, function(err, db) {
			assert.equal(null, err);
			var collection = db.collection(item.table);
			collection.insert(
                {"_id" : new mongodb.ObjectId(item.name._id),
                "photo" : item.name.photo,
                "desc" : item.name.desc,
                "extra_desc" : item.name.extra_desc,
                "price" : item.name.price,
                "date_added" : item.name.date_added,
                "category" : item.name.category,
                "tags" : item.name.tags,
                "pay_method" : item.name.pay_method,
                "paid_by" : item.name.paid_by,
                "paid" : item.name.paid,
                "featured" : item.name.featured,
                "table" : item.name.table
                }
            );
			db.close();
		});
	});
	//add item
	socket.on('addItem', function(item) {
		MongoClient.connect(url, function(err, db) {
			assert.equal(null, err);
			var collection = db.collection(item.table);
			collection.insert(item);
			db.close();
		});
	});
	//edit item
	socket.on('editItem',function(item) {
		MongoClient.connect(url, function(err, db) {
			assert.equal(null, err);
			db.collection(item.table).updateOne(
			{ "_id" : new mongodb.ObjectId(item.name._id) },
			{
				$set: { "table": item.newtable,
                        "paid": item.paid }
			});
			db.close();
		});
	});
    
    socket.on('updatePhoto',function(item) {
        console.log(item.photo);
		MongoClient.connect(url, function(err, db) {
			assert.equal(null, err);
			db.collection('items').updateOne(
			{ "_id" : new mongodb.ObjectId(item.id) },
			{
				$set: { "photo": item.photo }
			});
			db.close();
		});
	});
    
    //edit item info
	socket.on('editItemInfo',function(item) {
		MongoClient.connect(url, function(err, db) {
			assert.equal(null, err);
			db.collection('items').updateOne(
			{ "_id" : new mongodb.ObjectId(item.id) },
			{
				$set: { "desc": item.desc,
                        "extra_desc": item.extra_desc,
                        "price": item.price,
                        "category": item.category,
                        "pay_method": item.pay_method,
                        "paid_by": item.paid_by
                      }
			});
			db.close();
		});
	});
    
    //update tag of item
	socket.on('updateTags',function(item) {
		MongoClient.connect(url, function(err, db) {
			assert.equal(null, err);
			db.collection('items').updateOne(
			{ "_id" : new mongodb.ObjectId(item.id) },
			{
				$set: { "tags": item.tags }
			});
			db.close();
		});
	});
	//remove item from list
	socket.on('removeItem', function(item) {
		MongoClient.connect(url, function(err,db) {
			assert.equal(null,err);
			db.collection(item.table).deleteOne(
			{ "_id" : new mongodb.ObjectId(item.name._id)}
			);
			db.close();
		});
	});
    
    //edit item for feature
	socket.on('itemFeature',function(item) {
		MongoClient.connect(url, function(err, db) {
			assert.equal(null, err);
			db.collection('items').updateOne(
			{ "_id" : new mongodb.ObjectId(item.name._id) },
			{
				$set: { "featured": item.featured }
			});
			db.close();
		});
	});
    
    //edit item for unfeature
	socket.on('itemUnfeature',function(item) {
		MongoClient.connect(url, function(err, db) {
			assert.equal(null, err);
			db.collection('items').updateOne(
			{ "_id" : new mongodb.ObjectId(item.name._id) },
			{
				$set: { "featured": item.featured }
			});
			db.close();
		});
	});
    
	//get whole list
	socket.on('getList', function(list) {
		var data = [];
		MongoClient.connect(url, function(err, db) {
			assert.equal(null, err);
			getList(db, list,data,function() {
				db.close();
				socket.emit('receiveList',data);
			});
		});
		
	});
    
    //get whole archive
	socket.on('getArchive', function(list) {
		var data = [];
		MongoClient.connect(url, function(err, db) {
			assert.equal(null, err);
			getList(db, list,data,function() {
				db.close();
				socket.emit('receiveArchive',data);
			});
		});
		
	});
    
    //get item
	socket.on('getItem', function(item) {
		var data = [];
		MongoClient.connect(url, function(err, db) {
			assert.equal(null, err);
            db.collection('items').findOne({_id: new mongodb.ObjectId(item)}, function(error, ret) {
               assert.equal(null, error);
                socket.emit('receiveItem',ret);
                db.close();
            });
			
		});
		
	});
    
    //get item
	socket.on('getCategoryItems', function(item) {
		var data = [];
		MongoClient.connect(url, function(err, db) {
			assert.equal(null, err);
			getCategory(db, item,data,function() {
                socket.emit('receiveCategoryItems',data);
				db.close();
				
			});
		});
		
	});
    
	
	//end item socket code
	
	
	//login
	//check if user and password combo is correct
	socket.on('loginUser', function(user) {
		var data = [];
		MongoClient.connect(url, function(err, db) {
			assert.equal(null, err);
			findUser(db, user['userName'],data,function() {
				db.close();
				if (data[0] == null) {
					socket.emit('loginCheck', false);
				}else if (data[0]['password'] == crypto.createHash('md5').update(user['password']+data[0]['salt']).digest("hex")) {
					socket.emit('loginCheck', true);
				}else {
					socket.emit('loginCheck', false);
				}
			});
		});
		
	});
	//end login
	
	//signup 
	
	//mongodb store user data into database
	socket.on('userData', function(user_data) {
		
		MongoClient.connect(url, function(err, db) {
		assert.equal(null, err);
	
		var cursor = db.collection("users").find({"userName": user_data['userName']});
		cursor.count(function(error, size) {
			if (size == 0) {
				var collection = db.collection("users");
				var insert_user_d = user_data;
				insert_user_d['salt'] = randomstring.generate( {
					length: 16,
					charset: 'alphabetic'
				});
				insert_user_d['password'] = crypto.createHash('md5').update(user_data['password']+insert_user_d['salt']).digest("hex");
				collection.insert(insert_user_d);
				socket.emit('userNameCheck', true);
			}else {
				socket.emit('userNameCheck', false);
			}
			
		});
	
		db.close;
		});
			
	});	
	//end signup
    
    //profile data
	socket.on('changePass', function(opass,pass,user) {
		MongoClient.connect(url, function(err, db) {
			var data = [];
			assert.equal(null, err);
			findUser(db, user,data,function() {
				db.close();
				if (data[0]['password'] == crypto.createHash('md5').update(opass+data[0]['salt']).digest("hex")) {
					MongoClient.connect(url, function(err, db) {
						assert.equal(null,err);
						var newsalt = randomstring.generate( {
							length: 16,
							charset: 'alphabetic'
						});
						db.collection('users').updateOne(
						{ "userName" : user },
						{
								$set: {	password: crypto.createHash('md5').update(pass+newsalt).digest("hex"),
									salt: newsalt
								}
						});
						db.close();
						
					});
					socket.emit('cPassRes', "Your Password has changed.");
				}else {
					socket.emit('cPassRes', 'The Old Password is incorrect!');
				}
			});
		});
	});
	
});

//run server on port 3000
server.listen(3000);
console.log("Server running on :3000");