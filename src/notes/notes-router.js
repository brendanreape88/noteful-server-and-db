const path = require('path')
const express = require('express')
const NotesService = require('./notes-service')

const notesRouter = express.Router()
const jsonParser = express.json()

const serializeNote = note => ({
    id: note.id,
    name: note.note_name,
    content: note.content,
    folder: note.folder_id
})

notesRouter
    .route('/')
    .get((req, res, next) => {
        const knexInstance = req.app.get('db')
        NotesService.getAllNotes(knexInstance)
          .then(notes => {
            res.json(notes.map(serializeNote))
          })
          .catch(next)
    })

notesRouter
    .route('/note/:noteId')
    .all((req, res, next) => {
        NotesService.getById(
          req.app.get('db'),
          req.params.noteId
        )
          .then(note => {
            if (!note) {
              return res.status(404).json({
                error: { message: `Note doesn't exist` }
              })
            }
            res.note = note
            next()
          })
          .catch(next)
    })
    .get((req, res, next) => {
        res.json(serializeNote(res.note))
    })
    .delete((req, res, next) => {
        NotesService.deleteNote(
          req.app.get('db'),
          req.params.noteId
        )
          .then(numRowsAffected => {
            res.status(204).end()
          })
          .catch(next)
      })

module.exports = notesRouter