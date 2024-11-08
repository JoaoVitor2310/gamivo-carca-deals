const axios = require('axios');
const slugify = require('slugify');
const { calcPrecoSemTaxa } = require('../functions/calcPrecoSemTaxa.js');
const { checkOthersAPI } = require('../functions/checkOthersAPI.js');
const url = process.env.URL;
const token = process.env.TOKEN;
const nomeVendedor = process.env.nomeVendedor;


const productsList = async (req, res) => { // Penúltimo endpoint de products
      // Lista os jogos que o usuário tem disponível? Agora estou na dúvida se é isso msm. Útil para ver os detalhes dos jogos
      // Ainda não sei como pode ser útil para a gente
      const { offset = 0, limit = 100 } = req.query;
      
      // const offset = 100; // A partir de qual jogo vai mostrar
      // const limit = 100; // Limit por página, não pode ser maior que 100
      
      try {
            const response = await axios.get(`${url}/api/public/v1/products?offset=${offset}&limit=${limit}`, {
                  headers: {
                        'Authorization': `Bearer ${token}`
                        // 'Content-Type': 'application/json',
                  },
            });
            const quantidade = response.data.length;
            console.log(quantidade);
            res.json(response.data);
      } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Erro ao consultar a API externa.' });
      }
}

const productIds = async (req, res) => {
      // Lista os jogos que estão/tiveram a venda, podem ter jogos com o status 0 pelo visto.
      let { offset = 0, limit = 100 } = req.query;
      
      // offset: A partir de qual jogo vai mostrar
      // limit: Limite por página, não pode ser maior que 100
      let productIds = [], quantidade = 0, quatidadeTotal = 0, isDone = false, totalAtivos = 0, totalInativos = 0;
      while (!isDone) {
            try {
                  const response = await axios.get(`${url}/api/public/v1/offers?offset=${offset}&limit=${limit}`, {
                        headers: {
                              'Authorization': `Bearer ${token}`
                        },
                  });
                  
                  // console.log(response);
                  // res.json('A');
                  // return;
                  
                  
                  quantidade = response.data.length;
                  quatidadeTotal += response.data.length; // Quantidade total de ofertas
                  
                  if (response.data.length == 0) { // Aqui que termina o loop do while
                        console.log(`Ativos: ${totalAtivos}; Inativos: ${totalInativos}`); // Anúncios ativos e não ativos
                        console.log(`Acabou!`);
                        res.json(productIds);
                        isDone = true;
                        return;
                  }
                  
                  for (var i = 0; i < response.data.length; i++) {
                        var productId = response.data[i].product_id;
                        var status = response.data[i].status;
                        
                        // response.data[i].status == 1 ? totalAtivos += 1 : totalInativos += 1;
                        
                        if (status == 1) {
                              console.log(`productId: ${productId}`);
                              productIds.push(productId);
                              totalAtivos += 1
                        } else {
                              totalInativos += 1
                        }
                  }
                  offset += 100;
                  console.log(`Offset: ${offset}`);
            } catch (error) {
                  console.error(error);
                  res.status(500).json({ error: 'Erro ao consultar a API externa.' });
            }
      }
}

const compareAll = async (req, res) => {
      // Comparar o preço dos concorrentes daquele jogo e descobrir qual é o menor preço
      
      //  Passo a passo
      // Definir o productId do jogo em questão
      // Procurar por outras pessoas vendendo aquele msm jogo
      // Descobrir qual é o menor preço que ele está sendo vendido
      
      const { myProductIds } = req.body;
      
      let bestPrices = [], impossibleGames = [];
      
      
      for (let i = 0; i < myProductIds.length; i++) {
            try {
                  // Procurar por outras pessoas vendendo aquele msm jogo
                  var response = await axios.get(`${url}/api/public/v1/products/${myProductIds[i]}/offers`, {
                        headers: {
                              'Authorization': `Bearer ${token}`
                        },
                  });
                  
                  // Descobrir qual é o menor preço que ele está sendo vendido
                  let menorPreco = Number.MAX_SAFE_INTEGER; // Define um preço alto para depois ser substituído pelos menores preços de verdade
                  if (response.data.length == 0) {
                        console.log(`Você é o único vendedor do productId: ${myProductIds[i]}`);
                  } else {
                        for (const produto of response.data) {
                              // Obtém o preço de varejo do produto
                              const precoAtual = produto.retail_price;
                              
                              if (precoAtual < menorPreco) {
                                    menorPreco = precoAtual;
                              }
                        }
                        console.log(`Menor preço do productId: ${myProductIds[i]} é: ${menorPreco}`);
                        bestPrices.push(menorPreco);
                  }
                  
            } catch (error) {
                  if (error.response.status == 404 || error.response.status == 403) {
                        impossibleGames.push(myProductIds[i]);
                  } else {
                        console.error(error);
                        res.status(500).json({ error: 'Erro ao consultar a API externa.' });
                  }
            }
            
      }
      console.log(`Esses são os ids dos jogos impossíveis: ${impossibleGames}`);
      console.log(`Quantidade de jogos impossíveis: ${impossibleGames.length}`);
      res.json(bestPrices);
}

