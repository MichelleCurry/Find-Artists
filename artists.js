const axios = require('axios');
const cheerio = require('cheerio');
const mailer = require('nodemailer');

let jsonData = require('./credentials.json');
const e = require('express');
const { argv } = require('process');
// console.log(jsonData.from);
// console.log(jsonData.to);
// console.log(jsonData.sender_email);
// console.log(jsonData.sender_password);
// console.log();

let transporter = mailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
        user: jsonData.sender_email,
        pass: jsonData.sender_password
    },
    tls : { rejectUnauthorized: false }
});

var argvLength = process.argv.length;

if (argvLength > 2) {
    axios('http://www.popvortex.com/music/charts/top-rap-songs.php')
        .then(function (response) {
            if (response.status === 200) {
                const $ = cheerio.load(response.data);
                const chartItems = $('.feed-item');
                const songsFound = [];
                let artistString = '';
                let body = "";
                let HTMLbody = "";

                for (let a = 2; a < argvLength; a++) {
                    for (let i = 0; i < 25; i++) {
                        const artist = chartItems.eq(i).find('.title-artist .artist').text();
                        const title = chartItems.eq(i).find('.title-artist .title').text();

                        console.log('SEARCH :'+process.argv[a]);
                        if (artist.includes(process.argv[a]) || title.includes(process.argv[a])) {
                            //const position = parseInt(chartItems.eq(i).find('p.chart-position').text());
                            console.log('FOUND *************');
                            songsFound.push({ title, artist });
                        }

                        //console.log('Chart Position: ' + position);
                        console.log('Title: ' + title);
                        console.log('Artist: ' + artist);
                        console.log('---');
                    }

                    if (argvLength >= 5 && a < argvLength - 1) {
                        artistString += argv[a] + ', ';
                    } else if (argvLength >= 4 && a == argvLength - 1) {
                        artistString += "and " + argv[a];
                    } else {
                        artistString += argv[a]+' ';
                    }
                }

                HTMLbody += "<p>";
                console.log('\nFound ' + songsFound.length + ' songs\n');
                for (let i = 0; i < songsFound.length; i++) {
                    body += songsFound[i].artist +" : "+songsFound[i].title + '\n';
                    HTMLbody += "<strong>"+songsFound[i].artist+": </strong>" 
                    HTMLbody += "<em>"+songsFound[i].title +"</em><br>";
                    console.log('Title: ' + songsFound[i].title);
                    console.log('Artist: ' + songsFound[i].artist);
                    console.log('---');
                }
                HTMLbody += "</p>";

                console.log("\n\nSubject: Your Artist(s) are: " + artistString);
                console.log("Body: \n" + body);

                if (songsFound.length > 0) {
                    transporter.sendMail({
                        from: jsonData.from,
                        to: jsonData.to,
                        subject: 'Your Artists are: ' + artistString,
                        text: body,
                        html: HTMLbody
                    }, (err) => {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log('Email sent to ' + jsonData.to + '!');
                        }
                    });
                } else {
                    console.log('This artist is not found.');
                }
            } else {
                console.error('Error: Unable to fetch the URL. Status code:', response.status);
            }
        })
        .catch(function (error) {
            console.error('Error:', error.message);
    });
} else {
    console.error('you did not specify any artist(s).');
}