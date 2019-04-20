const express = require('express');
const helmet = require('helmet');

const app = express();

// add some security-related headers to the response
app.use(helmet());

app.get('*', (req, res) => {

    const param = {
        kind: '',
        size: '',
        caffeine: '',
        syrup: '',
        sweet: '',
        milkType: '',
        extra: '',
        menu: '',
        addOns: [{ number: '', syrup: '' , extra: ''}],
    }
    let menuName = `${param.kind} ${param.size} ${param.caffeine}`;
    menuName.trim();
    param.addOns.map((arr) => {
        if(arr.syrup){
            menuName += ` ${arr.syrup}`;
        }
        if(arr.number){
            menuName +=  `${arr.number} shots`;
        }
    })
    menuName += ` ${milkType}`;
    param.addOns.map((arr) => {
        if(arr.extra){
            menuName += ` ${arr.extra}`;
        }
        if(arr.number){
            menuName +=  ` ${arr.number} shots `;
        }
    })
    menuName += ` ${extra} ${menu}`;
    menuName.trim();
});

module.exports = app;
