# Assignment 2
This is the Laundry Order Management System from Assignment 1, refactored into a three-tier architecture. app.js is the presentation layer, business.js is the business logic layer and persistence.js is the persistence layer that reads and writes the JSON files.

To run it, use npm install, create a .env file using the values in .env.example, then run node app.js. If the .env file is missing the pricing values default to 0.

Assignment 2 also adds the minimum order charge and delivery charge pricing rules, and a new View invoice option in the menu.
