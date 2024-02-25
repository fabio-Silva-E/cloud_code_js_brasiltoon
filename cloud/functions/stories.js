const Category = Parse.Object.extend('Category');
const PagesChapter = Parse.Object.extend('PagesChapter');
const Chapter = Parse.Object.extend('Chapter');
const FavoriteItem = Parse.Object.extend('FavoriteItem');
const Product = Parse.Object.extend('Product');
const PageCount = Parse.Object.extend('PageCount');
//função para buscar lista de historias
Parse.Cloud.define('get-product-list', async (req) => {
    const queryProducts = new Parse.Query(Product);
    queryProducts.include('user');
    //condiçõe da query
    if (req.params.title != null) {
        //queryProducts.fullText('title',req.params.title);
        //  queryProducts.matches('title','.*'+req.params.title+'.*'); //=>filtra trechos da palavra mas tem erros de busca
        queryProducts.matches('title', new RegExp(req.params.title, 'i'));//=>filtra trechos da palavra maiusculas ou minusculas mas tem erros de busca
    }
    if (req.params.categoryId != null) {
        const category = new Category();
        category.id = req.params.categoryId;
        queryProducts.equalTo('category', category) //compara a coluna do ponteiro com o ponteiro criado na função
    }//cria  um objeto com o nome do ponteiro usa o objeto.id para receber o id que voce quer buscar
    if (req.params.userId != null) {
        const user = new User();
        user.id = req.params.userId;
        queryProducts.equalTo('user', user) //compara a coluna do ponteiro com o ponteiro criado na função
    }

    const itemsPerPage = req.params.itemsPerPage || 20;
    if (itemsPerPage > 100) throw 'quantidade invalida de itens por pagina';
    queryProducts.skip(itemsPerPage * req.params.page || 0);
    queryProducts.limit(itemsPerPage);
    queryProducts.include('category');
    queryProducts.include('user');
    const resultProducts = await queryProducts.find({ useMasterKey: true });
    return resultProducts.map(function (p) {
        p = p.toJSON();
        return formatProduct(p);
    });
});
//função buscar lista de favoritos
Parse.Cloud.define('get-favorite-items', async (req) => {
    if (req.user == null) throw 'INVALID_USER';

    const queryFavoriteItem = new Parse.Query(FavoriteItem);
    queryFavoriteItem.equalTo('user', req.user);

    if (req.params.userId != null) {
        const user = new User();
        user.id = req.params.userId;
        queryFavoriteItem.equalTo('user', user);
    }

    // Obtém a relação do ponteiro de Products
    const productQuery = new Parse.Query(Product);

    if (req.params.categoryId != null) {
        const category = new Category();
        category.id = req.params.categoryId;
        productQuery.equalTo('category', category);
    }

    if (req.params.title != null) {
        productQuery.matches('title', new RegExp(req.params.title, 'i'));
    }

    queryFavoriteItem.matchesQuery('product', productQuery);
    //retirada para testes
    const itemsPerPage = req.params.itemsPerPage || 20;
    if (itemsPerPage > 100) throw 'Quantidade inválida de itens por página';

    queryFavoriteItem.skip(itemsPerPage * req.params.page || 0);
    queryFavoriteItem.limit(itemsPerPage);

    queryFavoriteItem.include('product');
    queryFavoriteItem.include('product.category');
    queryFavoriteItem.include('product.user');

    const resultFavoriteItem = await queryFavoriteItem.find({ useMasterKey: true });

    return resultFavoriteItem.map(function (c) {
        c = c.toJSON();
        return {
            id: c.objectId,
            product: formatProduct(c.product)
        };
    });

});
//função buscar contagem de lista de favoritos
Parse.Cloud.define('get-all-favorite-items', async (req) => {
    if (req.user == null) throw 'INVALID_USER';

    const queryFavoriteItem = new Parse.Query(FavoriteItem);
    queryFavoriteItem.equalTo('user', req.user);

    if (req.params.userId != null) {
        const user = new User();
        user.id = req.params.userId;
        queryFavoriteItem.equalTo('user', user);
    }

    // Obtém a relação do ponteiro de Products
    const productQuery = new Parse.Query(Product);

    /* if (req.params.categoryId != null) {
         const category = new Category();
         category.id = req.params.categoryId;
         productQuery.equalTo('category', category);
     }*/

    /*  if (req.params.title != null) {
          productQuery.matches('title', new RegExp(req.params.title, 'i'));
      }*/

    queryFavoriteItem.matchesQuery('product', productQuery);
    //retirada para testes
    /*   const itemsPerPage = req.params.itemsPerPage || 20;
       if (itemsPerPage > 100) throw 'Quantidade inválida de itens por página';*/

    /* queryFavoriteItem.skip(itemsPerPage * req.params.page || 0);
     queryFavoriteItem.limit(itemsPerPage);*/

    queryFavoriteItem.include('product');
    // queryFavoriteItem.include('product.category');
    queryFavoriteItem.include('product.user');

    const resultFavoriteItem = await queryFavoriteItem.find({ useMasterKey: true });

    return resultFavoriteItem.map(function (c) {
        c = c.toJSON();
        return {
            id: c.objectId,
            //  product: formatProduct(c.product)
            product: {
                id: c.product.objectId,
            }
        };
    });

});
Parse.Cloud.define('get-favorite-count', async (req) => {
    if (req.user == null) throw 'INVALID_USER';

    const queryFavoriteItem = new Parse.Query(FavoriteItem);
    queryFavoriteItem.equalTo('user', req.user);

    if (req.params.userId != null) {
        const user = new User();
        user.id = req.params.userId;
        queryFavoriteItem.equalTo('user', user);
    }

    // Obtém a relação do ponteiro de Products
    const productQuery = new Parse.Query(Product);




    queryFavoriteItem.matchesQuery('product', productQuery);


    queryFavoriteItem.include('product');
    queryFavoriteItem.include('product.category');
    queryFavoriteItem.include('product.user');

    const resultFavoriteItem = await queryFavoriteItem.find({ useMasterKey: true });

    const favoriteItems = resultFavoriteItem
    const itemCount = favoriteItems.length; // Contagem dos itens na lista

    return {
        itemCount: itemCount // Adicionando a contagem dos itens na lista à resposta
    };
});
Parse.Cloud.define('add-page-count', async (req) => {
    if (req.user == null) throw 'INVALID_USER';
    if (req.params.chapterId == null) throw 'INVALID_CHAPTER';
    const chapter = new Parse.Object('Chapter');
    chapter.id = req.params.chapterId;
    // Consulta para verificar se já existe uma entrada em PagesCount com os parâmetros fornecidos
    const queryPagesCount = new Parse.Query('PageCount');
    queryPagesCount.equalTo('chapter', chapter);
    queryPagesCount.equalTo('user', req.user);
    try {
        const coinResult = await useCoin(1, req.user);
        if (!coinResult.success) {
            throw coinResult.message; // Lança o erro caso a atualização das moedas falhe
        }

        const existingPagesCount = await queryPagesCount.first({ useMasterKey: true });

        if (existingPagesCount) {
            // Se a entrada já existir, incrementa o valor de pagesCount em 3
            const currentCount = existingPagesCount.get('pageCount') || 0;
            existingPagesCount.set('pageCount', currentCount + 3);
            await existingPagesCount.save(null, { useMasterKey: true });

            return {
                id: existingPagesCount.id,
                newCount: currentCount + 3
            };
        } else {
            // Se a entrada não existir, cria uma nova entrada em PagesCount
            const newPagesCount = new PageCount();
            newPagesCount.set('chapter', chapter);
            newPagesCount.set('user', req.user);
            newPagesCount.set('pageCount', 6); // Inicializa com 3

            const savedCount = await newPagesCount.save(null, { useMasterKey: true });

            return {
                id: savedCount.id,
                newCount: 6
            };
        }
    } catch (error) {
        throw error;
    }
});

