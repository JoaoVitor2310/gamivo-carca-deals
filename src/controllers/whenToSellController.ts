import { Request, Response } from 'express';
import { getProductIdBySlug, getProductsToListFromSistemaEstoque } from '../services/productService';
import { bestPriceResearcher, compareById } from '../services/comparisonService';
import { priceWithFee } from '../helpers/priceWithFee';
import { IGameToList } from '../interfaces/IGameToList';
import { sendEmail } from '../services/emailService';
import { isDateOlderThanMonths } from '../helpers/isDateOlderThanEightMonths';

export const whenToSell = async (req: Request, res: Response): Promise<void> => {
    const gamesToSell: IGameToList[] = [];
    try {

        // Fazer req

        const gamesFromAPI = await getProductsToListFromSistemaEstoque();
        // console.log(gamesFromAPI);
        // Loop nos jogos
        for (const game of gamesFromAPI) {
            // Ver se o menor preco é maior que o minimoParaVenda
            const bestPrice = await compareById(Number(game.idGamivo));

            // Pegar o valor do jogo com as taxas
            const bestPriceWithFee = priceWithFee(bestPrice.menorPreco);

            if (bestPriceWithFee > Number(game.minimoParaVenda) || isDateOlderThanMonths(game.dataAdquirida)) { // Jogo que 
                // Juntar jogos que podem ser listados
                gamesToSell.push(game);
            }
        }
        // console.log(gamesToSell)

        // Enviar email avisando os jogos que podem ser listar
        if (gamesToSell.length > 0) {
            await sendEmail(gamesToSell);
        }

        res.status(200).json({ message: 'Games successfully checked.', gamesToSell });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error checking when to sell offers.' });
    }

};