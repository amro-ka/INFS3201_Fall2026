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

### Indexes
The following indexes were created in MongoDB Compass (Indexes tab > Create Index) on the fields
the application searches on. No code is used to create them.

| Collection  | Index field  | Options | Used by |
|-------------|--------------|---------|---------|
| `customers` | `customerId` | unique  | Find Customer (`findOne`), customer names on the Orders page (`$in`) |
| `services`  | `serviceId`  | unique  | Looking up a service's price (`findOne`) |
| `orders`    | `orderId`    | unique  | Update Status (`findOne`, `updateOne`), sorting the Orders page, next order ID |
| `orders`    | `customerId` | -       | All orders for one customer (`find`) |

## Part 2: Web front end
The console interface has been replaced with an Express + express-handlebars web application.
The Express app, Handlebars views/layout and `public/style.css` form the presentation layer and only
call `business.js`, which in turn is the only module that calls `persistence.js`.

Run with `npm install` then `node app.js` and open http://127.0.0.1:8000

| Page | URL |
|------|-----|
| Landing page (nav menu in the layout) | `/` |
| Laundry services | `/services` |
| Find customer form / results | `/customer`, `/find-results?customer_id=C001` |
| All orders | `/orders` |
| Update order status (POST then redirect to `/orders`) | `/update-status?order=O001` |

There is no client-side JavaScript and no inline styling.

# Assignment 4

## Part 1: Find Customer by phone
The Find Customer form searches by phone number (`/find-results?phone=5512-4837`).

## Part 2: MongoDB identifiers
`db_transform.js` was run once against the database (see `db_conversion.md`). The application ids
`customerId`, `serviceId` and `orderId` no longer exist on customers, services and orders; every
record is identified by its MongoDB `_id`, and orders refer to their customer and services by `_id`.
The script dropped the unique indexes on the removed fields. The remaining indexes are:

| Collection  | Index field  | Used by |
|-------------|--------------|---------|
| `orders`    | `customerId` | All orders for one customer | Missing or invalid customer and order IDs
display a message instead of crashing the application.
