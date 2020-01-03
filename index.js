//import packages

var mongodb = require('mongodb');
var objectID = mongodb.ObjectID;
var crypto = require('crypto');
var express = require('express');
var bodyParser = require('body-parser');

//PASSWORD ULTILS
//CREATE FUNCTION TO RANDOM SALT
var genRandomString = function(length){
	return crypto.randomBytes(Math.ceil(length/2))
		.toString('hex') /*convert to hexa format */
		.slice(0, length)
}
var sha512 = function(password, salt){
	var hash = crypto.createHmac('sha512', salt);
	hash.update(password);
	var value = hash.digest('hex');
	return{
		salt:salt,
		passwordHash:value
	};
}


 function saltHashPassword(userPassword){
	var salt = genRandomString(16); //create 16 random charachter
	var passwordData = sha512(userPassword, salt)
	return passwordData; 
}

function checkHashPassword(userPassword,salt){
	var passwordData = sha512(userPassword, salt);
	return passwordData;
}

//Create Express Service
var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:true}));

//create MongoDB client
var mongoClient = mongodb.MongoClient;

//connection URL
var url = 'mongodb://localhost:27017' // 27017 is default port

mongoClient.connect(url,{useNewUrlParser: true}, function(err, client){
	if(err){
		console.log('unable to connect to mongodb server',client)
	}else{

		app.post('/register', (req, res, next)=>{
			var post_data = req.body;
			var plain_password = post_data.password;
			var hash_data = saltHashPassword(plain_password);
			var password = hash_data.passwordHash; //save password
			var salt = hash_data.salt; //save salt
			var name = post_data.name;
			var email = post_data.email;

			var insertJson = {
				'email' : email,
				'name' : name,
				'password' : password,
				'salt' : salt 
			}

			var db = client.db('tanvirgeeknodejs');
			db.collection('user').find({
				'emai' : email
			}).count(function(err, number){
				if(number != 0){
					res.json('Email already exists');
					console.log("Email already exists");
				}else{
					db.collection('user').insertOne(insertJson,function(){err, res});
					res.json('Registration Success');
					console.log("Registration Success");
				}
			});
		});
		app.listen( 3000 ,()=>{
			console.log("connected to mongodb Server, Webservices running on Port 3000", );
		});
	}
})


