Parse.Cloud.define('signup', async (req) => {
    if (req.params.fullname == null) throw 'INVALIDE_FULLNAME';
    if (req.params.phone == null) throw 'INVALIDE_PHONE';
    if (req.params.cpf == null) throw 'INVALIDE_CPF';
    const user = new Parse.User();
    user.set('userphoto', req.params.personImage);
    user.set('username', req.params.email);
    user.set('email', req.params.email);
    user.set('password', req.params.password);
    user.set('fullname', req.params.fullname);
    user.set('phone', req.params.phone);
    user.set('cpf', req.params.cpf);
    try {
        const resultUser = await user.signUp(null, { useMasterKey: true });
        const userJson = resultUser.toJSON();
        return {
            personImage: userJson.userphoto,
            id: userJson.objectId,
            fullname: userJson.fullname,
            email: userJson.email,
            phone: userJson.phone,
            cpf: userJson.cpf,
            token: userJson.sessionToken,
        }
    }
    catch (e) {
        throw 'INVALID_DATA'

    }
});
Parse.Cloud.define('login', async (req) => {
    try {
        const user = await Parse.User.logIn(req.params.email, req.params.password);
        const userJson = user.toJSON();
        return formatUser(userJson);
    } catch (e) {
        throw 'INVALID_CREDENTIALS';
    }
});
Parse.Cloud.define('validate-token', async (req) => {
    try {
        return formatUser(req.user.toJSON());
    } catch (e) {
        throw 'INVALID_TOKEN'
    }
});
Parse.Cloud.define('change-password', async (req) => {
    if (req.user == null) throw 'INVALID_USER';
    const user = await Parse.User.logIn(req.params.email, req.params.currentPassword);
    if (user.id != req.user.id) throw 'INVALID_USER';
    user.set('password', req.params.newPassword);
    await user.save(null, { useMasterKey: true });
});
Parse.Cloud.define('reset-password', async (req) => {
    await Parse.User.requestPasswordReset(req.params.email);
});
Parse.Cloud.define('perfil', async (req) => {
    try {
        // Verifique se o ID do usuário está presente nos parâmetros da solicitação
        const userId = req.params.userId;

        if (userId === null || userId === undefined) {
            // Se userId for null, retorne uma lista de todos os usuários
            const query = new Parse.Query(Parse.User);
            const users = await query.find({ useMasterKey: true });

            // Converta os objetos de usuário para JSON e formate cada um
            const formattedUsers = users.map(user => formatUser(user.toJSON()));

            return formattedUsers;
        } else {
            // Consulte o Parse Server para obter o usuário com base no ID
            const query = new Parse.Query(Parse.User);
            const user = await query.get(userId, { useMasterKey: true });

            // Converta o objeto de usuário para JSON usando sua função formatUser
            const userJson = user.toJSON();

            // Formate os dados do usuário e retorne
            return formatUser(userJson);
        }
    } catch (e) {
        throw 'INVALID_USER';
    }
});


function formatUser(userJson) {
    return {
        personImage: userJson.userphoto != null ? userJson.userphoto : null,
        id: userJson.objectId,
        fullname: userJson.fullname,
        email: userJson.email,
        phone: userJson.phone,
        cpf: userJson.cpf,
        token: userJson.sessionToken,
    }


}