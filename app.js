import express from 'express'
import { engine } from 'express-handlebars'
import cookieParser from 'cookie-parser'
import dotenv from 'dotenv'
import * as business from './business.js'

dotenv.config()

const app = express()
app.engine('handlebars', engine())
app.set('view engine', 'handlebars')
app.set('views', './views')

app.use(express.static('public'))
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())

/**
 * Session middleware.  Looks up the session key from the "session" cookie and stores the
 * logged in user's information in req.session (null when nobody is logged in).  Each request
 * slides the session's expiry 10 minutes forward, so the cookie is sent again with the new
 * expiry.  The user information is also put in res.locals so the layout can show the right
 * navigation menu.
 */
app.use(async (req, res, next) => {
    let sessionKey = req.cookies.session
    let session = await business.getSession(sessionKey)
    req.session = null
    if (session) {
        req.session = session.data
        res.cookie('session', sessionKey, { expires: session.expiry, httpOnly: true })
    }
    else if (sessionKey) {
        res.clearCookie('session')
    }
    res.locals.user = req.session
    res.locals.isCustomer = req.session !== null && req.session.userType === 'customer'
    res.locals.isStaff = req.session !== null && req.session.userType === 'staff'
    next()
})

/**
 * Middleware for routes only logged in customers may visit.
 */
function requireCustomer(req, res, next) {
    if (!req.session || req.session.userType !== 'customer') {
        res.redirect('/login')
        return
    }
    next()
}

/**
 * Middleware for routes only logged in shop staff may visit.  Customers and visitors who are
 * not logged in are sent to the login page.
 */
function requireStaff(req, res, next) {
    if (!req.session || req.session.userType !== 'staff') {
        res.redirect('/login')
        return
    }
    next()
}

/**
 * Landing page showing only the navigation menu from the layout.
 */
app.get('/', (req, res) => {
    res.render('home')
})

/**
 * Login form asking for an email address and password.
 */
app.get('/login', (req, res) => {
    res.render('login')
})

/**
 * Check the email address and password against the customers and staff users.  A valid user
 * gets a new session (stored in MongoDB, key stored in a cookie) and is redirected.
 */
app.post('/login', async (req, res) => {
    let body = req.body || {}
    let email = body.email
    let password = body.password
    if (typeof email !== 'string' || typeof password !== 'string' || email.trim() === '' || password === '') {
        res.render('login', { error: 'Please enter your email address and password.', email: email })
        return
    }
    email = email.trim()
    let user = await business.login(email, password)
    if (!user) {
        res.render('login', { error: 'Invalid email address or password.', email: email })
        return
    }
    let session = await business.startSession(user)
    res.cookie('session', session.sessionKey, { expires: session.expiry, httpOnly: true })
    if (user.userType === 'customer') {
        res.redirect('/customer-dashboard')
    }
    else {
        res.redirect('/staff-dashboard')
    }
})

/**
 * Log the user out by deleting their session and its cookie.
 */
app.get('/logout', async (req, res) => {
    await business.endSession(req.cookies.session)
    res.clearCookie('session')
    res.redirect('/login')
})

/**
 * Dashboard for a logged in customer showing only their own orders.
 */
app.get('/customer-dashboard', requireCustomer, async (req, res) => {
    let customer = await business.getCustomerInformation(req.session.userId)
    if (!customer) {
        res.status(404).render('message', { title: 'Customer Not Found', message: 'Your customer account no longer exists.' })
        return
    }
    res.render('customer-dashboard', { orders: customer.orders })
})

/**
 * List all laundry services and their prices.
 */
app.get('/services', async (req, res) => {
    let services = await business.getServices()
    res.render('services', { services: services })
})

/**
 * Form for finding a customer by phone number (staff only).
 */
app.get('/customer', requireStaff, (req, res) => {
    res.render('customer')
})

/**
 * Show a customer found by phone number and a summary of their orders, or a message if
 * no customer has that phone number (staff only).
 */
app.get('/find-results', requireStaff, async (req, res) => {
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
 * Staff dashboard: table of all orders with a link to update each order's status.
 */
app.get('/staff-dashboard', requireStaff, async (req, res) => {
    let orders = await business.getAllOrders()
    res.render('staff-dashboard', { orders: orders })
})

/**
 * Form for choosing a new status for one order (staff only).  The dropdown lists every status,
 * even ones that would not be accepted, and the business layer decides if the change is valid.
 */
app.get('/update-status', requireStaff, async (req, res) => {
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
 * Apply the status change, then redirect back to the staff dashboard (Post/Redirect/Get).
 * Staff only.
 */
app.post('/update-status', requireStaff, async (req, res) => {
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
    res.redirect('/staff-dashboard')
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
