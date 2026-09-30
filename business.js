
import * as persistence from './persistence.js'

export async function getServices() {
    let services = await persistence.loadServices()
    return services
}

export async function getCustomerInfo(cid) {
    return await persistence.getCustomer(cid)
}

export async function getServicePrice(sid) {
    return await persistence.getServicePrice(sid)
}

export async function getService(sid) {
    return await persistence.getService(sid)
}


export async function saveOrders(orderList) {
    await persistence.updateOrders(orderList)
}

export async function getOrderDetails(oid) {
    let orderList = await persistence.getOrderDetails(oid)
    return orderList
}

export async function updateOrderStatus(oid, newStatus) {
    let statusList = ['Received', 'Washing', 'Ready', 'Delivered']
    let currentPos = statusList.indexOf(order.status)
    let newPos = statusList.indexOf(newStatus)
    if (newPos === -1 || newPos <= currentPos) {
        return false
    }
    let orderList = persistence.getOrderList()
    for (let ord of orderList) {
        if (ord.orderId == order.orderId) {
            ord.status = newStatus
            break
        }
    }
    persistence.updateOrders
}

export async function getCustomerOrders(cid) {
    const orderList = await persistence.findOrdersByCustomer(cid)
    const result = []

    for (const ord of orderList) {
        let total = 0
        for (const item of ord.items) {
            const price = await getServicePrice(item.serviceId)
            if(price !== null){
                total += price * item.quantity
            }
            
        }
        result.push({
            order: ord.orderId,
            date: ord.orderDate,
            status: ord.status,
            total: total
        })
    }

    return result
}

