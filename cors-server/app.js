const express = require('express');
var cors = require('cors');
const app = express();
app.use(cors({origin: "http://localhost:3000"}));
app.use(express.json());

app.get('/dataRequest/:lat/:long/:page', (req, res) => {
    res.redirect(`https://api.skolverket.se/planned-educations/school-units?coordinateSystemType=0160&distance=5&latitude=${req.params.lat}&longitude=${req.params.long}&page=${req.params.page}&size=20&typeOfSchooling=gr`);
})

app.get('/schoolRequest/:id', (req, res) => {
    res.redirect(`https://api.skolverket.se/planned-educations/school-units/${req.params.id}`);
})

app.get('/geoCoding/:adress', (req, res) => {
    res.redirect(`https://maps.googleapis.com/maps/api/geocode/json?address=${req.params.adress}&key=`);
})

app.get('/StatisticsRequest/:id', (req, res) => {
    if(req.params.id==="generall"){
        res.redirect(`https://api.skolverket.se/planned-educations/statistics/national-values/gr`);
    }else{
        res.redirect(`https://api.skolverket.se/planned-educations/school-units/${req.params.id}/statistics/gr`);
    }
})




app.listen(8080, () => {
    console.log('listening on port 8080')
})
