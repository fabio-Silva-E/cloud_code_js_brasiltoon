const GalleryPerfil = Parse.Object.extend('GalleryPerfil');
Parse.Parse.Cloud.define('signup', async (req) => {
    if (!req.params.fullname) throw 'INVALID_FULLNAME';
    if (!req.params.phone) throw 'INVALID_PHONE';
    if (!req.params.email) throw 'INVALID_EMAIL';
    if (!req.params.password) throw 'INVALID_PASSWORD';

    // Verifique se temos um ID de personImage válido
    const personImageId = req.params.personImage;
    let galleryPerfil = null;

    if (personImageId) {
        const query = new Parse.Query('GalleryPerfil');
        try {
            galleryPerfil = await query.get(personImageId, { useMasterKey: true });
        } catch (e) {
            throw 'INVALID_PERSON_IMAGE'; // Se não encontrar, lança um erro apropriado
        }
    }

    const user = new Parse.User();
    user.set('username', req.params.email);
    user.set('email', req.params.email);
    user.set('password', req.params.password);
    user.set('fullname', req.params.fullname);
    user.set('phone', req.params.phone);

    if (galleryPerfil) {
        user.set('userphoto', galleryPerfil);
    }

    const resultUser = await user.signUp(null, { useMasterKey: true });

    const userJson = resultUser.toJSON();
    return {
        personImage: {
            image: galleryPerfil ? galleryPerfil.get('file').url() : null,
            id: galleryPerfil ? galleryPerfil.id : null,
        },
        id: userJson.objectId,
        fullname: userJson.fullname,
        email: userJson.email,
        phone: userJson.phone,
        token: userJson.sessionToken,
    };
});

Parse.Cloud.define('login', async (req) => {
    try {
        // Use logIn para autenticar o usuário
        const user = await Parse.User.logIn(req.params.email, req.params.password);

        // Inclua 'userphoto' para carregar informações adicionais
        const query = new Parse.Query(Parse.User);
        query.include('userphoto');
        const usertoken = user.toJSON();
        // Obtenha o objeto do usuário
        const loggedInUser = await query.get(user.id, { useMasterKey: true });

        // Verifique se o objeto userphoto é nulo e trate-o adequadamente
        const userJson = loggedInUser.toJSON();
        //   const userPhotoObject = userJson.userphoto;

        return formatUser(userJson, usertoken)
    } catch (e) {
        throw 'INVALID_CREDENTIALS'; // Credenciais inválidas
    }
});
Parse.Cloud.define('validate-token', async (req) => {
    try {
        const user = req.user;
        const query = new Parse.Query(Parse.User);
        query.include('userphoto');  // Certifique-se de incluir 'userphoto'
        const userWithPhoto = await query.get(user.id, { useMasterKey: true });

        const userJson = userWithPhoto.toJSON();
        console.log("userJson:", userJson);  // Verifique o estado de userJson
        console.log("userphoto:", userJson.userphoto);  // Estado detalhado de userphoto
        const usertoken = user.toJSON();
        return {
            personImage: {
                image: userJson.userphoto ? userJson.userphoto.file.url : null,
                id: userJson.userphoto ? userJson.userphoto.objectId : null,
            },
            id: userJson.objectId,
            fullname: userJson.fullname,
            email: userJson.email,
            phone: userJson.phone,
            token: usertoken.sessionToken,
        }
    } catch (e) {
        throw 'INVALID_TOKEN';
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
            query.include('userphoto');
            const users = await query.find({ useMasterKey: true });

            // Converta os objetos de usuário para JSON e formate cada um
            const formattedUsers = users.map(user => formatUser(user.toJSON()));

            return formattedUsers;
        } else {
            // Consulte o Parse Server para obter o usuário com base no ID
            const query = new Parse.Query(Parse.User);
            query.include('userphoto');
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


function formatUser(userJson, usertoken) {
    console.log("userJson:", userJson);  // Debug: log do userJson para verificação
    const userPhotoUrl = userJson.userphoto && userJson.userphoto.file ? userJson.userphoto.file.url : null;
    return {
        personImage: {
            image: userPhotoUrl,
            id: userJson.userphoto ? userJson.userphoto.objectId : null,
        },
        id: userJson.objectId,
        fullname: userJson.fullname,
        email: userJson.email,
        phone: userJson.phone,
        token: usertoken ? usertoken.sessionToken : null, // Garantir que usertoken é checado antes de acessar sessionToken
    };
}



