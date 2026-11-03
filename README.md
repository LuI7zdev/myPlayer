# MyPlayer Android (WebView + ponte nativa)

O app web fica em `app/src/main/assets/www/`. A parte nativa (Java) faz 3 coisas que HTML puro não consegue:
1. Lista as músicas do aparelho (MediaStore), sem importar.
2. Extrai a capa embutida de cada arquivo (MP3, M4A, FLAC, OGG...).
3. Mostra controles (anterior / pausar / próxima) na barra de notificações, na tela de bloqueio e nos fones.

## Opção A — compilar na nuvem, sem instalar nada (GitHub Actions)
1. Crie um repositório no GitHub e envie TODOS os arquivos desta pasta (inclusive `.github`).
2. Aba **Actions** > **Build APK** > **Run workflow** (ou espere o push rodar sozinho).
3. Ao terminar, baixe o artefato **MyPlayer-apk** (contém `app-debug.apk`) e instale no celular.

## Opção B — Android Studio
Abra esta pasta no Android Studio e use **Build > Build APK(s)**. O APK sai em `app/build/outputs/apk/debug/`.

## Ao abrir o app
Aceite a permissão de **músicas/áudio** (e de **notificações** no Android 13+). A biblioteca aparece sozinha. O botão "Atualizar" refaz a busca.

## Limitações
- Arquivos de áudio dependem dos codecs do aparelho.
- Só aparecem músicas indexadas pelo Android (MediaStore) com mais de 10 s.
- Para editar o visual/lógica, altere os arquivos em `assets/www/`.
