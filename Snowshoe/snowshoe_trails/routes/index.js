var express = require('express');
var router = express.Router();

const {Client, Query } = require('pg')

//Setup connection
var username = "postgres"
var password = "admin"
var host = "localhost:5432"
var database = "snowshoe"
var conString = "postgres://"+username+":"+password+"@"+host+"/"+database;

var testQuery = "SELECT row_to_json(fc) FROM (SELECT 'FeatureCollection' As type, array_to_json(array_agg(f)) As features FROM (SELECT 'Feature' As type, ST_AsGeoJSON(lg.geom)::json As geometry,row_to_json((gid, name, difficulty, descriptio)) As properties FROM snowshoetrails As lg) As f) As fc"


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
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