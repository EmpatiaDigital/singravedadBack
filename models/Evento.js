// models/Evento.js
const mongoose = require("mongoose");

const eventoSchema = new mongoose.Schema({
  titulo: { type: String, required: true },
  descripcion: { type: String },
  fecha: { type: String, required: true }, // podés cambiar a Date si querés
  hora: { type: String, required: true },
  lugar: { type: String, required: true },
  ciudad: { type: String, required: true },
  precio: { type: Number },
  imagen: { type: String },
  categoria: { type: String },
  disponible: { type: Number, default: 100 }, // Cantidad de entradas
  fechaCreacion: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Evento", eventoSchema);
