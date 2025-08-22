const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Usuario = require("../models/Usuarios");
const nodemailer = require("nodemailer");

const router = express.Router();

// Transporter de nodemailer
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: 'singravedad777@gmail.com',
    pass: 'mwdo opzy gcyg snsc', // contraseña de app
  },
});

// Genera código de 6 dígitos
function generarCodigo() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
      return res.status(400).json({ mensaje: "Usuario no encontrado" });
    }

    // Bloquear login si no confirmó su cuenta
    if (!usuario.confirmado) {
      return res.status(403).json({ mensaje: "Debes confirmar tu cuenta antes de iniciar sesión" });
    }

    const isMatch = await bcrypt.compare(password, usuario.password);
    if (!isMatch) {
      return res.status(400).json({ mensaje: "Contraseña incorrecta" });
    }

    // Generar token si todo está ok
    const token = jwt.sign(
      { id: usuario._id, rol: usuario.rol }, // incluir rol también en el token
      'Eloamladafdflksdafjlfjlsdjfsdfjlsdjflkjsdflkajsdfkljasldkjmnmmn',
      { expiresIn: "1h" }
    );

    // Respuesta al frontend
   res.json({
      token,
      email: usuario.email,
      nombre: usuario.nombre,
      role: usuario.role  // <- agregamos role aquí
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error en el servidor" });
  }
});



// Registro con confirmación por correo
router.post("/register", async (req, res) => {
  try {
    const { nombre, email, password } = req.body;
    const existe = await Usuario.findOne({ email });
    if (existe) return res.status(400).json({ mensaje: "El usuario ya existe" });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const codigoConfirmacion = generarCodigo();

    const nuevoUsuario = new Usuario({
      nombre,
      email,
      password: hash,
      confirmado: false,
      codigoConfirmacion
    });
    await nuevoUsuario.save();

    // Enviar correo con código
    await transporter.sendMail({
      from: `"Sin Gravedad" <singravedad777@gmail.com>`,
      to: email,
      subject: "Confirma tu cuenta",
      html: `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Confirma tu cuenta</title>
        <style>
          body { font-family: 'Inter', sans-serif; background-color: #0f0f0f; color: #e0e0e0; margin:0; padding:0; }
          .container { max-width:600px; margin:30px auto; background: linear-gradient(145deg,#1e1e1e,#2a2a2a); border-radius:12px; padding:30px; text-align:center; box-shadow:0 4px 15px rgba(0,0,0,0.3); }
          h3 { color:#ff6b35; font-family: 'Bebas Neue', cursive; font-size:28px; margin-bottom:10px; }
          p { font-size:16px; line-height:1.6; color:#b0b0b0; margin:10px 0; }
          .codigo { font-size:2rem; color:#ff8c42; font-weight:bold; margin:20px 0; }
          .footer { margin-top:30px; font-size:12px; color:#666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h3>Hola ${nombre}, ¡bienvenido a Sin Gravedad!</h3>
          <p>Tu código de verificación es:</p>
          <div class="codigo">${codigoConfirmacion}</div>
          <p>Ingresa este código en la app para activar tu cuenta.</p>
          <p class="footer">Si no te registraste, ignora este correo.</p>
        </div>
      </body>
      </html>
      `
    });

    res.json({ mensaje: "Usuario registrado. Revisa tu correo para confirmar la cuenta." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error en el servidor" });
  }
});

// Verificar código de confirmación
router.post("/confirmar-codigo", async (req, res) => {
  try {
    const { email, codigo } = req.body;
    const usuario = await Usuario.findOne({ email });
    if (!usuario) return res.status(400).json({ mensaje: "Usuario no encontrado" });

    if (usuario.codigoConfirmacion === codigo) {
      usuario.confirmado = true;
      usuario.codigoConfirmacion = null; // limpiar código
      await usuario.save();
      return res.json({ mensaje: "Cuenta confirmada correctamente" });
    }

    res.status(400).json({ mensaje: "Código incorrecto" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error en el servidor" });
  }
});

// Solicitar reset de contraseña (envía mail con link)
router.post("/reset-password-request", async (req, res) => {
  try {
    const { email } = req.body;
    const usuario = await Usuario.findOne({ email });
    if (!usuario) return res.status(400).json({ mensaje: "Usuario no encontrado" });

    const token = jwt.sign({ id: usuario._id }, process.env.JWT_SECRET, { expiresIn: "15m" });
    const urlReset = `${process.env.FRONTEND_URL}/reset-password/${token}`;

    await transporter.sendMail({
      from: `"Soporte" <singravedad777@gmail.com>`,
      to: email,
      subject: "Restablecer contraseña",
      html: `
        <h3>Hola ${usuario.nombre}</h3>
        <p>Puedes restablecer tu contraseña haciendo clic en el siguiente enlace (válido 15 minutos):</p>
        <a href="${urlReset}">Restablecer contraseña</a>
      `,
    });

    res.json({ mensaje: "Correo enviado para restablecer contraseña" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error en el servidor" });
  }
});

// Endpoint que recibe nueva contraseña después de dar click al link del mail
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { nuevaPassword } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await Usuario.findById(decoded.id);
    if (!usuario) return res.status(400).json({ mensaje: "Usuario no encontrado" });

    const salt = await bcrypt.genSalt(10);
    usuario.password = await bcrypt.hash(nuevaPassword, salt);
    await usuario.save();

    res.json({ mensaje: "Contraseña actualizada correctamente" });
  } catch (error) {
    console.error(error);
    res.status(400).json({ mensaje: "Token inválido o expirado" });
  }
});
// Confirmar código
router.post("/confirmar-codigo", async (req, res) => {
  try {
    const { email, codigo } = req.body;
    const usuario = await Usuario.findOne({ email });

    if (!usuario) return res.status(400).json({ mensaje: "Usuario no encontrado" });
    if (usuario.confirmado) return res.status(400).json({ mensaje: "Usuario ya confirmado" });

    if (usuario.codigoConfirmacion !== codigo) {
      return res.status(400).json({ mensaje: "Código incorrecto" });
    }

    usuario.confirmado = true;
    usuario.codigoConfirmacion = null; // Limpiar código
    await usuario.save();

    res.json({ mensaje: "Cuenta confirmada correctamente" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error en el servidor" });
  }
});


module.exports = router;



