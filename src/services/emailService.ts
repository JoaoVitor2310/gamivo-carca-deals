import nodemailer from 'nodemailer';
import { GameToList } from '../types/GameToList.js';


export const sendEmail = async (gamesToSell: GameToList[]) => {
  const emailPass = process.env.EMAIL_PASS;
  const formatedGames = gamesToSell.map(game => JSON.stringify(game, null, 2)).join('\n');

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: 'joaovitormatosgouveia@gmail.com',
        pass: emailPass, // Senha de app. Em gmail.com clique no ícone de perfil -> Gerenciar sua conta do Google -> Segurança -> Verificação em duas etapas -> Senhas de app -> Escreva o nome do app e guarde a senha que será entregue
      },
    });

    const mailOptions = {
      from: 'joaovitormatosgouveia@gmail.com', // Remetente
      to: 'carcadeals@gmail.com', // Destinatário
      subject: `When to Sell ${currentDate}`, // Assunto
      text: `Olá, esses foram os jogos identificados para serem vendidos:\n ${formatedGames}`,
    };

    const sendMail = async (transporter: nodemailer.Transporter, mailOptions: nodemailer.SendMailOptions) => {
      try {
        // await transporter.sendMail(mailOptions);
        console.log(formatedGames);
        console.log('Email enviado.')
      } catch (error) {
        console.error(error);
      }
    }
    sendMail(transporter, mailOptions);
  } catch (error) {
    console.log(error);
  }
}

export const sendEmailPrice2 = async (gamesToBuy: any[]) => {
  const emailPass = process.env.EMAIL_PASS;
  const formatedGames = gamesToBuy.map(game => JSON.stringify(game, null, 2)).join('\n');

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: 'joaovitormatosgouveia@gmail.com',
        pass: emailPass, // Senha de app. Em gmail.com clique no ícone de perfil -> Gerenciar sua conta do Google -> Segurança -> Verificação em duas etapas -> Senhas de app -> Escreva o nome do app e guarde a senha que será entregue
      },
    });

    const mailOptions = {
      from: 'joaovitormatosgouveia@gmail.com', // Remetente
      to: 'carcadeals@gmail.com', // Destinatário
      subject: `Price Wholesale ${currentDate}`, // Assunto
      text: `Jogos identificados para serem comprados em wholesale e vendidos retail:\n ${formatedGames}`,
    };

    const sendMail = async (transporter: nodemailer.Transporter, mailOptions: nodemailer.SendMailOptions) => {
      try {
        await transporter.sendMail(mailOptions);
        // console.log(formatedGames);
        console.log('Email enviado.')
      } catch (error) {
        console.error(error);
      }
    }
    sendMail(transporter, mailOptions);
  } catch (error) {
    console.log(error);
  }
}


export const sendEmail2 = async (games: any[], subject: string, text: string) => {
  const emailPass = process.env.EMAIL_PASS;
  const formatedGames = games.map(game => JSON.stringify(game, null, 2)).join('\n');

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: 'joaovitormatosgouveia@gmail.com',
        pass: emailPass, // Senha de app. Em gmail.com clique no ícone de perfil -> Gerenciar sua conta do Google -> Segurança -> Verificação em duas etapas -> Senhas de app -> Escreva o nome do app e guarde a senha que será entregue
      },
    });

    const mailOptions = {
      from: 'joaovitormatosgouveia@gmail.com', // Remetente
      to: 'carcadeals@gmail.com', // Destinatário
      subject: `${subject} ${currentDate}`, // Assunto
      text: `${text}:\n ${formatedGames}`,
    };

    const sendMail = async (transporter: nodemailer.Transporter, mailOptions: nodemailer.SendMailOptions) => {
      try {
        await transporter.sendMail(mailOptions);
        // console.log(formatedGames);
        console.log('Email enviado.')
      } catch (error) {
        console.error(error);
      }
    }
    sendMail(transporter, mailOptions);
  } catch (error) {
    console.log(error);
  }
}