import { MongoClient } from 'mongodb'

const DATABASE_NAME = 'infs3201_fall2026'

// Cached MongoDB connection, created on first use and reused for every request.
let client = null

/**
 * Get the application database, connecting to MongoDB the first time it is needed.
 * The connection string is read from the MONGODB_URI value in the .env file.
 * @returns The MongoDB Db object for the application database
 */
async function getDatabase() {
    if (!client) {
        client = new MongoClient(process.env.MONGODB_URI)
        await client.connect()
    }
    return client.db(DATABASE_NAME)
}

/**
 * Get all services
 * @returns A list of Objects
 */
export async function getServices() {
    let db = await getDatabase()
    return await db.collection('services').find().toArray()
}

/**
 * Get details about a single service
 * @param {*} sid Service ID
 * @returns A JavaScript object about the service or null is the service does not exist.
 */
export async function getService(sid) {
    let db = await getDatabase()
    return await db.collection('services').findOne({ serviceId: sid })
}

/**
 * Get information about a single customer
 * @param {*} cid The customer ID
 * @returns A JavaScript object representing the customer or null if the customer does not exist
 */
export async function getCustomerInformation(cid) {
    let db = await getDatabase()
    return await db.collection('customers').findOne({ customerId: cid })
}

/**
 * Get the orders for a given customer.
 * @param {*} cid The customer ID
 * @returns A list of order objects for the customer or an empty list if there are none
 * or the customer could not be found.
 */
export async function getCustomerOrders(cid) {
    let db = await getDatabase()
    return await db.collection('orders').find({ customerId: cid }).sort({ orderId: 1 }).toArray()
}

/**
 * Get details about a single order given the order ID
 * @param {*} oid The order ID to be found
 * @returns A JavaScript object for the order or null if the order was not found.
 */
export async function getOrderDetails(oid) {
    let db = await getDatabase()
    return await db.collection('orders').findOne({ orderId: oid })
}

/**
 * Generate an auto-incremented order number by asking MongoDB for the order with the
 * largest order ID and adding 1.  Order IDs are zero padded so they sort correctly as strings.
 * @returns The new order ID with the "O" prepended
 */
async function getNextOrderId() {
    let db = await getDatabase()
    let last = await db.collection('orders').findOne({}, { sort: { orderId: -1 } })
    let maxId = 0
    if (last) {
        maxId = Number(last.orderId.substring(1))
    }
    return 'O' + String(maxId + 1).padStart(3, '0')
}

/**
 * Change the status of a single order.
 * @param {*} orderId The order to update
 * @param {*} newStatus The new status value
 * @returns true if an order was updated, false if the order was not found
 */
export async function updateOrderStatus(orderId, newStatus) {
    let db = await getDatabase()
    let result = await db.collection('orders').updateOne(
        { orderId: orderId },
        { $set: { status: newStatus } }
    )
    return result.matchedCount === 1
}

/**
 * Insert a new order, assigning it the next available order ID.
 * @param {*} details The order object without an order ID
 * @returns The order object including its new order ID
 */
export async function createOrder(details) {
    let db = await getDatabase()
    details.orderId = await getNextOrderId()
    await db.collection('orders').insertOne(details)
    return details
}
