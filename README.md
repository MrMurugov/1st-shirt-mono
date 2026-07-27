# 1st Shirt

Статический прототип B2B-каталога одежды и печати. Сайт собирается на Eleventy 3 и публикуется в GitHub Pages; структура шаблонов и данных рассчитана на последующий перенос в WordPress.

**Живой прототип:** https://mrmurugov.github.io/1st-shirt/

## Локальный запуск

Требуется Node.js 22 или новее.

```bash
npm ci
npm run dev
```

Eleventy выведет локальный адрес в терминале. Производственная сборка создаётся командой:

```bash
npm run build
```

Готовые файлы появятся в `dist/`.
Сборка переносит только рабочие CSS/JS/шрифты и автоматически исключает из `dist`
неиспользуемые изображения, не удаляя исходники из `src`.

Перед публикацией можно собрать проект и проверить JavaScript, внутренние ссылки и локальные ресурсы одной командой:

```bash
npm run check
```

## Публикация

Workflow `.github/workflows/pages.yml` собирает ветку `main` и публикует каталог `dist` через GitHub Pages. В настройках репозитория выберите **Settings → Pages → Source → GitHub Actions**.

Проект настроен для адреса `https://mrmurugov.github.io/1st-shirt/` с `pathPrefix: "/1st-shirt/"`.

## Перенос в WordPress

Карта страниц и демонстрационных данных описана в [docs/site-structure.md](docs/site-structure.md). Соответствие шаблонов и данных целевой структуре WordPress — в [docs/wordpress-mapping.md](docs/wordpress-mapping.md).
