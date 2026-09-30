import fs from 'fs/promises'

/**
 * Get all orders from the orders file
 * @returns A list of JavaScript objects
 */
async function loadOrders() {
    let raw = await fs.readFile('orders.json')
    let orders = JSON.parse(raw)
    return orders
}

/**
 * Write the list of objects representing the orders out to the file, overwriting the existing file.
 * @param {*} orderList The list of objects to be written.
 */
async function saveOrders(orderList) {
    await fs.writeFile('orders.json', JSON.stringify(orderList, null, 4))
}

/**
 * Get all services
 * @returns A list of Objects
 */
export async function loadServices() {
    let raw = await fs.readFile('services.json')
    let services = JSON.parse(raw)
    return services
}

/**
 * Find a single customer
 * @param {*} cid The customer ID
 * @returns A JavaScript object representing the customer or null if the customer does not exist
 */
export async function findCustomer(cid) {
    let raw = await fs.readFile('customers.json')
    let customerList = JSON.parse(raw)
    for (let c of customerList) {
        if (c.customerId === cid) {
            return c
        }
    }
    return null
}

/**
 * Find a single service
 * @param {*} sid Service ID
 * @returns A JavaScript object about the service or null if the service does not exist.
 */
export async function findService(sid) {
    let serviceList = await loadServices()
    for (let s of serviceList) {
        if (s.serviceId == sid) {
            return s
        }
    }
    return null
}

/**
 * Find a single order given the order ID
 * @param {*} oid The order ID to be found
 * @returns A JavaScript object for the order or null if the order was not found.
 */
export async function findOrder(oid) {
    let orderList = await loadOrders()
    for (let ord of orderList) {
        if (ord.orderId === oid) {
            return ord
        }
    }
    return null
}

/**
 * Find the orders for a given customer.
 * @param {*} cid The customer ID
 * @returns A list of Objects representing the orders for a customer or an empty list if there are none
 */
export async function findOrdersByCustomer(cid) {
    let orderList = await loadOrders()
    let result = []
    for (let ord of orderList) {
        if (ord.customerId === cid) {
            result.push(ord)
        }
    }
    return result
}

/**
 * Generate an auto-incremented order number.  This works by going through the order information
 * in the JSON file and finding the largest number then adding 1.
 * @returns The new order ID with the "O" prepended
 */
export async function getNextOrderId() {
    let orders = await loadOrders()
    let maxId = 0
    for (let ord of orders) {
        let id = Number(ord.orderId.substring(1))
        if (id > maxId) {
            maxId = id
        }
    }
    return 'O' + String(maxId + 1).padStart(3, '0')
}

/**
 * Add a new order to the orders file.
 * @param {*} order The order object to be added
 */
export async function createOrder(order) {
    let orderList = await loadOrders()
    orderList.push(order)
    await saveOrders(orderList)
}

/**
 * Replace an existing order in the orders file with the updated version.
 * @param {*} order The updated order object
 */
export async function updateOrder(order) {
    let orderList = await loadOrders()
    for (let i = 0; i < orderList.length; i++) {
        if (orderList[i].orderId === order.orderId) {
            orderList[i] = order
        }
    }
    await saveOrders(orderList)
}
