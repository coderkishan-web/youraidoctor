import express from "express"
import cors from 'cors'
import 'dotenv/config'
import { connectDB } from "./config/database.js"
import connectCloudinary from "./config/cloudinary.js"
import userRouter from "./routes/userRoute.js"
import doctorRouter from "./routes/doctorRoute.js"
import adminRouter from "./routes/adminRoute.js"
import aiRouter from "./routes/aiRoute.js"
import familyRouter from "./routes/familyRoute.js"
import reminderRouter from "./routes/reminderRoute.js"
import subscriptionRouter from "./routes/subscriptionRoute.js"

// app config
const app = express()
const port = process.env.PORT || 4000

// Connect to database (MySQL if configured, JSON fallback otherwise)
connectDB()
connectCloudinary()

// middlewares
app.use(express.json())
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:5177',
    'http://localhost:5178',
    'http://localhost:5179',
    'http://localhost:5180',
    'https://adminprescriptodr.vercel.app',
    'https://prescriptoapp-wheat.vercel.app'
  ],
  credentials: true
}))

// api endpoints
app.use("/api/user", userRouter)
app.use("/api/admin", adminRouter)
app.use("/api/doctor", doctorRouter)
app.use("/api/ai", aiRouter)
app.use("/api/family", familyRouter)
app.use("/api/reminder", reminderRouter)
app.use("/api/subscription", subscriptionRouter)

app.get("/", (req, res) => {
  res.send("API Working")
});

if (!process.env.VERCEL && !process.env.NETLIFY) {
  app.listen(port, () => console.log(`Server started on PORT:${port}`))
}

export default app
