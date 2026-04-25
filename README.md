# GetRichbymyself — Trading Performance Calculator

Calculadora cuantitativa de trading para proyecciones de rentabilidad individuales y multi-cuenta (copy trading).

## Uso

Abre `index.html` en cualquier navegador moderno. No requiere servidor ni dependencias externas.

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
