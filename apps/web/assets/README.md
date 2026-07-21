# Assets mobile

Arquivos fonte para gerar ícones, splash screen e imagens base do Personal IA:

```text
icon-only.png
icon-foreground.png
icon-background.png
splash.png
splash-dark.png
```

Os arquivos `brand-icon.svg` e `brand-splash.svg` são as fontes visuais da marca. Para regenerar PNGs de PWA, Capacitor, ícone e splash, rode:

```bash
npm --workspace apps/web run assets:store
npm --workspace apps/web run mobile:assets
```

Sugestão visual:

- Fundo: `#07090d`
- Verde principal: `#21d2ad`
- Laranja de apoio: `#f78c6b`
- Ícones: 1024x1024 PNG
- Splash: 2732x2732 PNG
