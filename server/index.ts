import express, { Express } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
const cors = require("cors");

dotenv.config();

const app: Express = express();
const PORT = process.env.PORT || 4000;
const routes = path.join(__dirname, 'routes');

app.use(cors());

fs.readdirSync(routes).forEach((file) => {
    if (file.endsWith('.ts')) { // api endpoint
        const routeName = file.replace('.ts', '');
        const routePath = path.join(routes, file);
        const routeModule = require(routePath);

        app.use(`/${routeName}`, routeModule.default);
    }
})

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
});