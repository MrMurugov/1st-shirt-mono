# Медиасет: сценарии и промпты

Финальные изображения этой итерации созданы встроенным `image_gen` в режиме
`photorealistic-natural`. Исходники сохранены в стандартном каталоге Codex, а
используемые сайтом версии — в `src/assets/images/` как versioned WebP. Старые
файлы не перезаписывались.

## Общая часть промпта

```text
Use case: photorealistic-natural
Asset type: production website lifestyle photograph for a Ukrainian B2B branded-workwear studio.
Style/medium: genuinely candid documentary photography, 35–50mm full-frame lens,
natural available light, real skin pores and flyaway hair, believable hands,
true fabric texture, seams and everyday imperfections, no advertising gloss.
Lighting/mood: calm professional optimism, natural eye contact and restrained
half-smiles only where the work situation supports them; no broad staged grin.
Color palette: whites, cobalt/deep blue and restrained yellow accents; no orange cast.
Text (verbatim): "ВАШЕ ЛОГО" in a distinctive condensed sans-serif, rendered
exactly once on the visible front of the garment; no other readable text.
Constraints: credible Ukrainian/Eastern European workplace context, anatomically
correct hands, practical props and product-first composition, nobody posing or
looking into the camera.
Avoid: repeated solo/downward-gaze staging, gloomy expressions, plastic skin,
cinematic orange-teal grading, extra fingers, duplicated props, illegible or
Latin lettering, third-party brands and watermarks.
```

Квадратные кадры дополнительно получили правило: `square 1:1; keep faces,
hands and the branded garment inside the central 75%; leave the lower area
readable beneath a dark card overlay`. Для кейсов использовано:
`horizontal 16:10; keep all faces unobstructed and the work action central`.

## Сценарии и финальные файлы

| Файл | Уникальная часть промпта |
|---|---|
| `hero/hero-production-v4.webp` | Двое сотрудников печатной мастерской вместе поднимают готовый синий свитшот; смотрят друг на друга с тихим удовлетворением. |
| `products/tshirt-premium/04-lifestyle-creative-review-v2.webp` | Арт-директорка в белой футболке показывает коллеге образец мерча и цветовые свотчи в светлой креативной студии. |
| `products/tshirt-base/05-lifestyle-barista-service-v2.webp` | Бариста в белой футболке передаёт чашку постоянной посетительнице; короткий доброжелательный контакт глазами. |
| `products/sweatshirt-core/05-lifestyle-maker-review-v2.webp` | Координаторка мастерской и коллега вместе оценивают готовый прототип на рабочем столе. |
| `products/hoodie-classic/04-lifestyle-studio-collaboration-v2.webp` | Моушн-дизайнер в белом худи обсуждает с коллегой абстрактный кадр на мониторе и естественно жестикулирует. |
| `products/jacket-softshell/04-lifestyle-site-handover-v2.webp` | Полевой инженер в белом софтшеле обсуждает с коллегой результат измерения рядом с геодезическим прибором. |
| `products/work-trousers-strong/04-lifestyle-installer-handover-v2.webp` | Монтажник кухни в полностью видимых рабочих брюках показывает коллеге завершённое выравнивание секции. |
| `products/hoodie-zip/04-lifestyle-venue-team-v2.webp` | Техник площадки в белом zip-худи передаёт рацию коллеге во время монтажа сцены. |
| `products/tshirt-base/06-lifestyle-waiter-service-v2.webp` | Официант в белой футболке подаёт блюдо гостю и обменивается спокойным тёплым взглядом с коллегой. |
| `products/tshirt-premium/05-lifestyle-welcome-desk-v2.webp` | Сотрудник welcome-стойки в premium-футболке передаёт участнице бейдж во время живой регистрации. |
| `cases/case-coffee-team-v3.webp` | Трое сотрудников настоящей кофейни заканчивают утреннюю подготовку; бариста показывает менеджеру готовую подачу. |
| `cases/case-festival-crew-v3.webp` | Трое сотрудников фестиваля заканчивают монтаж сине-жёлтой навигации; координатор получает подтверждение по рации. |

Все десять товарных/hero-кадров квадратные. Оба кейса приведены к `1280×800`.
