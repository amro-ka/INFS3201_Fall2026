/*
 * One-time database maintenance utility for Assignment 4 Part 2.
 * This is NOT part of the web application.  Run it exactly once with:  node db_transform.js
 *
 * Before the change every document had an application generated id (customerId, serviceId,
 * orderId) as well as the _id MongoDB generates.  After the change:
 *   - customers no longer have customerId
 *   - services no longer have serviceId
 *   - orders no longer have orderId
 *   - orders.customerId holds the customer's _id (an ObjectId) instead of "C001"
 *   - orders.items[].serviceId holds the service's _id (an ObjectId) instead of "S001"
 *
 * A backup of the three collections is written to backup-<timestamp>/ before anything is changed.
 * If the database has already been converted the script stops without changing anything.
 */
import fs from 'fs'
import dotenv from 'dotenv'
import { MongoClient, BSON } from 'mongodb'

dotenv.config({ quiet: true })

const DATABASE_NAME = 'infs3201_fall2026'
const COLLECTIONS = ['customers', 'services', 'orders']

/**
 * Write every document of each collection to a JSON file so the data can be restored if needed.
 * Extended JSON is used so ObjectId values are kept.
 * @param {*} db The MongoDB Db object
 * @returns The name of the backup folder
 */
async function backupCollections(db) {
    let folder = 'backup-' + new Date().toISOString().replace(/[:.]/g, '-')
    fs.mkdirSync(folder)
    for (let name of COLLECTIONS) {
        let docs = await db.collection(name).find().toArray()
        fs.writeFileSync(`${folder}/${name}.json`, BSON.EJSON.stringify(docs, null, 4, { relaxed: false }))
        console.log(`Backed up ${docs.length} ${name} to ${folder}/${name}.json`)
    }
    return folder
}

/**
 * Drop the index on a field that is being removed.  A unique index on a removed field would
 * otherwise reject every document after the first one (they would all have a missing value).
 * @param {*} collection The MongoDB collection
 * @param {*} field The field name whose single-field index should be dropped
 */
async function dropIndexOnField(collection, field) {
    let indexes = await collection.indexes()
    for (let index of indexes) {
        let keys = Object.keys(index.key)
        if (keys.length === 1 && keys[0] === field) {
            await collection.dropIndex(index.name)
            console.log(`Dropped index ${index.name} on ${collection.collectionName}`)
        }
    }
}

/**
 * Build a lookup from an old application id ("C001") to the document's MongoDB _id.
 * @param {*} collection The MongoDB collection
 * @param {*} field The old id field name
 * @returns An object mapping old id strings to ObjectId values
 */
async function buildIdMap(collection, field) {
    let docs = await collection.find({ [field]: { $exists: true } }, { projection: { [field]: 1 } }).toArray()
    let map = {}
    for (let doc of docs) {
        map[doc[field]] = doc._id
    }
    return map
}

async function main() {
    let client = new MongoClient(process.env.MONGODB_URI)
    await client.connect()
    try {
        let db = client.db(DATABASE_NAME)
        let customers = db.collection('customers')
        let services = db.collection('services')
        let orders = db.collection('orders')

        let notConverted = await customers.countDocuments({ customerId: { $exists: true } })
            + await services.countDocuments({ serviceId: { $exists: true } })
            + await orders.countDocuments({ orderId: { $exists: true } })
        if (notConverted === 0) {
            console.log('The database has already been converted. Nothing was changed.')
            return
        }

        await backupCollections(db)

        let customerMap = await buildIdMap(customers, 'customerId')
        let serviceMap = await buildIdMap(services, 'serviceId')

        await dropIndexOnField(customers, 'customerId')
        await dropIndexOnField(services, 'serviceId')
        await dropIndexOnField(orders, 'orderId')

        // Point each order at the customer's and services' _id values and remove orderId.
        let orderList = await orders.find({ orderId: { $exists: true } }).toArray()
        for (let order of orderList) {
            let customerRef = customerMap[order.customerId]
            if (!customerRef) {
                console.log(`Warning: order ${order.orderId} refers to unknown customer ${order.customerId}`)
                customerRef = null
            }
            let items = []
            for (let item of order.items) {
                let serviceRef = serviceMap[item.serviceId]
                if (!serviceRef) {
                    console.log(`Warning: order ${order.orderId} refers to unknown service ${item.serviceId}`)
                    serviceRef = null
                }
                items.push({ ...item, serviceId: serviceRef })
            }
            await orders.updateOne(
                { _id: order._id },
                { $set: { customerId: customerRef, items: items }, $unset: { orderId: '' } }
            )
        }
        console.log(`Updated ${orderList.length} orders`)

        let result = await customers.updateMany({ customerId: { $exists: true } }, { $unset: { customerId: '' } })
        console.log(`Removed customerId from ${result.modifiedCount} customers`)
        result = await services.updateMany({ serviceId: { $exists: true } }, { $unset: { serviceId: '' } })
        console.log(`Removed serviceId from ${result.modifiedCount} services`)
        console.log('Conversion complete.')
    }
    finally {
        await client.close()
    }
}

main()
