import express, {json} from "express";
import {globalErrorHandler} from "./middlewares/handlers/GlobalErrorHandler";
import userRouter from "./api/UserRouter";
import adminRouter from "./api/AdminRouter";
import {sendMail} from "./utils/email";
import cors from 'cors'
import productRouter from "./api/ProductRouter";
import ticketStatusRouter from "./api/TicketStatusRoutern";
import countryRouter from "./api/CountryRouter";
import deviceTypeRouter from "./api/DeviceTypeRouter";
import gameStatusRouter from "./api/GameStatusRouter";
import healthCheckinRouter from "./api/HealthCheckinRouter";
import lockTypeRouter from "./api/LockTypeRouter";
import messageRouter from "./api/MessageRouter";
import pauseGameRouter from "./api/PauseGameRouter";
import ruleRouter from "./api/RuleRouter";
import StoryStatusRouter from "./api/StoryStatusRouter";

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

// tickets 
app.use('/ticket_status', ticketStatusRouter); 

// --------------------------------------------


// look up tables 
app.use('/country', countryRouter); 
app.use('/device_type', deviceTypeRouter); 
app.use('/game_status', gameStatusRouter); 
app.use('/health_checkin', healthCheckinRouter);
app.use('/lock_type', lockTypeRouter);
app.use('/message', messageRouter);
app.use('/pause_game', pauseGameRouter);
app.use('/rule', ruleRouter);
app.use('/story_status', StoryStatusRouter);
// --------------------------------------------

// Error Hadler Middleware
app.use(globalErrorHandler);


app.listen(port, () => {
    console.log('Server listening on port: ' + port);
})
