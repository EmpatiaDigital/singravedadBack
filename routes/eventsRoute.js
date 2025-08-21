const express = require("express");
const Evento = require("../models/Evento");

const router = express.Router();

// Crear evento
router.post("/crear", async (req, res) => {
  try {
    const nuevoEvento = new Evento(req.body);
    await nuevoEvento.save();
    res.json({ mensaje: "Evento creado correctamente", evento: nuevoEvento });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensaje: "Error al crear evento" });
  }
});

// Listar eventos
router.get("/", async (req, res) => {
  try {
    const eventos = await Evento.find();
    res.json(eventos);
  } catch (error) {
    res.status(500).json({ mensaje: "Error al traer eventos" });
  }
});

// Editar evento
router.put("/:id", async (req, res) => {
  try {
    const eventoActualizado = await Evento.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ mensaje: "Evento actualizado", evento: eventoActualizado });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al actualizar evento" });
  }
});

// Borrar evento
router.delete("/:id", async (req, res) => {
  try {
    await Evento.findByIdAndDelete(req.params.id);
    res.json({ mensaje: "Evento eliminado" });
  } catch (error) {
    res.status(500).json({ mensaje: "Error al eliminar evento" });
  }
});

module.exports = router;
