if (!process.env.PRODUCTION) {
    require('dotenv').config();
}


const app = require('./index.js');

app.listen(process.env.PORT || 3000, () => {
    console.log(`Listening on port ${process.env.PORT || 3000}`);
});