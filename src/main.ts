import './style.css';
import { App } from './game/app';
import { initHost } from './host';

initHost('landscape-detective');

const root = document.getElementById('app')!;
const app = new App(root);
app.boot().catch((err) => {
  console.error(err);
  root.insertAdjacentHTML('beforeend', `<div class="loading">שגיאה בטעינה: ${String(err?.message ?? err)}</div>`);
});
