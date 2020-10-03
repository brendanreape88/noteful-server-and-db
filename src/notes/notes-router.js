const path = require("path");
const express = require("express");
const NotesService = require("./notes-service");

const notesRouter = express.Router();
const jsonParser = express.json();

const serializeNote = (note) => ({
  id: note.id,
  name: note.note_name,
  content: note.content,
  folder: note.folder_id,
});

notesRouter
  .route("/")
  .get((req, res, next) => {
    const knexInstance = req.app.get("db");
    NotesService.getAllNotes(knexInstance)
      .then((notes) => {
        res.json(notes.map(serializeNote));
      })
      .catch(next);
  })
  .post(jsonParser, (req, res, next) => {
    const { note_name, content, modified, folder_id } = req.body;
    const newNote = { note_name, content, modified, folder_id };

    console.log(newNote);
    for (const [key, value] of Object.entries(newNote)) {
      if (value == null) {
        return res.status(400).json({
          error: { message: `Missing '${key}' in request body` },
        });
      }
    }

    console.log(newNote);
    NotesService.insertNote(req.app.get("db"), newNote)
      .then((note) => {
        console.log(note);
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `${note.id}`))
          .json(note);
      })
      .catch(next);
  });

notesRouter
  .route("/:noteId")
  .all((req, res, next) => {
    NotesService.getById(req.app.get("db"), req.params.noteId)
      .then((note) => {
        if (!note) {
          return res.status(404).json({
            error: { message: `Note doesn't exist` },
          });
        }
        res.note = note;
        next();
      })
      .catch(next);
  })
  .get((req, res, next) => {
    res.json(serializeNote(res.note));
  })
  .delete((req, res, next) => {
    NotesService.deleteNote(req.app.get("db"), req.params.noteId)
      .then((numRowsAffected) => {
        res.status(204).end();
      })
      .catch(next);
  });

module.exports = notesRouter;
