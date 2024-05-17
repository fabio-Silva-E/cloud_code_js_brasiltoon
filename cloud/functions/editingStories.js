const Category = Parse.Object.extend('Category');
const Product = Parse.Object.extend('Product');
const Chapter = Parse.Object.extend('Chapter');
const PagesChapter = Parse.Object.extend('PagesChapter');
const CoinToUser = Parse.Object.extend('CoinToUser');
const GalleryPage = Parse.Object.extend('GalleryPage');
const GalleryChapter = Parse.Object.extend('GalleryChapter');
const Gallery = Parse.Object.extend('Gallery');
Parse.Cloud.define('publish-cape-story', async (req) => {
    if (!req.user) throw 'INVALID_USER';

    const category = new Parse.Object('Category');
    category.id = req.params.category;
    const galleryCover = new Parse.Object('Gallery');
    galleryCover.id = req.params.cape;
    const product = new Product();
    product.set('title', req.params.title);
    product.set('cape', galleryCover);
    product.set('description', req.params.description);
    product.set('user', req.user);
    product.set('category', category);

    const savedItem = await product.save(null, { useMasterKey: true });

    return {
        id: savedItem.id,
    };

});
//função para publicar capitulo da historia
Parse.Cloud.define('publish-cape-chapter', async (req) => {
    if (req.user == null) throw 'INVALID_USER';
    const product = new Parse.Object('Product');
    product.id = req.params.product;
    const galleryChapter = new Parse.Object('GalleryChapter');
    galleryChapter.id = req.params.cape;
    const chapter = new Chapter();
    chapter.set('namechapter', req.params.title);
    chapter.set('capechapter', galleryChapter);
    chapter.set('description', req.params.description);
    chapter.set('chapter', product);
    const savedItem = await chapter.save(null, { useMasterKey: true });

    return {
        id: savedItem.id,
    };

});
//função para publicar paginas capitulo 
Parse.Cloud.define('publish-pages-chapter', async (req) => {
    if (req.user == null) throw 'INVALID_USER';
    const chapter = new Parse.Object('Chapter');
    chapter.id = req.params.chapter;
    const galleryPage = new Parse.Object('GalleryPage');
    galleryPage.id = req.params.page;
    const pagesChapter = new PagesChapter();
    pagesChapter.set('page', galleryPage);
    pagesChapter.set('chapterpage', chapter);
    const savedItem = await pagesChapter.save(null, { useMasterKey: true });

    return {
        id: savedItem.id,
    };
});
//função para editar Capa da Historia
Parse.Cloud.define("edite-cover-story", async (req) => {
    if (req.user == null) throw 'INVALID_USER';
    if (req.params.productId == null) throw 'Historia invalida';
    const categoryQuery = new Parse.Query('Category');
    categoryQuery.equalTo('objectId', req.params.category);
    const category = await categoryQuery.first({ useMasterKey: true });

    if (!category) {
        throw 'Category not found';
    }
    //category.id = req.params.category;
    const product = new Product();
    product.id = req.params.productId;
    /*  try {
          const coinResult = await useCoin(1, req.user);
          if (!coinResult.success) {
              throw coinResult.message; // Lança o erro caso a atualização das moedas falhe
          }*/
    //product.set('cape', req.params.cape);
    product.set('title', req.params.title);
    product.set('description', req.params.description);
    product.set('category', category);
    const savedProduct = await product.save(null, { useMasterKey: true });

    const json = savedProduct.toJSON();

    // Modificando a resposta para incluir apenas o campo 'title' da categoria
    return {
        titulo: json.title,
        descrição: json.description,
        genero: json.category.title, // Ajuste para acessar o campo 'title'
    };
    /* } catch (error) {
         throw error; // Propaga qualquer erro ocorrido na verificação das moedas
     }*/
});
//função para editar capa do capitulo
Parse.Cloud.define("edite-chapter-story", async (req) => {
    if (req.user == null) throw 'INVALID_USER';
    if (req.params.chapterId == null) throw 'INVALID-CHAPTER';


    //category.id = req.params.category;
    const chapter = new Chapter();
    chapter.id = req.params.chapterId;
    /* try {
         const coinResult = await useCoin(1, req.user);
         if (!coinResult.success) {
             throw coinResult.message; // Lança o erro caso a atualização das moedas falhe
         }*/

    chapter.set('namechapter', req.params.title);
    //  chapter.set('capechapter', req.params.cape); 
    chapter.set('description', req.params.description);

    const savedChapter = await chapter.save(null, { useMasterKey: true });

    const json = savedChapter.toJSON();

    // Modificando a resposta para incluir apenas o campo 'title' da categoria
    return {
        titulo: json.namechapter,
        descrição: json.description,
    };
    /*  } catch (error) {
          throw error; // Propaga qualquer erro ocorrido na verificação das moedas
      }*/
});
//função para editar pagina
Parse.Cloud.define("edite-pages-chapter", async (req) => {
    if (req.user == null) throw 'INVALID_USER';
    if (req.params.pageId == null) throw 'INVALID-PAGE';
    const pagesChapter = new PagesChapter();
    pagesChapter.id = req.params.pageId;

    pagesChapter.page = req.params.page;
    return 'PAGE EDITE SUCCESS'
});
//função para excluir pagina do capitulo selecionado da historia 
Parse.Cloud.define('delete-page', async (req) => {
    if (!req.params.pageId) throw 'INVALID-PAGE';
    const pagesChapterId = req.params.pageId;
    // Primeiro, obtenha o objeto PagesChapter.
    const pagesChapter = new PagesChapter();
    pagesChapter.id = pagesChapterId;
    try {
        // Carregue o objeto PagesChapter para acessar o objeto GalleryPage associado
        const pagesChapterObject = await pagesChapter.fetch({ useMasterKey: true });
        const galleryPage = pagesChapterObject.get('page');  // Supondo que 'page' é o campo que contém o ponteiro para GalleryPage
        // Se houver um objeto GalleryPage associado, deletamos ele
        if (galleryPage) {
            await galleryPage.destroy({ useMasterKey: true });
        }
        // Depois de deletar o objeto GalleryPage, deletamos o PagesChapter
        await pagesChapter.destroy({ useMasterKey: true });
        return "Page and related gallery page deleted successfully.";
    } catch (error) {
        throw `Error deleting objects: ${error}`;
    }
});

