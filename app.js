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
