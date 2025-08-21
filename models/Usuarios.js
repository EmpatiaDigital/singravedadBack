const mongoose = require("mongoose");

const usuarioSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  confirmado: { type: Boolean, default: false },
  codigoConfirmacion: String, // Código de 6 dígitos
  fechaRegistro: { type: Date, default: Date.now },
  role: { type: String, default: "user" },
});

module.exports = mongoose.model("Usuarios", usuarioSchema);
