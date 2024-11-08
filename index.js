const express = require('express');
const axios = require('axios');
const cron = require('node-cron');
require('dotenv').config();
const nossaURL = process.env.NOSSAURL;

const router = require('./routes/Router');
const app = express();
app.use(express.json());


app.get('/', (req, res) => {
      res.send('Desenvolvido por João Vitor Gouveia e Lucas Corrado.');
})

cron.schedule('0 3,6,8,12,15,18,21,0 * * *', async () => { // Horários de atualização de preços
      try {
          const response = await axios.get(`${nossaURL}/api/jobs/attPrices`);
      } catch (error) {
          console.error('Erro ao chamar o endpoint:', error);
      }
  }, {
      scheduled: true,
      timezone: 'America/Sao_Paulo'
  });

const port = process.env.PORT || 3001;

app.use('/', router);

app.listen(port, () => {
      console.log(`Listening to port ${port}.`);
})