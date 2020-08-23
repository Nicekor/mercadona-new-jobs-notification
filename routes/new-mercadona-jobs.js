const express = require('express');
const router = express.Router();
const cheerio = require('cheerio');
const fetch = require('node-fetch');
const nodemailer = require('nodemailer');
const db = require('../db');
const { nanoid } = require('nanoid');
const { cleanTable } = require('../db/utils');

const sendEmail = (jobAds, emailId) => {
  const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.AUTH_EMAIL,
      pass: process.env.AUTH_PASS,
    },
  });

  transporter.sendMail(
    {
      from: process.env.AUTH_EMAIL,
      to: process.env.TO_EMAIL,
      subject: `Novo(s) emprego(s) no Mercadona | REF: ${emailId}`,
      html: `<h2>Há novos empregos no Mercadona, vai lá ver <span role="img" aria-label="Face with Tongue">
                😛
              </span>
            </h2>
            <h4>Novo(s) Emprego(s):</h4>
            <ul>
                ${jobAds
                  .map(
                    ({ title, link }) =>
                      `<li><a href="${link}">${title}</a></li>`
                  )
                  .join('')}
            </ul>
            <p>Vê todos os anúncios da Mercadona no Porto aqui: https://mercadona.avature.net/pt_PT/Careers/SearchJobs/?3_61_3=379</p>
        `,
    },
    (err, info) => {
      if (err) {
        console.error(err);
      } else {
        console.log('Email sent: ' + info.response);
      }
    }
  );
};

router.get('/', async (req, res) => {
  try {
    // 3_61_3 it's the query parameter for the District, 379 represents Porto
    const mercadonaRes = await fetch(
      'https://mercadona.avature.net/pt_PT/Careers/SearchJobs/?3_61_3=379'
    );
    const html = await mercadonaRes.text();
    const $ = cheerio.load(html);

    db.query('SELECT * FROM new_jobs;', (err, databaseJobs) => {
      if (err) throw err;

      const mercadonaJobs = $('.list__item__text__title')
        .map((_, el) => {
          const $jobAd = $(el).find('a');
          return {
            title: $jobAd.text().trim(),
            link: $jobAd.attr('href'),
          };
        })
        .toArray();
      const newJobs = mercadonaJobs.filter((mercadonaJob) => {
        const databaseJobsTitles = databaseJobs.map(({ title }) => title);
        return !databaseJobsTitles.includes(mercadonaJob.title);
      });

      if (newJobs.length) {
        cleanTable('new_jobs', res);
        const newJobsToInsert = newJobs.map(({ title, link }) => [title, link]);
        db.query(
          'INSERT INTO new_jobs(title, link) VALUES ?',
          [newJobsToInsert],
          (err, results) => {
            if (err) throw err;
            sendEmail(newJobs, nanoid(10));
            res.json(newJobs);
          }
        );
      } else {
        res.json({ message: 'There are no new jobs' });
      }
    });
  } catch (err) {
    res.sendStatus(500);
    console.error(err);
  }
});

module.exports = router;
