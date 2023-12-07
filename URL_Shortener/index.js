const express = require('express');
const app = express();
const bodyParser = require('body-parser')
const mongoose = require('mongoose');

mongoose.connect("mongodb://127.0.0.1:27017" );

const { UrlModel } = require('./models/urlshort');
// Midleware
app.use(express.static('public'));
app.set('view engine', "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', function (req, res) {
    let allUrl = UrlModel.find(function (err, result) {
        res.render('home', {
            urlResult: result
        })
    })
});

app.post('/create', function (req, res) {
    let urlShort = new UrlModel({
        longUrl: req.body.longurl,
        shortUrl: generateUrl()
    })

    urlShort.save(function (err, data) {
        if (err) {
            console.log(err);
            throw err
        };
        res.redirect('/');
    })
});


app.get('/:urlId', function (req, res) {
    if(req.params.urlId){
        UrlModel.findOne({ shortUrl: req.params.urlId }, function (err, data) {
        if (err) {
            console.log(err);
            throw err
        };
        if(data){
            UrlModel.findByIdAndUpdate({ _id: data.id }, { $inc: { clickCount: 1 } }, function (err, updatedData) {
                if (err) {
                console.log(err);
                throw err
            };
                res.redirect(data.longUrl)
            })
        }
    })
    }
})

app.get('/delete/:id',function(req,res){
    UrlModel.findByIdAndDelete({_id:req.params.id},function(err,deleteData){
        if(err) {
            console.log(err);
            throw err
        };
        res.redirect('/')
    })
})

app.listen(3000, function () {
    console.log('Port is running in 3000')
});

function generateUrl() {
    var rndResult = "";
    var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    var charactersLength = characters.length;

    for (var i = 0; i < 5; i++) {
        rndResult += characters.charAt(
            Math.floor(Math.random() * charactersLength)
        );
    }
    console.log(rndResult)
    return rndResult
}
