import express, {json} from "express";
import {globalErrorHandler} from "./middlewares/handlers/GlobalErrorHandler";
import userRouter from "./api/UserRouter";
import adminRouter from "./api/AdminRouter";
import {sendMail} from "./utils/email";
import cors from 'cors'
import productRouter from "./api/ProductRouter";
import countryRouter from "./api/CountryRouter";
import deviceTypeRouter from "./api/DeviceTypeRouter";
import gameStatusRouter from "./api/GameStatusRouter";
import healthCheckinRouter from "./api/HealthCheckinRouter";

console.log('ENV:' + process.env.NODE_ENV);

const app = express();
const port = process.env.PORT || 3000;

// JSON Parser Middleware
app.use(cors())
app.use(json());

// Routers Middleware
app.use('/user', userRouter);
app.use('/admin', adminRouter);
app.use('/product', productRouter);
app.use('/country', countryRouter);
app.use('/device_type', deviceTypeRouter);
app.use('/game_status', gameStatusRouter);
app.use('/health_checkin', healthCheckinRouter);

// Error Hadler Middleware
app.use(globalErrorHandler);


app.listen(port, () => {
    console.log('Server listening on port: ' + port);
})
