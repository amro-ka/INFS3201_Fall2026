/**
 * @file INFS3201 - Assignment 1
 * Menu-driven console application for a laundry shop. Data is stored in
 * customers.json, services.json and orders.json.
 * @author Amro Ansari, SID: 60311994, Section 8, Lab Instructor: Ahmed Mansour
 */
import promptSync from 'prompt-sync';
import fs from 'fs/promises';

const prompt = promptSync();

/**
 * Reads the laundry services from services.json.
 * @async
 * @returns {Promise<Array<Object>>} list of service objects
 */
async function loadServices() {
    let services = await fs.readFile('services.json', 'utf8');
    return JSON.parse(services);
}

/**
 * Reads all orders from orders.json.
 * @async
 * @returns {Promise<Array<Object>>} list of order objects
 */
async function loadOrders() {
    let orders = await fs.readFile('orders.json', 'utf8');
    return JSON.parse(orders);
}

/**
 * Writes the full list of orders to orders.json (4-space indented JSON).
 * @async
 * @param {Array<Object>} orders - the complete list of orders to save
 * @returns {Promise<void>}
 */
async function saveOrders(orders) {
    await fs.writeFile('orders.json', JSON.stringify(orders, null, 4), 'utf8');
}

/**
 * Reads all customers from customers.json.
 * @async
 * @returns {Promise<Array<Object>>} list of customer objects
 */
async function loadCustomers() {
    let customers = await fs.readFile('customers.json', 'utf8');
    return JSON.parse(customers);
}

/**
 * Changes the status of an order and saves the updated orders.
 * @async
 * @param {Object} order - the order to update (an object inside the orders array)
 * @param {Array<Object>} orders - the full list of orders, saved after the change
 * @param {string} status - the new status (Received, Washing, Ready or Delivered)
 * @returns {Promise<void>}
 */
async function updateOrderStatus(order, orders, status) {
    order.status = status;
    await saveOrders(orders);
}

/**
 * Gives the position of a status in the sequence Received -> Washing -> Ready -> Delivered.
 * @param {string} status - the status to look up
 * @returns {number} position from 0 to 3, or -1 if the status is not valid
 */
function getStatusPosition(status) {
    let statuses = ['Received', 'Washing', 'Ready', 'Delivered'];
    for (let i = 0; i < statuses.length; i++) {
        if (statuses[i] === status) {
            return i;
        }
    }
    return -1;
}

/**
 * Checks whether an order is allowed to move from its current status to a new one.
 * Orders can only move forward (Received -> Washing -> Ready -> Delivered).
 * @param {string} currentStatus - the status the order has now
 * @param {string} newStatus - the status the user wants to set
 * @returns {boolean} true if the change is allowed, otherwise false
 */
function validateStateTransition(currentStatus, newStatus) {
    let newPosition = getStatusPosition(newStatus);
    if (newPosition === -1) {
        return false;
    }
    return newPosition > getStatusPosition(currentStatus);
}

/**
 * Calculates the total price of an order using the service prices.
 * @param {Object} order - the order whose items will be priced
 * @param {Array<Object>} services - list of all services
 * @returns {number} total price of the order in QAR
 */
function calculateTotalCost(order, services) {
    let total = 0;
    for (let i = 0; i < order.items.length; i++) {
        let item = order.items[i];
        let service = verifyServiceId(item.serviceId, services);
        if (service !== null) {
            total = total + service.price * item.quantity;
        }
    }
    return total;
}

/**
 * Builds the next order ID by finding the highest existing ID and adding 1 (e.g. O010 -> O011).
 * @param {Array<Object>} orders - list of existing orders
 * @returns {string} the next order ID
 */
function getNextOrderId(orders) {
    let highest = 0;
    for (let i = 0; i < orders.length; i++) {
        let order = orders[i];
        let number = Number(order.orderId.substring(1));
        if (number > highest) {
            highest = number;
        }
    }
    return 'O' + String(highest + 1).padStart(3, '0');
}

/**
 * Gets today's date as a string in YYYY-MM-DD format.
 * @returns {string} today's date
 */
