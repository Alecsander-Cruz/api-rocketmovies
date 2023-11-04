const { hash, compare } = require('bcryptjs');
const AppError = require('../utils/AppError');
const knex = require('../database/knex');

class UsersController {
    async create(request, response) {
        const { name, email, password } = request.body;

        const userExists = await knex('users')
            .select()
            .where('users.email', email)
            .first();

        if (userExists) {
            throw new AppError('Este email já está sendo usado!');
        }

        const hashedPassword = await hash(password, 8);

        await knex('users').insert({
            name,
            email,
            password: hashedPassword
        });

        return response.status(201).json();
    }

    async update(request, response) {
        const { name, email, password, old_password } = request.body;
        const user_id = request.user.id;

        const [user] = await knex('users').select().where('users.id', user_id);

        if (!user) {
            throw new AppError('Usuário não encontrado!');
        }

        const [userUpdatingEmail] = await knex('users')
            .select()
            .where('users.email', email);

        if (userUpdatingEmail && userUpdatingEmail.id !== user.id) {
            throw new AppError('Este email já está sendo usado!');
        }

        user.name = name ?? user.name;
        user.email = email ?? user.email;

        if (password && !old_password) {
            throw new AppError(
                'Você precisa informar a senha antiga para mudar a senha!'
            );
        }

        if (password && old_password) {
            const checkOldPassword = await compare(old_password, user.password);
            if (!checkOldPassword) {
                throw new AppError(
                    'A senha antiga digitada não corresponde com a senha antiga salva'
                );
            }
            user.password = await hash(password, 8);
        }

        await knex('users').where('users.id', user_id).update({
            name: user.name,
            email: user.email,
            password: user.password,
            updated_at: knex.fn.now()
        });

        return response.json();
    }
}

module.exports = UsersController;
