# Capacitor bootstrap

Base preparada para desacoplar o frontend estático do backend Spring e alimentar um app Capacitor.

## Estrutura

- `src/main/resources/static/promocontrol`: fonte oficial do frontend web.
- `mobile/web`: diretório de exportação consumível pelo `webDir` do Capacitor.
- `scripts/sync_mobile_web.ps1`: espelha o frontend atual para `mobile/web`.

## Fluxo sugerido

1. Sincronize os assets web:

```powershell
.\scripts\sync_mobile_web.ps1
```

2. Inicialize o workspace Node dentro de `mobile`:

```powershell
cd .\mobile
npm init -y
npm install @capacitor/cli @capacitor/core
npx cap init PromoControl br.com.infocedro.promocontrol --web-dir web
```

3. Adicione a plataforma desejada:

```powershell
npm install @capacitor/android
npx cap add android
```

4. A cada alteração no frontend:

```powershell
cd ..
.\scripts\sync_mobile_web.ps1
cd .\mobile
npx cap sync android
```

## API base URL

O login agora aceita `API base URL` e persiste esse valor localmente. Isso evita acoplamento com `window.location.origin`, que não funciona bem em WebView.

Se quiser travar a URL em build mobile, edite `mobile/web/env.js` depois da sincronização ou ajuste `src/main/resources/static/promocontrol/env.js` antes de exportar.
