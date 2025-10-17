import "dotenv/config"
import e from 'express';
import { articleViewer } from './reqhandler.js';
import { uploadArticle } from './uploadhandler.js';
import { all, lastest, wallpapers } from "./api.js";
import { getWorms } from "./worms.js"
import { getFromStorage, insertIntoStorage } from "./storage.js";
import errorPage from "../modules/error.js";
import cookieParser from 'cookie-parser'
import { register, login, logout, requireAuth, verifyWorm } from './auth.js'
import path from 'path'
import { __dirname } from "../server.js";
import { me } from './auth.js';

const routes = e.Router()
routes.use(cookieParser())

routes.get("/p/:slug", articleViewer);
routes.post("/api/articles", requireAuth, verifyWorm, uploadArticle);
// Auth endpoints
routes.post('/api/register', register)
routes.post('/api/login', login)
routes.post('/api/logout', logout)
routes.get('/api/articles/latest', lastest);
routes.post('/api/files', insertIntoStorage);
routes.get('/api/wallpapers', wallpapers)
routes.get('/api/articles/all', all);
routes.get('/f/:f', getFromStorage);
// worms list
routes.get('/api/worms', getWorms)
routes.get('/api/me', requireAuth, me)

routes.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'index.html'));

});

routes.get('/u/papers', requireAuth, verifyWorm, (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'upload-paper.html'));

});

// Simple UI to upload arbitrary files to storage
routes.get('/u/file', requireAuth, verifyWorm, (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'upload-file.html'));

});

routes.get('/p', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'papers-index.html'));

});

routes.get('/w', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'worms.html'))

})

routes.get('/a/about-us', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'about.html'))

})

routes.get('/a/wallpapers', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'wallpapers.html'))

})

routes.head('/app/health/cron_health_check', (req, res) => {
    console.log("Req HEAD ping to health check from", req.ip)
    res.setHeader("Success", "yeyeye")
    res.status(200).json({})
    
})

routes.use((req, res) => {
    res.status(404).send(errorPage(404, "Page not found."));

})

export default routes
