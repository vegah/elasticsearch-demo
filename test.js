var handler = require('./handler');
console.log("Connecting to ",process.env["elasticserver"]);

handler.readcsv({
  Records: [
    {
      s3: {
          bucket: {
            name: "elasticdemo-s3-dev"
          },
          object: {
              key: "winemag-data-130k-v2.csv"
          }
      }
    }
  ]  
});