Parse.Cloud.define('get-pages-count', async (req) => {
    if (req.user == null) throw 'INVALID_USER';
    if (req.params.chapterId == null) throw 'INVALID_CHAPTER';
    const queryPages = new Parse.Query(PagesChapter);
    const queryPagesChapter = new Parse.Query(PageCount);
    queryPagesChapter.equalTo('user', req.user);

    // Busca pelo id do usuario
    if (req.params.userId != null) {
        const user = new User();
        user.id = req.params.userId;
        queryPagesChapter.equalTo('user', user);
    }

    const chapter = new Chapter();
    chapter.id = req.params.chapterId;
    queryPagesChapter.equalTo('chapter', chapter);
    queryPages.equalTo('chapterpage', chapter);
    const resultPages = await queryPagesChapter.find({ useMasterKey: true });
    const Pages = await queryPages.find({ useMasterKey: true });
    let itemCount = 0;

    if (resultPages && resultPages.length > 0) {
        itemCount = resultPages[0].get('pageCount') || 3; // Utiliza pageCount se disponível, caso contrário, retorna 3
    } else {
        itemCount = 3; // Se não houver resultados, define itemCount como 3
    }
    if (itemCount < Pages.length) {
        return {
            message: 'PAGES_TO_ADD_FOUND',
            itemCount: parseInt(itemCount)
        }
    } else {
        return {
            message: 'PAGES_TO_ADD_NOT_FOUND',
            itemCount: parseInt(itemCount) // Retorna itemCount como parte do objeto de retorno
        };
    }
});

