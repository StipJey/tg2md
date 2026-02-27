# Changelog

## 0.1.1

### 🇷🇺 Русский

#### Безопасная работа с файлами

- Утилита больше **не удаляет и не перезаписывает** существующие файлы по умолчанию
- Добавлен флаг `--rewrite` (`-r`) — перезапись существующих `.md` файлов
- Добавлен флаг `--clean` (`-c`) — полная очистка выходной директории перед конвертацией
- При наличии пропущенных файлов выводится подсказка с доступными флагами

#### Улучшенный вывод CLI

- Цветной вывод в терминал
- Замер и отображение времени работы скрипта
- Визуальные разделители и структурированный итоговый отчёт (кол-во созданных файлов, скопированных изображений, путь к результату)
- Исправлен help-message

#### Рефакторинг

- Устранено дублирование кода
- Убраны магические переменные — вынесены в именованные константы
- Добавлена валидация аргументов командной строки
- Выделены чистые функции: `parseArgs()`, `uniqueFilename()`, `printHelp()`
- CLI-логика вынесена в `cli.ts`, `index.ts` стал тонкой точкой входа

#### Тестирование

- Добавлены юнит-тесты на чистые функции (`slugify`, `formatting`, `extractors`, `parser`, `converter`)
- Добавлены интеграционные тесты CLI
- Тестовые фикстуры (`minimal-export.json`, `mixed-messages.json`)
- Подключён `vitest` v4

#### Документация

- Добавлен `README.md` для тестов

---

### 🇬🇧 English

#### Safe file handling

- The tool **no longer deletes or overwrites** existing files by default
- Added `--rewrite` (`-r`) flag — overwrite existing `.md` files
- Added `--clean` (`-c`) flag — wipe the output directory before conversion
- When files are skipped, a helpful hint with available flags is displayed

#### Improved CLI output

- Colorized terminal output
- Execution time measurement and display
- Visual dividers and a structured summary (files created, images copied, output path)
- Fixed help message

#### Refactoring

- Removed code duplication
- Replaced magic variables with named constants
- Added CLI argument validation
- Extracted pure functions: `parseArgs()`, `uniqueFilename()`, `printHelp()`
- CLI logic moved to `cli.ts`, `index.ts` is now a thin entry point

#### Testing

- Added unit tests for pure functions (`slugify`, `formatting`, `extractors`, `parser`, `converter`)
- Added CLI integration tests
- Test fixtures (`minimal-export.json`, `mixed-messages.json`)
- Added `vitest` v4

#### Documentation

- Added test suite `README.md`

---

## 0.1.0

Initial release.
