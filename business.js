import dotenv from 'dotenv'
import * as persistence from './persistence.js'

// quiet stops dotenv from printing its own message to the console
dotenv.config({ quiet: true })

/**
 * Apply the pricing rules to the items of an order.  Services that cannot be found are skipped.
 * @param {*} items The list of items (serviceId and quantity) in the order
 * @returns An object with the lines, subtotal, adjustment, delivery charge and final total
 */
async function calculatePricing(items) {
    let minimumCharge = Number(process.env.MINIMUM_ORDER_CHARGE) || 0
    let freeDeliveryThreshold = Number(process.env.FREE_DELIVERY_THRESHOLD) || 0
    let deliveryCharge = Number(process.env.DELIVERY_CHARGE) || 0

    let lines = []
    let subtotal = 0
    for (let item of items) {
        let service = await persistence.findService(item.serviceId)
        if (service) {
            let lineTotal = service.price * item.quantity
            lines.push({
                name: service.name,
                quantity: item.quantity,
                price: service.price,
                lineTotal: lineTotal
            })
            subtotal += lineTotal
        }
    }

    let adjustment = 0
    if (subtotal < minimumCharge) {
        adjustment = minimumCharge - subtotal
    }

    let delivery = 0
    if (subtotal < freeDeliveryThreshold) {
        delivery = deliveryCharge
    }

    return {
        lines: lines,
        subtotal: subtotal,
        adjustment: adjustment,
        delivery: delivery,
        total: subtotal + adjustment + delivery
    }
}

/**
 * Get all services
 * @returns A list of Objects
 */
export async function getServices() {
    return await persistence.loadServices()
}

/**
 * Get information about a single customer
 * @param {*} cid The customer ID
 * @returns A JavaScript object representing the customer or null if the customer does not exist
 */
export async function getCustomer(cid) {
    return await persistence.findCustomer(cid)
}

/**
 * Get details about a single service
 * @param {*} sid Service ID
 * @returns A JavaScript object about the service or null if the service does not exist.
 */
export async function getService(sid) {
    return await persistence.findService(sid)
}

/**
 * Get details about a single order given the order ID
 * @param {*} oid The order ID to be found
 * @returns A JavaScript object for the order or null if the order was not found.
 */
export async function getOrder(oid) {
    return await persistence.findOrder(oid)
}

/**
 * Get the orders for a given customer along with the total of each order.
 * @param {*} cid The customer ID
 * @returns A list of Objects (order, date, status, total) or an empty list if there are none
 */
export async function getCustomerOrders(cid) {
    let orderList = await persistence.findOrdersByCustomer(cid)
    let result = []
    for (let ord of orderList) {
        let pricing = await calculatePricing(ord.items)
        result.push({
            order: ord.orderId,
            date: ord.orderDate,
            status: ord.status,
            total: pricing.total
        })
    }
    return result
}

/**
 * Attempt to update the order status to a new status level following the ordering rules.
 * The newly updated state will be written to the file if the state change is allowed.
 *
 * @param {*} order A JavaScript object representing the current state of the entire order
 * @param {*} newStatus The new state that we would like to switch to.
 * @returns true if the operation is successful, false otherwise
 */
export async function updateOrderStatus(order, newStatus) {
    let statusList = ['Received', 'Washing', 'Ready', 'Delivered']
    let currentPos = statusList.indexOf(order.status)
    let newPos = statusList.indexOf(newStatus)
    if (newPos === -1 || newPos <= currentPos) {
        return false
    }
    order.status = newStatus
    await persistence.updateOrder(order)
    return true
}

/**
 * Create a new order for a customer and save it.
 * @param {*} customerId The ID of the customer placing the order
 * @param {*} items The list of items (serviceId and quantity) in the order
 * @returns An object with the new orderId and the final total
 */
export async function createOrder(customerId, items) {
    let orderId = await persistence.getNextOrderId()

    let today = new Date()
    let orderDate = today.toISOString().substring(0, 10)

    let order = {
        orderId: orderId,
        customerId: customerId,
        orderDate: orderDate,
        status: 'Received',
        items: items
    }
    await persistence.createOrder(order)

    let pricing = await calculatePricing(items)
    return {
        orderId: orderId,
        total: pricing.total
    }
}

/**
 * Get everything needed to display the invoice for an order.
 * @param {*} order The order object
 * @returns An object with the customer name and pricing details, or null if the customer
 * or one of the services could not be found
 */
export async function getInvoice(order) {
    let customer = await persistence.findCustomer(order.customerId)
    if (!customer) {
        return null
    }
    let pricing = await calculatePricing(order.items)
    if (pricing.lines.length !== order.items.length) {
        return null
    }
    return {
        customerName: customer.name,
        pricing: pricing
    }
}