Parse.Cloud.define('get-chapters-count', async (req) => {
    if (req.user == null) throw 'INVALID_USER';
    if (req.params.productId == null) throw 'INVALID_PRODUCT';
    const queryChapters = new Parse.Query(Chapter);


    const product = new Product();
    product.id = req.params.productId;
    queryChapters.equalTo('chapter', product);

    //condições

    const resultChapters = await queryChapters.find({ useMasterKey: true });

    const chapters = resultChapters
    const itemCount = chapters.length; // Contagem dos itens na lista

    return {
        itemCount: itemCount // Adicionando a contagem dos itens na lista à resposta
    };
});
//função para buscar lista de paginas do capitulo selecionado
Parse.Cloud.define('get-pages-list', async (req) => {
    const queryPagesChapter = new Parse.Query(PagesChapter);
    //busca pelo id do capitulo
    if (req.params.chapterId != null) {
        const chapter = new Chapter();
        chapter.id = req.params.chapterId;
        queryPagesChapter.equalTo('chapterpage', chapter)
    }
    //condições
    const itemsPerPage = req.params.itemsPerPage || 20;
    // if (itemsPerPage>100) throw 'quantidade invalida de itens por pagina';
    queryPagesChapter.skip(itemsPerPage * req.params.page || 0);
    queryPagesChapter.limit(itemsPerPage);
    const resultPagesChapter = await queryPagesChapter.find({ useMasterKey: true });
    return resultPagesChapter.map(function (c) {
        c = c.toJSON();
        return {
            page: c.page,
            id: c.objectId,
            chapter: {

                id: c.chapterpage.objectId
            }
        }
    });
});
//função para buscar lista de capitulos
Parse.Cloud.define('get-chapter-list', async (req) => {
    const queryChapters = new Parse.Query(Chapter);
    // const productQuery = new Parse.Query(Product);
    // Busca pelo id da história
    if (req.params.productId != null) {
        const product = new Product();
        product.id = req.params.productId;
        queryChapters.equalTo('chapter', product);
    }
    // queryChapters.matchesQuery('product', productQuery);
    // Condições
    const itemsPerPage = req.params.itemsPerPage || 20;
    //  if (itemsPerPage>100) throw 'quantidade invalida de itens por pagina';
    queryChapters.skip(itemsPerPage * req.params.page || 0);
    queryChapters.limit(itemsPerPage);
    queryChapters.include('chapter');
    // queryChapters.include('chapter,category');
    // queryChapters.include('chapter.user');
    const resultChapters = await queryChapters.find({ useMasterKey: true });

    const formattedChapters = resultChapters.map(function (c) {
        c = c.toJSON();
        return {
            titlechapter: c.namechapter,
            cape: c.capechapter,
            id: c.objectId,
            description: c.description,
            product: {
                id: c.chapter.objectId
            },
            user: {
                id: c.chapter.user.objectId

            }

        };
    });

    return formattedChapters;

});

