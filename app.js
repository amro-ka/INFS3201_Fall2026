import promptSync from 'prompt-sync'
import fs from 'fs/promises'
const prompt = promptSync()

/**
 * Get all services
 * @returns A list of Objects
 */
async function getServices() {
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
 * Display the laundry services in a nicely formatted table.
 */
async function showLaundryServices() {
    let services = await getServices()

    console.log('\n')
    console.log('Service ID Service                    Unit    Price')
    console.log('---------- -------------------------- ------- ------')
    for (let s of services) {
        console.log(`${s.serviceId.padEnd(10)} ${s.name.padEnd(26)} ${s.unit.padEnd(5)} ${s.price.toFixed(2).padStart(8)}`)
    }
    console.log('\n')
}

/**
 * Get information about a single customer
 * @param {*} cid The customer ID
 * @returns A JavaScript object representing the customer or null if the customer does not exist
 */
async function getCustomerInformation(cid) {
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
 * Get details about a single service
 * @param {*} sid Service ID
 * @returns A JavaScript object about the service or null is the service does not exist.
 */
async function getService(sid) {
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
 * Get the orders for a given customer.
 * @param {*} cid The customer ID
 * @returns A list of Objects representing the orders for a customer or an empty list if there are none 
 * or the customer could not be found.
 */
async function getCustomerOrders(cid) {
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
async function getOrderDetails(oid) {
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
async function updateOrderStatus(order, newStatus) {
    let statusList = ['Received', 'Washing', 'Ready', 'Delivered']
    let currentPos = statusList.indexOf(order.status)
    let newPos = statusList.indexOf(newStatus)
    if (newPos === -1 || newPos <= currentPos) {
        return false
    }
    let raw = await fs.readFile('orders.json')
    let orderList = JSON.parse(raw)
    for (let ord of orderList) {
        if (ord.orderId == order.orderId) {
            ord.status = newStatus
            break
        }
    }
    let result = JSON.stringify(orderList, null, 4)
    await fs.writeFile('orders_new.json', result)
    return true
}

/**
 * Display a list of orders per customer in a structure way
 * @returns nothing
 */
async function showCustomerOrders() {
    let customerId = prompt('Enter customer ID: ')
    let customer = await getCustomerInformation(customerId)
    if (!customer) {
        console.log("**** customer not found")
        return
    }
    console.log(`Orders for ${customer.name}`)
    let orders = await getCustomerOrders(customerId)
    console.log('Order ID  Order Date  Status      Total')
    console.log('--------  ----------  ----------- -----')
    for (let ord of orders) {
        console.log(`${ord.order.padEnd(8)}  ${ord.date.padEnd(10)}  ${ord.status.padEnd(11)} ${ord.total.toFixed(2).padStart(5)}`)
    }
}

/**
 * Interact with the customer to create a new order then save it to the storage.
 * @returns 
 */
async function createNewOrder() {
    let customerId = prompt('Enter customer ID: ')
    let customer = await getCustomerInformation(customerId)
    if (!customer) {
        console.log('**** customer not found')
        return
    }

    let items = []
    let total = 0
    while (true) {
        let serviceId = prompt('Enter service ID (blank to finish): ')
        if (serviceId == '') {
            break
        }

        let service = await getService(serviceId)
        if (!service) {
            console.log('**** service not found')
            continue
        }

        let quantity = Number(prompt('Enter quantity: '))
        items.push({
            serviceId: serviceId,
            quantity: quantity
        })

        total += service.price * quantity
    }

    if (items.length == 0) {
        console.log('**** order must contain at least one service')
        return
    }

    let orderId = await getNextOrderId()

    let today = new Date()
    let orderDate = today.toISOString().substring(0, 10)

    let order = {
        orderId: orderId,
        customerId: customerId,
        orderDate: orderDate,
        status: 'Received',
        items: items
    }

    let orders = await getOrders()
    orders.push(order)
    await saveOrders(orders)

    console.log(`Order ${orderId} created`)
    console.log(`Total price: ${total.toFixed(2)} QAR`)
}

/**
 * Interact with the customer to determine the current status of an order and update it with a 
 * new status if allowed.
 */
async function changeOrderStatus() {
    let oid = prompt('Enter order ID: ')
    let details = await getOrderDetails(oid)
    console.log(`Current status: ${details.status}`)
    let newStatus = prompt('Enter new status: ')
    let result = await updateOrderStatus(details, newStatus)
    if (!result) {
        console.log('New status not accepted')
    }
    else {
        console.log('Status updated')
    }
}

/**
 * Display the menu to the user and wait for their input.  If the input is invalid the function
 * displays a message and prompts again.  If the user enters a valid value then the function stops and
 * returns the selection number.
 * @returns A valid selection number.
 */
function showMenu() {
    while (true) {
        console.log('1. Show laundry services')
        console.log('2. View customer orders')
        console.log('3. Update order status')
        console.log('4. Create new order')
        console.log('5. Exit\n')
        let selection = Number(prompt('What is your choice> '))
        if (selection >= 1 && selection <= 5) {
            return selection
        }
        console.log("*** Invalid input.. try again! ***")
    }
}


while (true) {
    let option = showMenu()
    if (option === 1) {
        await showLaundryServices()
    }
    else if (option === 2) {
        await showCustomerOrders()
    }
    else if (option === 3) {
        await changeOrderStatus()
    }
    else if (option === 4) {
        await createNewOrder()
    }
    else {
        break
    }
}
console.log("Thank you")