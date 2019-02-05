'use strict';
var AWS = require('aws-sdk');
var s3 = new AWS.S3();
var csv = require('papaparse');
var elasticsearch = require('elasticsearch');
var client = new elasticsearch.Client({
  host: process.env["elasticserver"]
});

module.exports.readcsv = async (event, context) => {
  const bucket = event.Records[0].s3.bucket.name;
  const key = event.Records[0].s3.object.key;

  console.log(bucket);
  console.log(key);

  console.log(`A new file ${key} was created in the bucket ${bucket}`);
  var csvcontent = await getFile(bucket,key);
  console.log("Done reading file. "+csvcontent.length);
  var parsed = csv.parse(csvcontent);
  console.log("Done parsing "+parsed.data.length+", errors : "+parsed.errors.length);
  for (var i =0;i<parsed.errors.length;i++)
  {
    console.log(parsed.errors[i]);
  }
  var lines = parsed.data;
  var bulk = [];
  for (var i=0;i<lines.length;i++)
  {
    bulk.push({index: {_index: 'wine', _type: 'wine', _id: parseInt(lines[i][0])}});
    bulk.push({
      id:parseInt(lines[i]), 
      country: lines[i][1],
      description: lines[i][2],
      designation: lines[i][3],
      points: parseFloat(lines[i][4]),
      price: parseFloat(lines[i][5]),
      province: lines[i][6],
      region1: lines[i][7],
      region2: lines[i][8],
      taster_name: lines[i][9],
      taster_twitter_handle: lines[i][10],
      title: lines[i][11],
      variety: lines[i][12],
      winery: lines[i][13]
    });

    if (i%1000==0 || i==lines.length-1)
    {
      console.log("Submitting batch : ",i);
      await client.bulk({body: bulk});
      console.log("Batch submitted");
      bulk=[];
    }
  }

};



async function getFile(bucket, key)
{
  return new Promise(function(resolve,reject){
    s3.getObject({
      Bucket: bucket,
      Key: key
  }, function(err, data) {
      if (err) {
          console.log(err, err.stack);
          reject(err);
      } else {
          resolve(data.Body.toString('utf8'));
      }
  });
  })
}