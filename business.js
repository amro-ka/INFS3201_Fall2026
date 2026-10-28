import * as persistence from './persistence.js'


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

export async function getCustomerInformation(cid) {
    let customer = await persistence.getCustomerInformation(cid)
    if (!customer) {
        return null
    }
    let orders = await persistence.getCustomerOrders(cid)
    customer.orders = orders
    return customer
}

export async function getOrderDetails(oid) {
    return await persistence.getOrderDetails(oid)
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
    let statusList = ['Received', 'Washing', 'Ready', 'Delivered']
    let order = await persistence.getOrderDetails(oid)
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
        order: orderDetails.orderId,
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