import { MongoClient, ObjectId } from 'mongodb'

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
 * Convert an id received from a higher layer into a MongoDB ObjectId.  Ids typed into a URL
 * may be anything, so only a 24 character hex string (or an existing ObjectId) is accepted.
 * @param {*} id The id as a string or ObjectId
 * @returns The ObjectId, or null if the value is not a valid id
 */
function toObjectId(id) {
    if (id instanceof ObjectId) {
        return id
    }
    if (typeof id === 'string' && /^[0-9a-fA-F]{24}$/.test(id)) {
        return new ObjectId(id)
    }
    return null
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
 * @param {*} sid The service's _id
 * @returns A JavaScript object about the service or null is the service does not exist.
 */
export async function getService(sid) {
    let id = toObjectId(sid)
    if (!id) {
        return null
    }
    let db = await getDatabase()
    return await db.collection('services').findOne({ _id: id })
}

/**
 * Get information about a single customer
 * @param {*} cid The customer's _id
 * @returns A JavaScript object representing the customer or null if the customer does not exist
 */
export async function getCustomerInformation(cid) {
    let id = toObjectId(cid)
    if (!id) {
        return null
    }
    let db = await getDatabase()
    return await db.collection('customers').findOne({ _id: id })
}

/**
 * Find a single customer using their phone number.
 * @param {*} phone The phone number exactly as stored, for example "5512-4837"
 * @returns A JavaScript object representing the customer or null if no customer has that phone number
 */
export async function getCustomerByPhone(phone) {
    let db = await getDatabase()
    return await db.collection('customers').findOne({ phone: phone })
}

/**
 * Get information about several customers at once.
 * @param {*} cidList A list of customer _id values
 * @returns A list of customer objects for the ids that exist
 */
export async function getCustomersByIds(cidList) {
    let ids = []
    for (let cid of cidList) {
        let id = toObjectId(cid)
        if (id) {
            ids.push(id)
        }
    }
    let db = await getDatabase()
    return await db.collection('customers').find({ _id: { $in: ids } }).toArray()
}

/**
 * Get all orders in the system, oldest first.
 * @returns A list of order objects
 */
export async function getAllOrders() {
    let db = await getDatabase()
    return await db.collection('orders').find().sort({ _id: 1 }).toArray()
}

/**
 * Get the orders for a given customer.
 * @param {*} cid The customer's _id
 * @returns A list of order objects for the customer or an empty list if there are none
 * or the customer could not be found.
 */
export async function getCustomerOrders(cid) {
    let id = toObjectId(cid)
    if (!id) {
        return []
    }
    let db = await getDatabase()
    return await db.collection('orders').find({ customerId: id }).sort({ _id: 1 }).toArray()
}

/**
 * Get details about a single order given its _id
 * @param {*} oid The order's _id
 * @returns A JavaScript object for the order or null if the order was not found.
 */
export async function getOrderDetails(oid) {
    let id = toObjectId(oid)
    if (!id) {
        return null
    }
    let db = await getDatabase()
    return await db.collection('orders').findOne({ _id: id })
}

/**
 * Change the status of a single order.
 * @param {*} oid The _id of the order to update
 * @param {*} newStatus The new status value
 * @returns true if an order was updated, false if the order was not found
 */
export async function updateOrderStatus(oid, newStatus) {
    let id = toObjectId(oid)
    if (!id) {
        return false
    }
    let db = await getDatabase()
    let result = await db.collection('orders').updateOne(
        { _id: id },
        { $set: { status: newStatus } }
    )
    return result.matchedCount === 1
}

/**
 * Insert a new order.  MongoDB assigns its _id.
 * @param {*} details The order object; customerId and each item's serviceId must be _id values
 * @returns The order object including its new _id
 */
export async function createOrder(details) {
    let db = await getDatabase()
    let order = { ...details, customerId: toObjectId(details.customerId) }
    order.items = []
    for (let item of details.items) {
        order.items.push({ ...item, serviceId: toObjectId(item.serviceId) })
    }
    let result = await db.collection('orders').insertOne(order)
    order._id = result.insertedId
    return order
}