function getTodayDate() {
    let today = new Date();
    let year = today.getFullYear();
    let month = String(today.getMonth() + 1).padStart(2, '0');
    let day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Creates a new order for a customer, asks the user for the services to add,
 * and saves it to orders.json.
 * @async
 * @param {string} customer - ID of the customer placing the order
 * @param {Array<Object>} services - list of all services
 * @param {Array<Object>} orders - list of existing orders (used to generate the next ID)
 * @returns {Promise<void>}
 */
async function generateOrder(customer, services, orders) {
    let newOrder = {
        orderId: getNextOrderId(orders),
        customerId: customer,
        orderDate: getTodayDate(),
        status: 'Received',
        items: []
    };

    console.log("Service ID  Service                    Unit      Price");
    console.log("----------  -------------------------  --------  --------");
    for (let i = 0; i < services.length; i++) {
        let service = services[i];
        let id = service.serviceId.padEnd(10);
        let name = service.name.padEnd(25);
        let unit = service.unit.padEnd(8);
        let price = service.price.toFixed(2);
        console.log(`${id}  ${name}  ${unit}  ${price}`);
    }

    let answer = "start";
    while (answer !== "") {
        answer = prompt("Enter service ID (blank to finish): ");
        if (answer !== "") {
            let service = verifyServiceId(answer, services);
            if (service === null) {
                console.log("Service ID not found.");
            } else {
                let quantity = Number(prompt("Enter quantity: "));
                if (Number.isNaN(quantity) || quantity <= 0) {
                    console.log("Quantity must be a number greater than 0.");
                } else {
                    newOrder.items.push({
                        serviceId: service.serviceId,
                        quantity: quantity
                    });
                }
            }
        }
    }

    if (newOrder.items.length === 0) {
        console.log("No services added. Order was not created.");
    } else {
        orders.push(newOrder);
        await saveOrders(orders);
        console.log(`Order ${newOrder.orderId} created`);
        console.log(`Total price: ${calculateTotalCost(newOrder, services).toFixed(2)} QAR`);
    }
}

/**
 * Finds a customer by ID.
 * @param {string} customerID - the customer ID to search for
 * @param {Array<Object>} customers - list of all customers
 * @returns {Object|null} the matching customer, or null if not found
 */
function verifyCustomerId(customerID, customers) {
    for (let i = 0; i < customers.length; i++) {
        let customer = customers[i];
        if (customer.customerId === customerID) {
            return customer;
        }
    }
    return null;
}

/**
 * Finds a service by ID.
 * @param {string} serviceID - the service ID to search for
 * @param {Array<Object>} services - list of all services
 * @returns {Object|null} the matching service, or null if not found
 */
function verifyServiceId(serviceID, services) {
    for (let i = 0; i < services.length; i++) {
        let service = services[i];
        if (service.serviceId === serviceID) {
            return service;
        }
    }
    return null;
}

/**
 * Finds an order by ID.
 * @param {string} orderID - the order ID to search for
 * @param {Array<Object>} orders - list of all orders
 * @returns {Object|null} the matching order, or null if not found
 */
function verifyOrderId(orderID, orders) {
    for (let i = 0; i < orders.length; i++) {
        let order = orders[i];
        if (order.orderId === orderID) {
            return order;
        }
    }
    return null;
}

/**
 * Shows the menu and runs the selected option until the user chooses Exit.
 * @async
 * @returns {Promise<void>}
 */
async function main() {
    let option = 0;
    while (option !== 5) {
        console.log("1. Show Laundry Services");
        console.log("2. View Customer Orders");
        console.log("3. Update Order Status");
        console.log("4. Create New Order");
        console.log("5. Exit");
        option = Number.parseInt(prompt("Enter your choice: "));

        if (option === 1) {
            // Show laundry services
            let services = await loadServices();
            console.log("Service ID  Service                    Unit      Price");
            console.log("----------  -------------------------  --------  --------");
            for (let i = 0; i < services.length; i++) {
                let service = services[i];
                let id = service.serviceId.padEnd(10);
                let name = service.name.padEnd(25);
                let unit = service.unit.padEnd(8);
                let price = service.price.toFixed(2);
                console.log(`${id}  ${name}  ${unit}  ${price}`);
            }
        } else if (option === 2) {
            // View customer orders
            let customers = await loadCustomers();
            let customerId = prompt("Enter Customer ID: ");

            let isCustomerFound = false;
            for (let i = 0; i < customers.length; i++) {
                let customer = customers[i];

                if (customer.customerId === customerId) {
                    isCustomerFound = true;
                    console.log(`Orders for ${customer.name}`);
                    console.log("Order ID  Order Date  Status        Total");
                    console.log("--------  ----------  ---------  --------");
                    let orders = await loadOrders();
                    let services = await loadServices();

                    for (let j = 0; j < orders.length; j++) {
                        let order = orders[j];
                        if (order.customerId === customerId) {
                            let id = order.orderId.padEnd(8);
                            let status = order.status.padEnd(9);
                            let total = calculateTotalCost(order, services).toFixed(2).padStart(8);
                            console.log(`${id}  ${order.orderDate}  ${status}  ${total}`);
                        }
                    }
                }
            }
            if (!isCustomerFound) {
                console.log("Customer ID not found.");
            }
        } else if (option === 3) {
            // Update order status
            let orders = await loadOrders();
            let orderId = prompt("Enter Order ID: ");
            let orderVerification = verifyOrderId(orderId, orders);
            if (orderVerification === null) {
                console.log("Order ID not found.");
            } else {
                console.log(`Current status: ${orderVerification.status}`);
                let newStatus = prompt("Enter new status (Received, Washing, Ready, Delivered): ");
                if (!validateStateTransition(orderVerification.status, newStatus)) {
                    console.log("New status not accepted");
                } else {
                    await updateOrderStatus(orderVerification, orders, newStatus);
                    console.log("Order status updated");
                }
            }
        } else if (option === 4) {
            // Create new order
            let customers = await loadCustomers();
            let customerId = prompt("Enter Customer ID: ");
            if (verifyCustomerId(customerId, customers) === null) {
                console.log("Customer ID not found.");
            } else {
                let orders = await loadOrders();
                let services = await loadServices();
                await generateOrder(customerId, services, orders);
            }
        } else if (option === 5) {
            console.log("Exiting the program.");
        } else {
            console.log("Invalid option. Please try again.");
        }
    }
}

main();