const compareById = async (req, res) => {
      // Comparar o preço dos concorrentes pelo id do jogo e descobrir qual é o menor preço
      
      //  Passo a passo
      // Definir o productId do jogo em questão
      // Procurar por outras pessoas vendendo aquele msm jogo
      // Descobrir qual é o menor preço que ele está sendo vendido
      
      let menorPrecoComTaxa, menorPrecoSemTaxa, qtdCandango = 0;
      
      const sellersToIgnore = ['Kinguin', 'Buy-n-Play', 'Playtime', 'Estateium']; // Ignora esses para abaixar o preço
      
      // Definir o productId do jogo em questão
      const { id } = req.params; // O jogo está sendo recebido pelo id nos params
      try {
            // Procurar por outras pessoas vendendo aquele msm jogo
            const response = await axios.get(`${url}/api/public/v1/products/${id}/offers`, {
                  headers: {
                        'Authorization': `Bearer ${token}`
                  },
            });
            
            // res.json(response.data); // Só descomentar caso queira ver as informações dos vendedores do jogo
            // return;
            
            // Descobrir qual é o menor preço que ele está sendo vendido
            let menorPrecoSemCandango = Number.MAX_SAFE_INTEGER, menorPrecoComTaxa; // 
            let menorPrecoTotal = Number.MAX_SAFE_INTEGER; // Define um preço alto para depois ser substituído pelos menores preços de verdade
            let menorPreco; // Só para enviar na resposta
            let segundoMenorPreco; // Como vem ordenado, o segundo é sempre o segundo menor preço
            let offerId, wholesale_mode, wholesale_price_tier_one, wholesale_price_tier_two, menorPrecoParaWholesale;
            
            
            if (response.data[0].seller_name !== nomeVendedor) { //Não somos o menor preço
                  
                  const precoContraAPI = checkOthersAPI(response.data); // Checa se tem concorrentes com API
                  if (precoContraAPI) { // Se já tiver  o menor preço
                        return res.json({ id, menorPreco: calcPrecoSemTaxa(precoContraAPI) });
                  }
                  
                  response.data = response.data.filter(offer => !sellersToIgnore.includes(offer.seller_name)); // Remove os concorrentes que são para ignorar
                  //Separar caso que só tem a gente vendendo
                  if (response.data[1]) {
                        segundoMenorPreco = response.data[1].retail_price;
                  }

                  for (const produto of response.data) {
                        if (produto.seller_name !== nomeVendedor) {
                              let ignoreSeller = false; // True = candango, false = vendedor experiente
                              // Obtém o preço de varejo do produto

                              const { retail_price: precoAtual, completed_orders: quantidadeVendas } = produto; // Preço de varejo e quantidade de vendas do concorrente

                              if (quantidadeVendas < 4000) {
                                    ignoreSeller = true;
                                    qtdCandango++;
                              }

                              if (precoAtual < menorPrecoTotal) {
                                    menorPrecoTotal = precoAtual; // Define um preço independente se é candango ou não
                              }

                              if (precoAtual < menorPrecoSemCandango) {
                                    if (!ignoreSeller) { // Se não for candango
                                          menorPrecoSemCandango = precoAtual; // Define um preço considerando SOMENTE vendedores experientes
                                    }
                              }
                        } else {
                              offerId = produto.id;
                              wholesale_mode = produto.wholesale_mode;
                              wholesale_price_tier_one = produto.wholesale_price_tier_one;
                              wholesale_price_tier_two = produto.wholesale_price_tier_two;
                        }
                  }


                  if (qtdCandango >= 3) {
                        console.log(`MAIS DE 3 CANDANGOS NO ID: ${id} `); // Considera o preço menor independente
                        menorPreco = menorPrecoTotal;
                  } else {
                        menorPreco = menorPrecoSemCandango; // Considera SOMENTE os preços dos vendedores experientes
                  }

                  // DEALS
                  menorPreco = menorPrecoTotal; // Não iremos considerar candangos pois também somos um

                  if (response.data.length == 1 || menorPrecoTotal == Number.MAX_SAFE_INTEGER) {
                        console.log(`Você é o único vendedor do productId: ${id}`)
                        res.json({ id, menorPreco: -2 }); // Sem concorrentes
                  } else {

                        // DEALS
                        // if (menorPrecoTotal !== menorPrecoSemCandango) {
                        //       console.log(`TEM CANDANGO NESSE JOGO.`)
                        //       console.log(`menorPrecoTotal: ${menorPrecoTotal}, menorPrecoSemCandango: ${menorPrecoSemCandango}`);
                        //       if (menorPrecoSemCandango == Number.MAX_SAFE_INTEGER) { // Caso os concorrentes sejam < 3 candangos e não tenha nenhum normal
                        //             res.json({ id, menorPreco: -4 });
                        //             return;
                        //       }
                        // }

                        const diferenca = segundoMenorPreco - menorPreco;
                        let porcentagemDiferenca;

                        // Lógica para os samfiteiros
                        if (segundoMenorPreco > 1.0) porcentagemDiferenca = 0.1 * segundoMenorPreco;
                        else porcentagemDiferenca = 0.05 * segundoMenorPreco;

                        if (diferenca >= porcentagemDiferenca) {
                              console.log('SAMFITEIRO!');
                              if (response.data[1].seller_name == nomeVendedor) { // Tem samfiteiro, mas ele é o segundo, não altera o preço
                                    console.log('Já somos o segundo melhor preço!');
                                    res.json({ id, menorPreco: -4 });
                                    return;
                              } else { // Tem samfiteiro, mas ele não é o segundo, altera o preço
                                    console.log(`Menor preço antes: ${menorPreco}`);
                                    menorPreco = response.data[1].retail_price;
                                    console.log(`Menor preço depois do samfiteiro: ${menorPreco}`);
                              }
                        }

                        // Calcula o novo preço sem a taxa, a gamivo irá adicionar as taxas dps, e o menorPreco será atingido
                        menorPreco = menorPreco - 0.02;
                        // menorPrecoSemTaxa = calcPrecoSemTaxa(menorPreco);
                        
                        if(menorPreco > 3.99 && menorPreco < 4.61) { // POR CAUSA DO BUG DA GAMIVO
                              menorPrecoSemTaxa = 3.69
                        } else{
                              menorPrecoSemTaxa = calcPrecoSemTaxa(menorPreco);
                        }

                        console.log(`Para o menorPreco ${menorPreco.toFixed(2)} ser listado, o preço sem taxa deve ser: ${menorPrecoSemTaxa.toFixed(2)}`);

                        res.json({ id, menorPreco: menorPrecoSemTaxa.toFixed(2), offerId, wholesale_mode, wholesale_price_tier_one, wholesale_price_tier_two, menorPrecoParaWholesale: menorPreco.toFixed(2) });
                  }
            } else { // Nós somos o menor preço
                  offerId = response.data[0].id;
                  wholesale_mode = response.data[0].wholesale_mode;
                  wholesale_price_tier_one = response.data[0].wholesale_price_tier_one;
                  wholesale_price_tier_two = response.data[0].wholesale_price_tier_two;

                  if (response.data[1]) {
                        segundoMenorPreco = response.data[1].retail_price;
                        const nossoPreco = response.data[0].retail_price;
                        const diferenca = segundoMenorPreco - nossoPreco;


                        if (diferenca >= 0.04) {
                              menorPreco = segundoMenorPreco - 0.02;
                              // menorPrecoSemTaxa = calcPrecoSemTaxa(menorPreco);

                              if(menorPreco > 3.99 && menorPreco < 4.61) { // POR CAUSA DO BUG DA GAMIVO
                                    menorPrecoSemTaxa = 3.69
                              } else{
                                    menorPrecoSemTaxa = calcPrecoSemTaxa(menorPreco);
                              }

                              menorPreco = menorPreco.toFixed(2)
                              menorPrecoSemTaxa = menorPrecoSemTaxa.toFixed(2);

                              console.log("ESTAMOS COM O PREÇO ABAIXO, IREMOS AUMENTAR!");
                              console.log(`Para o menorPreco ${menorPreco} ser listado, o preço sem taxa deve ser: ${menorPrecoSemTaxa}`);
                              res.json({ id, menorPreco: menorPrecoSemTaxa, offerId, wholesale_mode, wholesale_price_tier_one, wholesale_price_tier_two, menorPrecoParaWholesale: menorPreco });
                        } else {
                              res.json({ id, menorPreco: -4 });
                        }
                  } else {
                        res.json({ id, menorPreco: -4 });
                  }
            }

      } catch (error) {
            // console.log('Esse é o error.response: ' + error);
            if (error.response.status == 404 || error.response.status == 403) {
                  console.log(`Id: ${id} é de um jogo 'impossível'`)
                  res.json({ id, menorPreco: -1 });
            } else {
                  console.error(error);
                  res.status(500).json({ error: 'Erro ao consultar a API externa.' });
            }
      }
}

