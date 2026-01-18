# Refine Prompt (Phase 2)

Use this prompt after Run 1 delivers underwhelming results.

---

That's too basic. I need a comprehensive analysis, but keep the output short. Here's what I want:

## Data Sources to Check

### Macro Context
- **VIX** - volatility index (fear gauge)
- **10-Year Treasury Yield** - risk-free rate benchmark
- **DXY** - dollar strength index
- **Fed Funds Rate** - current rate + next FOMC meeting date

### For Stocks (TSLA, WDC)
- **Price & Volume** - current price, % change, volume vs average
- **Technical Levels** - RSI (14-period), 50-day MA, key support/resistance
- **Insider Trades** - SEC Form 4 filings in last 30 days (transactions > $100k)
- **Congressional Trades** - any trades by members of Congress (check Capitol Trades)
- **News** - material events only (earnings, lawsuits, product launches)
- **Social Sentiment** - Reddit (r/wallstreetbets, r/investing) and Twitter/X

### For Crypto (SOL)
- **Price & Volume** - current price, % change, 24h volume
- **Technical Levels** - RSI (14-period), key support/resistance
- **Whale Wallet Movements** - large wallet activity > $1M (exclude known exchange wallets)
- **News** - protocol updates, partnerships, exploits
- **Social Sentiment** - Reddit (r/solana, r/cryptocurrency) and Twitter/X

## Alert Thresholds (only surface if crossed)

| Signal | Threshold | Priority |
|--------|-----------|----------|
| Price move | > 3% either direction | 🔴 Red |
| RSI extreme | > 70 (overbought) or < 30 (oversold) | 🔴 Red |
| Near support/resistance | Within 5% of key level | 🟡 Yellow |
| Insider trade | > $100k transaction | 🔴 Red |
| Congressional trade | Any amount | 🔴 Red |
| Whale movement | > $1M (crypto only) | 🟡 Yellow |
| Breaking news | Material events only | 🔴 Red |
| Sentiment extreme | Viral/trending discussion | 🟡 Yellow |

## Output Format

```markdown
# Morning Brief - {date}

## Macro
VIX {value} | 10Y {value}% | DXY {value} | Fed {value}% → FOMC {date}

## Alerts
[Only items crossing thresholds - omit section entirely if none]

🔴 {TICKER} {signal description}
🟡 {TICKER} {signal description}

## Watchlist

**TSLA** ${price} ({change}%) · RSI {value} · {alert status}
**WDC** ${price} ({change}%) · RSI {value} · {alert status}
**SOL** ${price} ({change}%) · RSI {value} · {alert status}
```

## Preferences

- **Lead with biggest movers** - if multiple alerts, put highest priority first
- **No fluff** - skip generic news, only material events
- **Contrarian signals welcome** - if sentiment is extremely bullish/bearish, note it
- **Timestamp awareness** - note if data is stale (market closed, API delayed)

## What NOT to Include

- Generic company descriptions
- Historical price charts
- Analyst price targets (unless major revision)
- Routine earnings previews (only actual earnings surprises)
- Social posts without significant engagement

---

**Key insight for skill encoding:** This prompt teaches BOTH:
1. **Preferences** (what to check) - the data sources and thresholds
2. **Expected format** (how to present) - the condensed alert-driven structure