//função para buscar lista de categorias
Parse.Cloud.define('get-category-list', async (req) => {
    const queryCategories = new Parse.Query(Category);
    //condições
    const resultCategories = await queryCategories.find({ useMasterKey: true });
    return resultCategories.map(function (c) {
        c = c.toJSON();
        return {
            title: c.title,
            id: c.objectId
        }
    });
});
// função para favoritar História
Parse.Cloud.define('add-item-to-favorites', async (req) => {
    if (req.user == null) throw 'INVALID_USER';

    if (req.params.productId == null) throw 'INVALID-PRODUCT';

    // Verificar se o item já está na lista de favoritos do usuário
    const existingFavoriteQuery = new Parse.Query(FavoriteItem);
    existingFavoriteQuery.equalTo('user', req.user);
    existingFavoriteQuery.equalTo('product', { __type: 'Pointer', className: 'Product', objectId: req.params.productId });

    const existingFavorite = await existingFavoriteQuery.first({ useMasterKey: true });

    // Se já existe, lançar uma exceção ou retornar uma mensagem
    if (existingFavorite) {
        throw 'ITEM_ALREADY_IN_FAVORITES';
        // Ou
        // return 'O item já está na lista de favoritos';
    }

    const favoriteItem = new FavoriteItem();
    const product = new Product();
    product.id = req.params.productId;
    favoriteItem.set('product', product);
    favoriteItem.set('user', req.user);
    const savedItem = await favoriteItem.save(null, { useMasterKey: true });

    return {
        id: savedItem.id,
    };
});

//função desfavoritar historia
Parse.Cloud.define('unfavorite-item', async (req) => {
    if (req.params.favoriteItemId == null) throw 'INVALID-FAVORITE-ITEM';
    const favoriteItem = new FavoriteItem();
    favoriteItem.id = req.params.favoriteItemId;

    await favoriteItem.destroy({ useMasterKey: true });

});

//função para buscar lista de publicações do usuário
Parse.Cloud.define('get-publish-items', async (req) => {
    if (req.user == null) throw 'INVALID_USER';

    const queryProducts = new Parse.Query('Product');
    queryProducts.equalTo('user', req.user);

    if (req.params.userId != null) {
        const user = new Parse.User();
        user.id = req.params.userId;
        queryProducts.equalTo('user', user);
    }

    // Obtém a relação do ponteiro de Products
    //const productQuery = new Parse.Query('Product'); // Corrigido: Use 'Product' em vez de 'Category'

    if (req.params.categoryId != null) {
        const category = new Category();
        category.id = req.params.categoryId;
        queryProducts.equalTo('category', category) //compara a coluna do ponteiro com o ponteiro criado na função
    }

    if (req.params.title != null) {
        queryProducts.matches('title', new RegExp(req.params.title, 'i'));
    }



    const itemsPerPage = req.params.itemsPerPage || 20;
    if (itemsPerPage > 100) throw 'Quantidade inválida de itens por página';

    queryProducts.skip(itemsPerPage * req.params.page || 0);
    queryProducts.limit(itemsPerPage);

    queryProducts.include('category');

    const resultProducts = await queryProducts.find({ useMasterKey: true });

    return resultProducts.map(function (c) {
        c = c.toJSON();
        return formatProduct(c);
    });
});

async function useCoin(coin, user) {
    if (user == null) throw 'INVALID_USER';
    //  if (req.params.quantity == null || req.params.quantity <= 0) throw 'INVALID_QUANTITY';


    const query = new Parse.Query('CoinToUser');
    query.equalTo('user', user);
    // try {
    const coinToUser = await query.first({ useMasterKey: true });

    if (!coinToUser) throw 'COIN_TO_USER_NOT_FOUND';

    const currentQuantity = coinToUser.get('quantity');

    if (coin > currentQuantity) {
        throw 'QUANTITY_EXCEEDS_TOTAL';
    }

    const remainingQuantity = currentQuantity - coin;

    if (remainingQuantity >= 0) {
        coinToUser.set('quantity', remainingQuantity);
        await coinToUser.save(null, { useMasterKey: true });
        return { success: true, message: 'Quantity updated successfully' };
    } else {
        return { success: false, message: 'Not enough coins' };
    }
};

function formatProduct(productJson) {
    if (productJson) {
        return {
            id: productJson.objectId,
            title: productJson.title,
            description: productJson.description,
            cape: productJson.cape,
            category: {
                title: productJson.category && productJson.category.title,
                id: productJson.category && productJson.category.objectId
            },
            user: {
                id: productJson.user && productJson.user.objectId,
                /* personImage: productJson.user.userphoto != null ? productJson.user.userphoto : null,
                 fullname: productJson.user && productJson.user.fullname,
                 email: productJson.user && productJson.user.email,
                 phone: productJson.user && productJson.user.phone,*/
                // Inclua outras propriedades do usuário conforme necessário
            }
        };
    } else {
        console.error("Objeto 'productJson' é undefined.");
        return null;  // ou algo apropriado para indicar um resultado inválido
    }
}