const priceResearcher = async (req, res) => {

      const { slug } = req.params; // O jogo está sendo recebido pelo id nos params
      try {

            // Buscar o productId através do slug 
            const response1 = await axios.get(`${url}/api/public/v1/products/by-slug/${slug}`, {
                  headers: {
                        'Authorization': `Bearer ${token}`
                  },
            });

            const { id } = response1.data;
            console.log(id);

            // Com o productId, vai comparar pra ver o menor preço(mesma lógica do compareById)
            const response2 = await axios.get(`${url}/api/public/v1/products/${id}/offers`, {
                  headers: {
                        'Authorization': `Bearer ${token}`
                  },
            });

            // Descobrir qual é o menor preço que ele está sendo vendido
            let menorPrecoSemCandango = Number.MAX_SAFE_INTEGER;
            let menorPrecoTotal = Number.MAX_SAFE_INTEGER; // Define um preço alto para depois ser substituído pelos menores preços de verdade
            let menorPreco, qtdCandango, offerId; // Só para enviar na resposta
            let segundoMenorPreco; // Como vem ordenado, o segundo é sempre o segundo menor preço

            if (response2.data[0].seller_name !== nomeVendedor) { // Nós não somos o menor preço

                  //Separar caso que só tem ele vendendo
                  if (response2.data[1]) {
                        segundoMenorPreco = response2.data[1].retail_price;
                  }


                  for (const produto of response2.data) {
                        if (produto.seller_name !== nomeVendedor) {
                              let ignoreSeller = false; // True = candango, false = vendedor experiente
                              // Obtém o preço de varejo do produto

                              const { retail_price: precoAtual, completed_orders: quantidadeVendas } = produto; // Preço de varejo e quantidade de vendas do concorrente

                              if (quantidadeVendas < 4000) {
                                    ignoreSeller = true;
                                    qtdCandango++;
                              }

                              if (precoAtual < menorPrecoTotal) {
                                    menorPrecoTotal = precoAtual; // Define um preço independente se é candango ou não
                              }

                              if (precoAtual < menorPrecoSemCandango) {
                                    if (!ignoreSeller) { // Se não for candango
                                          menorPrecoSemCandango = precoAtual; // Define um preço considerando SOMENTE vendedores experientes
                                    }
                              }
                        } else {
                              offerId = produto.id;
                        }
                  }

                  if (qtdCandango >= 3) {
                        console.log(`MAIS DE 3 CANDANGOS NO ID: ${id} `); // Considera o preço menor independente
                        menorPreco = menorPrecoTotal;
                  } else {
                        menorPreco = menorPrecoSemCandango; // Considera SOMENTE os preços dos vendedores experientes
                  }

                  // DEALS
                  menorPreco = menorPrecoTotal;

                  if (response2.data.length == 1 || menorPrecoTotal == Number.MAX_SAFE_INTEGER) {
                        console.log(`Você é o único vendedor do productId: ${id}`)
                        res.json({ id, menorPreco: response2.data[0].retail_price }); // Sem concorrentes
                  } else {

                        if (menorPrecoTotal !== menorPrecoSemCandango) {
                              console.log(`TEM CANDANGO NESSE JOGO.`)
                              console.log(`menorPrecoTotal: ${menorPrecoTotal}, menorPrecoSemCandango: ${menorPrecoSemCandango}`);
                              if (menorPrecoSemCandango == Number.MAX_SAFE_INTEGER) { // Caso os concorrentes sejam < 3 candangos e não tenha nenhum normal
                                    res.json({ id, menorPreco: response2.data[0].retail_price });
                                    return;
                                    // if (response2.data[2]) {
                                    //       res.json({ id, menorPreco: response2.data[2].retail_price });
                                    //       return;
                                    // } else if (response2.data[1]) {
                                    //       res.json({ id, menorPreco: response2.data[1].retail_price });
                                    //       return;
                                    // } else {
                                    //       res.json({ id, menorPreco: 'Erro inesperado' });
                                    //       return;
                                    // }
                              }
                        }

                        const diferenca = segundoMenorPreco - menorPreco;
                        const porcentagemDiferenca = 0.1 * segundoMenorPreco;

                        if (diferenca >= porcentagemDiferenca) {
                              console.log('SAMFITEIRO!');
                              if (response2.data[1].seller_name == nomeVendedor) { // Tem samfiteiro, somos o segundo, não altera o preço
                                    console.log('Já somos o segundo melhor preço!');
                                    res.json({ id, menorPreco: response2.data[1].retail_price });
                                    return;
                              } else { // Tem samfiteiro, mas não somos o segundo, altera o preço
                                    menorPreco = response2.data[1].retail_price;
                              }
                        }

                        menorPreco = menorPreco - 0.01;

                        if (menorPreco < 0.12) {
                              menorPreco = 0.12;
                        }

                        res.json({ id, menorPreco: menorPreco.toFixed(2), offerId });
                  }

            } else { // Considerando que podemos estar com o preço abaixo
                  if (response2.data[1]) {

                        segundoMenorPreco = response2.data[1].retail_price;

                        const nossoPreco = response2.data[0].retail_price;

                        const diferenca = segundoMenorPreco - nossoPreco;

                        if (diferenca >= 0.10) {
                              menorPreco = segundoMenorPreco - 0.01;
                              if (menorPreco < 0.12) {
                                    menorPreco = 0.12;
                              }

                              offerId = response2.data[0].id;

                              console.log("ESTAMOS COM O PREÇO ABAIXO, IREMOS AUMENTAR!");
                              res.json({ id, menorPreco: menorPreco.toFixed(2), offerId });
                        } else {
                              // console.log("ERRO AQUI!");
                              res.json({ id, menorPreco: nossoPreco.toFixed(2) });
                        }
                  } else {
                        res.json({ menorPreco: response2.data[0].retail_price }); // alterar pro price-researcher?
                  }
            }
      } catch (error) {
            console.log('Esse é o error: ' + error);
            res.json({ menorPreco: 'F' });
      }
}

const productsBySlug = async (req, res) => {  // Não tá pronta
      const { gameName } = req.body;

      try {
            const sluggedName = slugify(gameName);
            console.log(sluggedName);
            const response = await axios.get(`${url}/api/public/v1/products/by-slug/${sluggedName}`, {
                  headers: {
                        'Authorization': `Bearer ${token}`
                  },
            });
            res.json(response.data);
      } catch (error) {
            // console.error(error);
            res.status(500).json({ error: 'Erro ao consultar a API externa.' });
      }
}

module.exports = {
      productsList,
      productIds,
      compareAll,
      compareById,
      productsBySlug,
      priceResearcher,
}