# Assignment 1
The solution provided for assignment 1 is somewhat sketchy!  This was done on purpose so that there will be a bit more work to be done for the students who use this as a starting point for Assignment 2

# Assignment 2
It should be closer to a good design. We specifically loaded the .env variables at the start of the
application and just used them in the business layer.  To be honest we really wouldn't use a 
.env file for business configuration but might consider a json file instead.  The .env file is excellent for things that would actually change depending on the deployment location such as the port number, the ip address, the URL if it is needed, etc.  We included the .env this time just as a demonstration of what we could use it for.