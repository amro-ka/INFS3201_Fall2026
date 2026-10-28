import fs from 'fs/promises'

/**
 * Get all services
 * @returns A list of Objects
 */
export async function getServices() {
    let raw = await fs.readFile('services.json')
    let services = JSON.parse(raw)
    return services
}

/**
 * Get all orders
 * @returns A list of JavaScript objects
 */
async function getOrders() {
    let raw = await fs.readFile('orders.json')
    let orders = JSON.parse(raw)
    return orders
}

/**
 * Get information about a single customer
 * @param {*} cid The customer ID
 * @returns A JavaScript object representing the customer or null if the customer does not exist
 */
export async function getCustomerInformation(cid) {
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
 * Get the orders for a given customer.
 * @param {*} cid The customer ID
 * @returns A list of Objects representing the orders for a customer or an empty list if there are none 
 * or the customer could not be found.
 */
export async function getCustomerOrders(cid) {
    let result = []
    let raw = await fs.readFile('orders.json') 
    let orderList = JSON.parse(raw)
    for (let ord of orderList) {
        if (ord.customerId === cid) {
            let total = 0
            for (let items of ord.items) {
                let price = await getServicePrice(items.serviceId)
                total += price*items.quantity
            }
            result.push({
                order: ord.orderId,
                date: ord.orderDate,
                status: ord.status,
                total: total
            })
        }
    }
    return result
}

/**
 * Get details about a single service
 * @param {*} sid Service ID
 * @returns A JavaScript object about the service or null is the service does not exist.
 */
export async function getService(sid) {
    let raw = await fs.readFile('services.json')
    let serviceList = JSON.parse(raw) 
    for (let s of serviceList) {
        if (s.serviceId == sid) {
            return s
        }
    }
    return null
}

/**
 * Get the price of an individual service item given the service ID
 * @param {*} sid The id of the service
 * @returns The price as a Number or null if the service is not found
 */
async function getServicePrice(sid) {
    let raw = await fs.readFile('services.json')
    let serviceList = JSON.parse(raw) 
    for (let s of serviceList) {
        if (s.serviceId == sid) {
            return s.price
        }
    }
    return null
}



/**
 * Write the list of objects representing the orders out to the file, overwriting the existing file.
 * @param {*} orderList The list of objects to be written.
 */
async function saveOrders(orderList) {
    let raw = JSON.stringify(orderList, null, 4)
    await fs.writeFile('orders.json', raw)
}

/**
 * Get details about a single order given the order ID
 * @param {*} oid The order ID to be found
 * @returns A JavaScript object for the order or null if the order was not found.
 */
export async function getOrderDetails(oid) {
    let raw = await fs.readFile('orders.json')
    let orderList = JSON.parse(raw)
    for (let ord of orderList) {
        if (ord.orderId === oid) {
            return ord
        }
    }
    return null
}

/**
 * Generate an auto-incremented order number.  This works by going through the order information
 * in the JSON file and finding the largest number then adding 1.
 * @returns The new order ID with the "O" prepended
 */
async function getNextOrderId() {
    let orders = await getOrders()
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
 * Attempt to update the order status to a new status level following the ordering rules. 
 * The newly updated state will be written to the file if the state change is allowed.
 * 
 * @param {*} order A JavaScript object representing the current state of the entire order
 * @param {*} newStatus The new state that we would like to switch to.
 * @returns true if the operation is successful, false otherwise
 */
export async function updateOrderStatus(orderId, newStatus) {
    let raw = await fs.readFile('orders.json')
    let orderList = JSON.parse(raw)
    for (let ord of orderList) {
        if (ord.orderId == orderId) {
            ord.status = newStatus
            break
        }
    }
    let result = JSON.stringify(orderList, null, 4)
    await fs.writeFile('orders.json', result)
    return true
}

export async function createOrder(details) {
    let orderList = await getOrders()
    let newId = await getNextOrderId()
    details.orderId = newId
    orderList.push(details)
    await saveOrders(orderList)
    return details
}

