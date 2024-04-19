const mongoose = require("mongoose");


  const uriDB = process.env.MONGODB_URI;
  const uriDBReadOnly = process.env.MONGODB_URI_READONLY;

  const db = mongoose.createConnection(uriDB)
  .on("error", (error) => {
    console.log("Error connecting to database: ", error);
  })
  .on("connected", () => {
    console.log("Connected to database...");
  });
  const dbReadOnly = mongoose.createConnection(uriDBReadOnly)
  .on("error", (error) => {
    console.log("Error connecting to read only database: ", error);
  })
  .on("connected", () => {
    console.log("Connected to read only database...");
  });



module.exports = {db, dbReadOnly};
