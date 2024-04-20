import express, { json } from "express";
import { globalErrorHandler } from "./middlewares/handlers/GlobalErrorHandler";
import userRouter from "./api/UserRouter";
import adminRouter from "./api/AdminRouter";
import { sendMail } from "./utils/email";
import cors from 'cors'
import productRouter from "./api/ProductRouter";

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

// Error Hadler Middleware
app.use(globalErrorHandler);


app.listen(port, () => {
    console.log('Server listening on port: ' + port);
})