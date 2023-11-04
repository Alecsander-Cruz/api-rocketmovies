const knex = require('../database/knex');
const AppError = require('../utils/AppError');

class MovieNotesController {
    async create(request, response) {
        const { title, description, rating, tags } = request.body;

        if (title === '') {
            return response.status(400).json();
        }

        if (rating === -1) {
            return response.status(400).json();
        }

        if (tags.lenght === 0) {
            return response.status(400).json();
        }

        const user_id = request.user.id;

        const [user] = await knex('users').select().where('users.id', user_id);

        if (!user) {
            throw new AppError('Usuário não encontrado!');
        }

        if (rating < 0 || rating > 5) {
            throw new AppError('A avaliação precisa estar entre 0 e 5');
        }

        if (!Number.isInteger(rating)) {
            throw new AppError('A avaliação precisa ser um número inteiro');
        }

        const [note_id] = await knex('movie_notes').insert({
            title,
            description,
            rating,
            user_id
        });

        const movieTagsInsert = tags.map(name => {
            return {
                note_id,
                name,
                user_id
            };
        });

        await knex('movie_tags').insert(movieTagsInsert);

        response.status(201).json();
    }

    async show(request, response) {
        const { id } = request.params;

        const note = await knex('movie_notes').where({ id }).first();
        const tags = await knex('movie_tags')
            .where({ note_id: id })
            .orderBy('id');

        return response.json({
            ...note,
            tags
        });
    }

    async delete(request, response) {
        const { id } = request.params;

        await knex('movie_notes').where({ id }).delete();

        return response.json();
    }

    async index(request, response) {
        const { title, tags } = request.query;
        const user_id = request.user.id;

        let notes;

        if (tags) {
            const filteredTags = tags.split(',').map(tag => tag.trim());

            notes = await knex('movie_tags')
                .select([
                    'movie_notes.id',
                    'movie_notes.title',
                    'movie_notes.user_id'
                ])
                .where('movie_notes.user_id', user_id)
                .whereLike('movie_notes.title', `%${title}`)
                .whereIn('name', filteredTags)
                .innerJoin(
                    'movie_notes',
                    'movie_notes.id',
                    'movie_tags.note_id'
                )
                .orderBy('movie_notes.title')
                .groupBy('movie_notes.id');
        } else {
            notes = await knex('movie_notes')
                .where({ user_id })
                .whereLike('title', `%${title}%`)
                .orderBy('title');
        }

        const userTags = await knex('movie_tags').where({ user_id });
        const notesWithTags = notes.map(note => {
            const noteTags = userTags.filter(tag => tag.note_id === note.id);
            return {
                ...note,
                tags: noteTags
            };
        });
        return response.json(notesWithTags);
    }
}

module.exports = MovieNotesController;
