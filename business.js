import * as persistence from './persistence.js'

// The order statuses in the only sequence an order is allowed to move through.
const statusList = ['Received', 'Washing', 'Ready', 'Delivered']

/**
 * Get every possible order status in order.
 * @returns A list of status names
 */
export function getStatusList() {
    return statusList
}


/**
 * Get all services
 * @returns A list of Objects
 */
export async function getServices() {
    return await persistence.getServices()
}

export async function getService(serviceId) {
    return await persistence.getService(serviceId)
}

/**
 * Get a customer along with a summary of each of their orders.
 * @param {*} cid The customer ID
 * @returns The customer object with an orders list, or null if the customer does not exist
 */
export async function getCustomerInformation(cid) {
    let customer = await persistence.getCustomerInformation(cid)
    if (!customer) {
        return null
    }
    return await addOrderSummaries(customer)
}

/**
 * Find a customer by phone number along with a summary of each of their orders.
 * @param {*} phone The customer's phone number
 * @returns The customer object with an orders list, or null if no customer has that phone number
 */
export async function getCustomerByPhone(phone) {
    let customer = await persistence.getCustomerByPhone(phone)
    if (!customer) {
        return null
    }
    return await addOrderSummaries(customer)
}

/**
 * Attach a summary (order, date, status, total) of each of the customer's orders.
 * @param {*} customer The customer object read from the database
 * @returns The same customer object with an orders list added
 */
async function addOrderSummaries(customer) {
    let orders = await persistence.getCustomerOrders(customer._id)
    let summaries = []
    for (let ord of orders) {
        summaries.push({
            order: String(ord._id),
            date: ord.orderDate,
            status: ord.status,
            total: await computeItemsTotal(ord.items)
        })
    }
    customer.orders = summaries
    return customer
}

/**
 * Add up the price of each service multiplied by its quantity.
 * @param {*} items The list of {serviceId, quantity} items in an order
 * @returns The total as a Number
 */
async function computeItemsTotal(items) {
    let total = 0
    for (let it of items) {
        let service = await getService(it.serviceId)
        if (service) {
            total += service.price * it.quantity
        }
    }
    return total
}

/**
 * Get a single order.
 * @param {*} oid The order's _id as a string
 * @returns The order object with its _id converted to a string, or null if it does not exist
 */
export async function getOrderDetails(oid) {
    let order = await persistence.getOrderDetails(oid)
    if (!order) {
        return null
    }
    order._id = String(order._id)
    return order
}

/**
 * Get every order in the system along with the name of the customer who placed it.
 * @returns A list of {orderId, customer, orderDate, status} objects where orderId is the
 * order's _id as a string
 */
export async function getAllOrders() {
    let orders = await persistence.getAllOrders()
    let customerIds = []
    for (let ord of orders) {
        if (ord.customerId && !customerIds.some(id => String(id) === String(ord.customerId))) {
            customerIds.push(ord.customerId)
        }
    }
    let customers = await persistence.getCustomersByIds(customerIds)
    let names = {}
    for (let c of customers) {
        names[String(c._id)] = c.name
    }

    let result = []
    for (let ord of orders) {
        result.push({
            orderId: String(ord._id),
            customer: names[String(ord.customerId)] || 'Unknown customer',
            orderDate: ord.orderDate,
            status: ord.status
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
export async function updateOrderStatus(oid, newStatus) {
    let order = await persistence.getOrderDetails(oid)
    if (!order) {
        return false
    }
    let currentPos = statusList.indexOf(order.status)
    let newPos = statusList.indexOf(newStatus)
    if (newPos === -1 || newPos <= currentPos) {
        return false
    }
    await persistence.updateOrderStatus(oid, newStatus)
    return true
}

async function computeOrderTotal(orderItems) {
    let total = 0
    for (let item of orderItems) {
        let service = await getService(item.serviceId)
        if (service) {
            total += service.price * item.quantity
        }
    }
    if (total < 25) {
        total = 25
    }

    let delivery = 10
    if (total > 50) {
        delivery = 0
    }
    total += delivery
    return total
}

/**
 * Interact with the customer to create a new order then save it to the storage.
 * @returns 
 */
export async function createNewOrder(customerId, orderItems) {
    let customer = await getCustomerInformation(customerId)
    if (!customer) {
        return null
    }

    let totals = await computeSubTotals(orderItems)
    let today = new Date()
    let orderDate = today.toISOString().substring(0, 10)

    let order = {
        customerId: customerId,
        orderDate: orderDate,
        status: 'Received',
        items: orderItems,
        total: totals.total
    }
    return await persistence.createOrder(order)
}

function computeSubTotals(items) {
    const minimum_charge = Number(process.env.MINIMUM_ORDER_CHARGE) || 0
    const free_delivery_threshold = Number(process.env.FREE_DELIVERY_THRESHOLD) || 0
    const delivery_fee = Number(process.env.DELIVERY_CHARGE) || 0
    let subTotal = 0
    for (let it of items) {
        subTotal += it.quantity*it.price
    }
    let minOrderAdjustment = 0
    if (minimum_charge) {
        minOrderAdjustment = minimum_charge - subTotal
    }
    let deliveryCharge = delivery_fee
    if (subTotal > free_delivery_threshold) {
        deliveryCharge = 0
    }
    let total = subTotal + minOrderAdjustment + deliveryCharge

    return {
        subTotal,
        minOrderAdjustment,
        deliveryCharge,
        total
    }
}

export async function generateInvoice(orderId) {
    let orderDetails = await persistence.getOrderDetails(orderId)
    if (!orderDetails) {
        return null
    }
    let customerDetails = await persistence.getCustomerInformation(orderDetails.customerId)
    let serviceItems = []
    for (let it of orderDetails.items) {
        let service = await getService(it.serviceId)
        serviceItems.push({
            service: service.name,
            quantity: it.quantity,
            price: service.price,
            lineTotal: it.quantity*service.price
        })
    }
    let totals = computeSubTotals(serviceItems)
    return {
        order: String(orderDetails._id),
        date: orderDetails.orderDate,
        status: orderDetails.status,
        customer: customerDetails.name,
        serviceItems: serviceItems,
        subTotal: totals.subTotal,
        minimumAdjustment: totals.minOrderAdjustment,
        delivery: totals.deliveryCharge,
        total: totals.total
    }
}