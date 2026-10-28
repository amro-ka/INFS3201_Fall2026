# Assignment 1
The solution provided for assignment 1 is somewhat sketchy!  This was done on purpose so that there will be a bit more work to be done for the students who use this as a starting point for Assignment 2

# Assignment 2
It should be closer to a good design. We specifically loaded the .env variables at the start of the
application and just used them in the business layer.  To be honest we really wouldn't use a 
.env file for business configuration but might consider a json file instead.  The .env file is excellent for things that would actually change depending on the deployment location such as the port number, the ip address, the URL if it is needed, etc.  We included the .env this time just as a demonstration of what we could use it for.

# Assignment 3

## Part 1: MongoDB persistence
The JSON-file persistence layer has been replaced with MongoDB using the official `mongodb` driver.
The application no longer reads `customers.json`, `services.json` or `orders.json`; those files are
only kept so the database can be populated during development.

- Database: `infs3201_fall2026`
- Collections: `customers`, `services`, `orders` (same document structure as the JSON files)
- The connection string is stored in `.env` as `MONGODB_URI`. A copy of the `.env` contents is in
  `env-sample` and `.env.example`.

### Setting up the database
1. Start MongoDB (or use the connection string for your own server in `.env`).
2. In MongoDB Compass, create the database `infs3201_fall2026` with the collections `customers`,
   `services` and `orders`.
3. Import each JSON file into the matching collection (Add Data > Import JSON or CSV file).
