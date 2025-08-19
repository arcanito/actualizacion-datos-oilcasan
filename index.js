const app = require ('./src/app');

app.listen(4000, '0.0.0.0', () => {
    console.log ('Server on port 4000');
});