//função para excluir capitulo da historia
// Função para excluir capítulo da história e todos os objetos relacionados
Parse.Cloud.define('delete-chapter', async (req) => {
    if (!req.params.chapterId) throw 'INVALID-CHAPTER';
    const chapterId = req.params.chapterId;

    const chapter = new Chapter();
    chapter.id = chapterId;

    try {
        // Primeiro, obtemos o objeto Chapter para acessar o objeto GalleryChapter associado, se houver
        const chapterObject = await chapter.fetch({ useMasterKey: true });
        const galleryChapter = chapterObject.get('capechapter');

        // Excluir o GalleryChapter associado, se houver
        if (galleryChapter) {
            await galleryChapter.destroy({ useMasterKey: true });
        }

        // Buscar todas as PagesChapter associadas ao Chapter
        const pagesChapterQuery = new Parse.Query("PagesChapter");
        pagesChapterQuery.equalTo("chapterpage", chapter);
        const relatedPagesChapters = await pagesChapterQuery.find({ useMasterKey: true });

        // Excluir todas as PagesChapter e os GalleryPage associados
        for (const pagesChapter of relatedPagesChapters) {
            const galleryPage = pagesChapter.get('page');
            if (galleryPage) {
                await galleryPage.destroy({ useMasterKey: true });
            }
            await pagesChapter.destroy({ useMasterKey: true });
        }

        // Após remover todos os objetos associados, excluir o próprio Chapter
        await chapter.destroy({ useMasterKey: true });

        return "Chapter and all related objects deleted successfully.";
    } catch (error) {
        throw `Error deleting objects: ${error}`;
    }
});

//função para excluir historia
// Função para excluir história e todos os objetos relacionados
// Função para excluir história e todos os objetos relacionados
Parse.Cloud.define("delete-story", async (request) => {
    const productId = request.params.productId;

    const product = new Product();
    product.id = productId;

    try {
        // Primeiro, carregue o objeto Product para acessar a capa associada
        const productObject = await product.fetch({ useMasterKey: true });
        const galleryCover = productObject.get('cape');

        // Excluir a capa da história, se existir
        if (galleryCover) {
            await galleryCover.destroy({ useMasterKey: true });
        }

        // Lógica para buscar e excluir objetos vinculados em Chapter
        const chapterQuery = new Parse.Query("Chapter");
        chapterQuery.equalTo("chapter", product);
        const relatedChapters = await chapterQuery.find({ useMasterKey: true });

        for (const relatedChapter of relatedChapters) {
            // Excluir a capa do capítulo, se existir
            const galleryChapter = relatedChapter.get('capechapter');
            if (galleryChapter) {
                await galleryChapter.destroy({ useMasterKey: true });
            }

            // Lógica para buscar e excluir objetos vinculados em PagesChapter
            const pagesChapterQuery = new Parse.Query("PagesChapter");
            pagesChapterQuery.equalTo("chapterpage", relatedChapter);
            const relatedPagesChapters = await pagesChapterQuery.find({ useMasterKey: true });
            await Parse.Object.destroyAll(relatedPagesChapters, { useMasterKey: true });

            // Excluir objeto da Chapter
            await relatedChapter.destroy({ useMasterKey: true });
        }

        // Excluir o objeto principal (Product)
        await product.destroy({ useMasterKey: true });

        return "Main object and all related objects including gallery covers deleted successfully.";
    } catch (error) {
        throw `Error deleting objects: ${error}`;
    }
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
