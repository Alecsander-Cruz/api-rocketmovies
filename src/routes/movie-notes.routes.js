const { Router } = require('express');
const MovieNotesController = require('../controllers/MovieNotesController');
const ensureAuthenticated = require('../middlewares/ensureAuthenticated');

const movieNotesRoutes = Router();
movieNotesRoutes.use(ensureAuthenticated);

const movieNotesController = new MovieNotesController();

movieNotesRoutes.get('/', movieNotesController.index);
movieNotesRoutes.post('/', movieNotesController.create);
movieNotesRoutes.get('/:id', movieNotesController.show);
movieNotesRoutes.delete('/:id', movieNotesController.delete);

module.exports = movieNotesRoutes;
