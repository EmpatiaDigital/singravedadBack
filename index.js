const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
app.use(cors());
app.use(express.json());
app.use('/api/test', (req, res) => {
  res.send('Hola Backend 🚀');
});
require("dotenv").config();

const authRoute = require("./routes/authRoute");
const uploadRoute = require("./routes/uploadRoute");
const eventsRoute = require("./routes/eventsRoute");
const musicRoute = require('./routes/musicRoute');
const app = express();

// Middlewares

// Rutas
app.use("/api/auth", authRoute);
app.use("/api/upload", uploadRoute);
app.use("/api/eventos", eventsRoute);
app.use('/api/music', musicRoute); 

// MongoDB
mongoose.connect('mongodb+srv://singravedad777:singravedad777@cluster0.ri8pn3e.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
  .then(() => console.log("Conectado a MongoDB"))
  .catch(err => console.error("Error en MongoDB", err));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));





