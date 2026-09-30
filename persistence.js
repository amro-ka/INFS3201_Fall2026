import fs from 'fs/promises'

async function loadOrders() {
    let orders = await fs.readFile('orders.json')
    let result =  JSON.parse(orders)
    return result
}

async function loadCustomers() {
    let customers = await fs.readFile('customers.json')
    let result = JSON.parse(customers)
    return result
}

export async function loadServices() {
    let services = await fs.readFile('services.json')
    let result = JSON.parse(services)
    return result
}

export async function updateOrders(orders) {
    await fs.writeFile('orders.json', JSON.stringify(orders, null, 4))
}

export async function getCustomer(cid) {
    let customerList = await loadCustomers()
    for (let c of customerList) {
        if (c.customerId === cid) {
            return c
        }
    }
    return null
}

export async function updateOrder(order) {
    const orderList = await loadOrders()
    let found = false

    for (let i = 0; i < orderList.length; i++) {
        if (orderList[i].orderId === order.orderId) {
            orderList[i] = order
            found = true
            break
        }
    }

    if (!found) {
        return false
    }

    await updateOrders(orderList)
    return true
}

export async function getService(sid) {
    let serviceList = await loadServices()
    for (let s of serviceList) {
        if (s.serviceId == sid) {
            return s
        }
    }
    return null
}

export async function getServicePrice(sid) {
    let serviceList = await loadServices()
    for (let s of serviceList) {
        if (s.serviceId == sid) {
            return s.price
        }
    }
    return null
}

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

export async function getOrderDetails(oid) {
    let orderList = await loadOrders()
    for (let ord of orderList) {
        if (ord.orderId === oid) {
            return ord
        }
    }
    return null
}
