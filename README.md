# GetRichbymyself — Trading Performance Calculator

[![Netlify Status](https://api.netlify.com/api/v1/badges/YOUR_NETLIFY_SITE_ID/deploy-status)](https://app.netlify.com/sites/YOUR_NETLIFY_SITE_NAME/deploys)

Calculadora cuantitativa de trading para proyecciones de rentabilidad individuales y multi-cuenta (copy trading).

## 🚀 Deploy en Netlify

El sitio se despliega automáticamente en Netlify con cada push a la rama principal.

### Pasos para conectar Netlify

1. Ve a [netlify.com](https://netlify.com) e inicia sesión con tu cuenta de GitHub.
2. Haz clic en **"Add new site" → "Import an existing project"**.
3. Selecciona el repositorio `jeremyagnz/GetRichbymyself`.
4. Netlify detectará automáticamente la configuración de `netlify.toml`.
5. Haz clic en **"Deploy site"**.

Netlify generará automáticamente **Deploy Previews** para cada Pull Request, con una URL única del tipo `https://deploy-preview-XX--YOUR_SITE.netlify.app`.

Una vez desplegado, reemplaza `YOUR_NETLIFY_SITE_ID` y `YOUR_NETLIFY_SITE_NAME` en el badge de arriba con los valores de tu sitio en Netlify (**Site settings → General → Site details**).

## Uso

Abre `index.html` en cualquier navegador moderno, o visita la URL de Netlify. No requiere servidor ni dependencias externas.

## Funcionalidades

- **16 métricas calculadas** por cuenta y consolidadas
- **Copy trading / multi-cuenta**: multiplica resultados por número de cuentas y factor de copiado
- **Escenarios**: base, conservador (WR −10 %), optimista (WR +10 %) y cuentas duplicadas
- **Análisis de riesgo**: drawdown potencial, racha perdedora, riesgo de ruina, break-even
- **Recomendaciones automáticas** de escalado

## Variables de entrada

| Campo | Descripción |
|---|---|
| Target por trade | Ganancia esperada en cada operación ganadora |
| Stop loss por trade | Pérdida máxima en cada operación perdedora |
| Win rate (%) | Porcentaje de operaciones ganadoras |
| Trades por día | Operaciones abiertas por jornada |
| Días de trading / semana | Jornadas activas semanales |
| Tiempo a proyectar | Semanas o meses |
| Capital por cuenta | Capital destinado a cada cuenta |
| Drawdown máximo | Pérdida máxima tolerable por cuenta |
| Número de cuentas | Cuentas conectadas al copy trading |
| Factor de copiado | Multiplicador de réplica (1 = copia exacta) |
| Costos/fees por trade | Comisiones por operación por cuenta |

## Ejemplo de input (valores predeterminados)

```
Target: $400 | Stop loss: $300 | Win rate: 67%
Trades/día: 2 | Días/semana: 5 | Tiempo: 5 meses
Capital/cuenta: $10 000 | Drawdown máx.: $2 500
Cuentas: 5 | Factor copiado: 1x | Costos: $0
```
