var express = require('express');
var router = express();
router.use(express.urlencoded({ extended: true })); // <--- middleware configuration


const {Client, Query } = require('pg')

//Setup connection
var username = "postgres"
var password = "admin"
var host = "localhost:5432"
var database = "snowshoe"
var conString = "postgres://"+username+":"+password+"@"+host+"/"+database;

var testQuery = "SELECT row_to_json(fc) FROM (SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features FROM (SELECT 'Feature' As type, ST_AsGeoJSON(lg.geom)::json As geometry,row_to_json((gid, name, difficulty, descriptio, closed, message)) As properties FROM snowshoetrails As lg) As f) As fc"


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Welcome To Snowshoe Bike Park' });
});

module.exports = router;

/* GET Postgres JSON data */
router.get('/data', function (req, res) {
  var client = new Client(conString);
  client.connect();
  var query = client.query(new Query(testQuery));
  query.on("row", function (row, result) {
      result.addRow(row);
  });
  query.on("end", function (result) {
      res.send(result.rows[0].row_to_json);
      res.end();
  });
});

/* GET map page */
router.get('/map', function(req, res) {
  var client = new Client(conString); // Setup Postgres Client
  client.connect(); // connect to the client
  var query = client.query(new Query(testQuery)); // Run Test Query
  query.on("row", function (row, result) {
      result.addRow(row);
  });
  // Pass the result to the map page
  query.on("end", function (result) {
      var data = result.rows[0].row_to_json // Save the JSON as variable data
      res.render('map', {
          title: "Rider Map", // Give a title to our page
          jsonData: data // Pass data to the View
      });
  });
});


// Get employee page
router.get('/employee', function(req, res) {
  var client = new Client(conString);
  client.connect();
  var query = client.query(new Query(testQuery));
  query.on("row", function (row, result) {
    result.addRow(row);
  });
  //Pass result to employee page
  query.on("end", function (result) {
    var data =result.rows[0].row_to_json
    console.log(result)
    res.render('employee', {
      title: "Employee Map",
      jsonData: data,
      trails: data['features']
    });
  });
});

const  { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "snowshoe",
  password: "admin",
  port: 5432
});

router.post('/updateStatus', function(req,res) {
  // var client = new Client(conString);
  // client.connect()
  console.log(req.body)
  const trail = [req.body.status, req.body.message, req.body.trail]
  const statusQuery = "UPDATE snowshoetrails SET closed = $1, message = $2 WHERE (name = $3)";
  pool.query(statusQuery, trail, function(err, result) {
    if (err) {
      console.error(err)
    }
    else {
      res.status(200).send({ message: "Trail Updated Successfully!" });
      // res.redirect('/employee')
    }

    // res.status(200).send({ message: "Product Updated Successfully!" });
  });
});

router.post('/updateDifficulty', function(req, res) {
  console.log(req.body)
  const trail = [req.body.difficulty, req.body.trail]
  const difficultyQuery = "UPDATE snowshoetrails SET difficulty = $1 WHERE (name = $2)";
  pool.query(difficultyQuery, trail, function(err, result) {
    if(err) {
      console.error(err)
    }
    else {
      res.status(200).send({message: "Trail Updated Succesfully!"})
    }
  });
});

router.post('/createFeature', function(req, res) {
  console.log(req.body)
  const feature = [req.body.featname, req.body.ftype, req.body.featlocationLat, req.body.featlocationLng]
  const featureQuery = "INSERT INTO features (name, type, geom) VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326))";
  pool.query(featureQuery, feature, function(err, result) {
    if(err) {
      console.error(err)
    }
    else {
      res.status(200).send({message: "New Feature was added!"})
    }
  });
});

router.post('/createEmergency', function(req, res) {
  console.log(req.body)
  const emergency = [req.body.type, req.body.emerglocationLat, req.body.emerglocationLng]
  const emergencyQuery = "INSERT INTO emergency (type, geom) VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326))";
  pool.query(emergencyQuery, emergency, function(err, result) {
    if(err) {
      console.error(err)
    } else {
      res.status(200).send({message: "New Emergency location was added!"})
    }
  })
} )



