const { createApp } = require('./app');
const { createStore } = require('./store');

(async () => {
  const store = await createStore(process.env.MONGODB_URI);
  const port = process.env.PORT || 3000;
  createApp(store).listen(port, () => console.log(`FitCheck on :${port} (storage: ${store.kind})`));
})();
