const Category = Parse.Object.extend('Category');
const Product = Parse.Object.extend('Product');
const Chapter = Parse.Object.extend('Chapter');
const PagesChapter = Parse.Object.extend('PagesChapter');
const CoinToUser = Parse.Object.extend('CoinToUser');
const admin = require('firebase-admin');
const fs = require('fs');
const serviceAccount = require('./brasiltoon-5983e-firebase-adminsdk-3a0tz-3b8680860d.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: "brasiltoon-5983e.appspot.com" // Insira o URL do seu bucket do Firebase Storage
});

// Função para salvar a imagem no diretório do aplicativo
async function saveImageToAppDirectory(image) {
    try {
        // Gera um nome de arquivo único para a imagem usando timestamp
        const uniqueFileName = Date.now().toString();
        const imageName = `${uniqueFileName}.png`;

        // Referência ao caminho no Firebase Storage
        const bucket = admin.storage().bucket();
        const file = bucket.file(`images/${imageName}`);

        // Envia o arquivo para o Firebase Storage
        await file.save(image/*, {
            metadata: {
                contentType: 'image/png'
            }
        }*/);

        // Obtém o URL do arquivo recém-enviado
        const imagePath = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(file.name)}?alt=media`;
        //  const imagePath = `https://firebasestorage.googleapis.com/${bucket.name}/${file.name}`;

        // Retorna o URL completo da imagem
        console.log(imagePath);
        return imagePath;
    } catch (error) {
        // Lida com erros durante o upload
        console.error('Erro durante o upload da imagem:', error);
        throw new Error('Erro durante o upload da imagem');
    }
}
//função para publicar capa da historia
Parse.Cloud.define('publish-cape-story', async (req) => {
    if (!req.user) throw 'INVALID_USER';

    const category = new Parse.Object('Category');
    category.id = req.params.category;

    /*  try {
          const coinResult = await useCoin(1, req.user);
          if (!coinResult.success) {
              throw coinResult.message; // Lança o erro caso a atualização das moedas falhe
          }*/
    // Caminho local do arquivo
    // const filePath = 'C://Users//fabio//OneDrive//Imagens//Imagens da Câmera//IMG-20231107-WA0007.jpg';

    // Lê o arquivo como um buffer
    // const imageBuffer = fs.readFileSync(filePath);

    // Salva a imagem no diretório do aplicativo
    // const imagePath = await saveImageToAppDirectory(`file:///C:/6_semestre/mangas/free/FREE%20%20CAPA-1.png`);
    const product = new Product();
    product.set('title', req.params.title);
    product.set('cape', req.params.cape);
    product.set('description', req.params.description);
    product.set('user', req.user);
    product.set('category', category);

    const savedItem = await product.save(null, { useMasterKey: true });

    return {
        id: savedItem.id,
    };
    /*  } catch (error) {
          throw error; // Propaga qualquer erro ocorrido na verificação das moedas
      }*/
});
//função para publicar capitulo da historia
Parse.Cloud.define('publish-cape-chapter', async (req) => {
    if (req.user == null) throw 'INVALID_USER';
    const product = new Parse.Object('Product');
    product.id = req.params.product;
    /*  try {
          const coinResult = await useCoin(1, req.user);
          if (!coinResult.success) {
              throw coinResult.message; // Lança o erro caso a atualização das moedas falhe
          }*/
    const chapter = new Chapter();
    chapter.set('namechapter', req.params.title);
    chapter.set('capechapter', req.params.cape);
    chapter.set('description', req.params.description);
    chapter.set('chapter', product);
    const savedItem = await chapter.save(null, { useMasterKey: true });

    return {
        id: savedItem.id,
    };
    /*  } catch (error) {
          throw error; // Propaga qualquer erro ocorrido na verificação das moedas
      }*/
});
//função para publicar paginas capitulo 
Parse.Cloud.define('publish-pages-chapter', async (req) => {
    if (req.user == null) throw 'INVALID_USER';
    const chapter = new Parse.Object('Chapter');
    chapter.id = req.params.chapter;

    /* try {
         const coinResult = await useCoin(1, req.user);
         if (!coinResult.success) {
             throw coinResult.message; // Lança o erro caso a atualização das moedas falhe
         }*/
    const pagesChapter = new PagesChapter();
    pagesChapter.set('page', req.params.page);
    pagesChapter.set('chapterpage', chapter);
    const savedItem = await pagesChapter.save(null, { useMasterKey: true });

    return {
        id: savedItem.id,
    };
    /*} catch (error) {
        throw error; // Propaga qualquer erro ocorrido na verificação das moedas
    }*/
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

    /* const coinResult = await useCoin(1, req.user);
     if (!coinResult.success) {
         throw coinResult.message; // Lança o erro caso a atualização das moedas falhe
     }*/

    return
    //  pagesChapter.set('page', req.params.page); 


    //   await PagesChapter.save(null, { useMasterKey: true });


});
//função para excluir pagina do capitulo selecionado da historia 
Parse.Cloud.define('delete-page', async (req) => {
    if (req.params.pageId == null) throw 'INVALID-PAGE';
    const pagesChapter = new PagesChapter();
    pagesChapter.id = req.params.pageId;

    await pagesChapter.destroy({ useMasterKey: true });

});
//função para excluir capitulo da historia
Parse.Cloud.define('delete-chapter', async (req) => {
    if (req.params.chapterId == null) throw 'INVALID-CHAPTER';
    const chapterId = req.params.chapterId;
    const pagesChapter = new Parse.Query("PagesChapter");
    pagesChapter.equalTo("chapterpage", { "__type": "Pointer", "className": "Chapter", "objectId": chapterId });
    const relatedObjects2 = await pagesChapter.find({ useMasterKey: true });
    await Parse.Object.destroyAll(relatedObjects2, { useMasterKey: true });
    const chapter = new Chapter();
    chapter.id = chapterId;
    await chapter.destroy({ useMasterKey: true });

});
//função para excluir historia
Parse.Cloud.define("delete-story", async (request) => {
    const productId = request.params.productId;

    // Lógica para buscar e excluir objetos vinculados em RelatedClass1
    const chapter = new Parse.Query("Chapter");
    chapter.equalTo("chapter", { "__type": "Pointer", "className": "Product", "objectId": productId });
    const relatedObjects1 = await chapter.find({ useMasterKey: true });

    for (const relatedObject1 of relatedObjects1) {
        // Lógica para buscar e excluir objetos vinculados em RelatedClass2
        const pagesChapter = new Parse.Query("PagesChapter");
        pagesChapter.equalTo("chapterpage", { "__type": "Pointer", "className": "Chapter", "objectId": relatedObject1.id });
        const relatedObjects2 = await pagesChapter.find({ useMasterKey: true });
        await Parse.Object.destroyAll(relatedObjects2, { useMasterKey: true });

        // Excluir objeto da RelatedClass1
        await relatedObject1.destroy({ useMasterKey: true });
    }

    // Excluir objeto principal
    //const MainClass = Parse.Object.extend("MainClass");
    const product = new Product();
    product.id = productId;
    await product.destroy({ useMasterKey: true });

    return "Main object and related objects deleted successfully.";
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
