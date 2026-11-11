import express from 'express'
import { engine } from 'express-handlebars'
import dotenv from 'dotenv'
import * as business from './business.js'

dotenv.config()

const app = express()
app.engine('handlebars', engine())
app.set('view engine', 'handlebars')
app.set('views', './views')

app.use(express.static('public'))
app.use(express.urlencoded({ extended: false }))

/**
 * Landing page showing only the navigation menu from the layout.
 */
app.get('/', (req, res) => {
    res.render('home')
})

/**
 * List all laundry services and their prices.
 */
app.get('/services', async (req, res) => {
    let services = await business.getServices()
    res.render('services', { services: services })
})

/**
 * Form for finding a customer by customer ID.
 */
app.get('/customer', (req, res) => {
    res.render('customer')
})

/**
 * Show a customer found by phone number and a summary of their orders, or a message if
 * no customer has that phone number.
 */
app.get('/find-results', async (req, res) => {
    let phone = req.query.phone
    if (typeof phone !== 'string' || phone.trim() === '') {
        res.render('customer', { error: 'Please enter a phone number.' })
        return
    }
    phone = phone.trim()
    let customer = await business.getCustomerByPhone(phone)
    if (!customer) {
        res.render('customer', { error: `No customer has the phone number ${phone}.`, phone: phone })
        return
    }
    res.render('customer-results', { customer: customer })
})

/**
 * Table of all orders with a link to update each order's status.
 */
app.get('/orders', async (req, res) => {
    let orders = await business.getAllOrders()
    res.render('orders', { orders: orders })
})

/**
 * Form for choosing a new status for one order.  The dropdown lists every status, even
 * ones that would not be accepted, and the business layer decides if the change is valid.
 */
app.get('/update-status', async (req, res) => {
    let orderId = req.query.order
    let order = null
    if (typeof orderId === 'string') {
        order = await business.getOrderDetails(orderId)
    }
    if (!order) {
        res.status(404).render('message', { title: 'Order Not Found', message: 'The requested order does not exist.' })
        return
    }
    let statuses = []
    for (let s of business.getStatusList()) {
        statuses.push({ name: s, selected: s === order.status })
    }
    res.render('update-status', { order: order, statuses: statuses })
})

/**
 * Apply the status change, then redirect back to the orders table (Post/Redirect/Get).
 */
app.post('/update-status', async (req, res) => {
    let body = req.body || {}
    let orderId = body.order
    let newStatus = body.status
    if (typeof orderId !== 'string' || typeof newStatus !== 'string') {
        res.send('Invalid State')
        return
    }
    let success = await business.updateOrderStatus(orderId, newStatus)
    if (!success) {
        res.send('Invalid State')
        return
    }
    res.redirect('/orders')
})

/**
 * Any URL that does not match a route.
 */
app.use((req, res) => {
    res.status(404).render('message', { title: 'Page Not Found', message: 'The page you requested does not exist.' })
})

/**
 * Errors thrown inside a route (for example if the database is unavailable) are shown as a
 * message so the application keeps running.
 */
app.use((err, req, res, next) => {
    console.error(err)
    res.status(500).render('message', { title: 'Error', message: 'Something went wrong. Please try again later.' })
})

const port = Number(process.env.PORT) || 8000
app.listen(port, () => {
    console.log(`Server started on http://127.0.0.1:${port}`)
})
