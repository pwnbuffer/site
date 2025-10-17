import e from "express";
import cors from 'cors';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import fs from 'fs';

export const __filename = fileURLToPath(import.meta.url);
export const __dirname = dirname(__filename);
if (!(fs.existsSync(path.join(__dirname, "_db")))) {
    fs.mkdirSync(path.join(__dirname, "_db"))
    
}

const app = e()
app.use(cors());
app.use(e.json());
app.use('/', e.static(path.join(__dirname, 'public')));

import routes from "./controllers/routes.js";
import { initDb } from "./controllers/db.js";
import errorPage from "./modules/error.js";

initDb()
app.use(routes)

app.head('/app/health/cron_health_check', (req, res) => {
    res.status(200).json({ you: req.ip, success: true })
    
})

app.listen("9999", () => {
    console.log("LISTENING IN PORT 9999: http://0.0.0.0:9999")

})
