import promptSync from 'prompt-sync'
import * as business from './business.js'

const prompt = promptSync()

/**
 * Display the laundry services in a nicely formatted table.
 */
async function showLaundryServices() {
    let services = await business.getServices()

    console.log('\n')
    console.log('Service ID Service                    Unit    Price')
    console.log('---------- -------------------------- ------- ------')
    for (let s of services) {
        console.log(`${s.serviceId.padEnd(10)} ${s.name.padEnd(26)} ${s.unit.padEnd(5)} ${s.price.toFixed(2).padStart(8)}`)
    }
    console.log('\n')
}

/**
 * Display a list of orders per customer in a structure way
 * @returns nothing
 */
async function showCustomerOrders() {
    let customerId = prompt('Enter customer ID: ')
    let customer = await business.getCustomer(customerId)
    if (!customer) {
        console.log("customer not found")
        return
    }
    console.log(`Orders for ${customer.name}`)
    let orders = await business.getCustomerOrders(customerId)
    console.log('Order ID  Order Date  Status      Total')
    console.log('--------  ----------  ----------- -----')
    for (let ord of orders) {
        console.log(`${ord.order.padEnd(8)}  ${ord.date.padEnd(10)}  ${ord.status.padEnd(11)} ${ord.total.toFixed(2).padStart(5)}`)
    }
}

/**
 * Interact with the customer to create a new order then save it to the storage.
 * @returns nothing
 */
async function createNewOrder() {
    let customerId = prompt('Enter customer ID: ')
    let customer = await business.getCustomer(customerId)
    if (!customer) {
        console.log('**** customer not found')
        return
    }

    let items = []
    while (true) {
        let serviceId = prompt('Enter service ID (blank to finish): ')
        if (serviceId == '') {
            break
        }

        let service = await business.getService(serviceId)
        if (!service) {
            console.log('**** service not found')
            continue
        }

        let quantity = Number(prompt('Enter quantity: '))
        items.push({
            serviceId: serviceId,
            quantity: quantity
        })
    }

    if (items.length == 0) {
        console.log('**** order must contain at least one service')
        return
    }

    let result = await business.createOrder(customerId, items)
    console.log(`Order ${result.orderId} created`)
    console.log(`Total price: ${result.total.toFixed(2)} QAR`)
}

/**
 * Interact with the customer to determine the current status of an order and update it with a
 * new status if allowed.
 */
async function changeOrderStatus() {
    let oid = prompt('Enter order ID: ')
    let details = await business.getOrder(oid)
    if (!details) {
        console.log('**** order not found')
        return
    }
    console.log(`Current status: ${details.status}`)
    let newStatus = prompt('Enter new status: ')
    let result = await business.updateOrderStatus(details, newStatus)
    if (!result) {
        console.log('New status not accepted')
    }
    else {
        console.log('Order status updated')
    }
}

/**
 * Ask for an order ID and display the invoice for that order.
 */
async function viewInvoice() {
    let oid = prompt('Enter order ID: ')
    let order = await business.getOrder(oid)
    if (!order) {
        console.log('**** order not found')
        return
    }
    let invoice = await business.getInvoice(order)
    if (!invoice) {
        console.log('**** customer or service for this order not found')
        return
    }
    let pricing = invoice.pricing

    console.log(`\nOrder: ${order.orderId}        Date: ${order.orderDate}        Status: ${order.status}`)
    console.log(`Customer: ${invoice.customerName}\n`)
    console.log('Service                   Qty           Price Line Total')
    console.log('------------------------- -------- ---------- ----------')
    for (let line of pricing.lines) {
        console.log(`${line.name.padEnd(25)} ${String(line.quantity).padEnd(8)} ${line.price.toFixed(2).padStart(10)} ${line.lineTotal.toFixed(2).padStart(10)}`)
    }
    console.log('')
    console.log(`Service subtotal:${pricing.subtotal.toFixed(2).padStart(39)}`)
    console.log(`Minimum-order adjustment:${pricing.adjustment.toFixed(2).padStart(31)}`)
    console.log(`Delivery charge:${pricing.delivery.toFixed(2).padStart(40)}`)
    console.log(`Final total:${pricing.total.toFixed(2).padStart(44)} QAR\n`)
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
        console.log('5. View invoice')
        console.log('6. Exit\n')
        let selection = Number(prompt('What is your choice> '))
        if (selection >= 1 && selection <= 6) {
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
    else if (option === 5) {
        await viewInvoice()
    }
    else {
        break
    }
}
console.log("Thank you")
