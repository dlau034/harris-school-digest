import { NextResponse } from 'next/server'

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY!

// Beckenham, BR3
const LAT = 51.4088
const LON = -0.0225

function getWeatherEmoji(weatherId: number): string {
  if (weatherId >= 200 && weatherId < 300) return '⛈️'
  if (weatherId >= 300 && weatherId < 400) return '🌦️'
  if (weatherId >= 500 && weatherId < 600) return '🌧️'
  if (weatherId >= 600 && weatherId < 700) return '❄️'
  if (weatherId >= 700 && weatherId < 800) return '🌫️'
  if (weatherId === 800) return '☀️'
  if (weatherId === 801) return '🌤️'
  if (weatherId === 802) return '⛅'
  if (weatherId >= 803) return '☁️'
  return '🌡️'
}

function buildClothingTip(temp: number, desc: string): string {
  const d = desc.toLowerCase()
  const isRainy   = d.includes('rain') || d.includes('drizzle') || d.includes('shower')
  const isSnowy   = d.includes('snow')
  const isStormy  = d.includes('thunder') || d.includes('storm')
  const isWet     = isRainy || isSnowy || isStormy

  // Determine base layers by temperature
  if (isSnowy || isStormy) {
    return 'Jumper, Thick Jacket and Waterproof Layer tomorrow — full winter kit! They\'ll be warm, you\'ll be judged at the gates! ❄️'
  }

  if (temp <= 4) {
    if (isWet) return 'Jumper, Thick Jacket and Waterproof Layer tomorrow — full winter kit! They\'ll be warm, you\'ll be judged at the gates! ❄️'
    return 'Jumper and Thick Jacket tomorrow — the weather app said cold, we say no arguments! 🥶'
  }

  if (temp <= 10) {
    if (isWet) return 'Jumper, Light Jacket and Waterproof Layer tomorrow — dress them like an onion, it\'s layering weather! 🧅'
    return 'Jumper and Light Jacket tomorrow — not cold enough to complain, not warm enough to forget it!'
  }

  if (temp <= 16) {
    if (isWet) return 'Jumper and Waterproof Layer tomorrow — because puddles don\'t jump in themselves! 🌧️'
    return 'Just a Jumper tomorrow — not bad at all, enjoy the win! 🎉'
  }

  if (temp <= 21) {
    if (isWet) return 'Just a Waterproof Layer tomorrow — warm enough, but the sky didn\'t get the memo! ☔'
    return 'Just a Jumper tomorrow — finally, a morning without the coat battle! 🎉'
  }

  // 22°C+
  if (isWet) return 'Just a Waterproof Layer tomorrow — warm enough, but the sky didn\'t get the memo! ☔'
  return 'No layers needed tomorrow — just make sure they\'ve got water and maybe some sunscreen! ☀️'
}

// GET /api/weather
export async function GET() {
  try {
    if (!OPENWEATHER_API_KEY) {
      return NextResponse.json({ error: 'Weather API key not configured' }, { status: 500 })
    }

    // Fetch 5-day / 3-hour forecast (free tier)
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${LAT}&lon=${LON}&units=metric&appid=${OPENWEATHER_API_KEY}`
    const res = await fetch(url, { next: { revalidate: 600 } }) // cache 10 mins
    if (!res.ok) {
      throw new Error(`OpenWeatherMap error: ${res.status}`)
    }
    const data = await res.json()

    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    // Filter forecast entries by day
    const todayEntries    = data.list.filter((e: { dt_txt: string }) => e.dt_txt.startsWith(todayStr))
    const tomorrowEntries = data.list.filter((e: { dt_txt: string }) => e.dt_txt.startsWith(tomorrowStr))

    // Use midday entry if available, otherwise first entry
    const pickEntry = (entries: { dt_txt: string; main: { temp: number; temp_max: number; temp_min: number }; weather: { id: number; description: string }[] }[]) => {
      const midday = entries.find(e => e.dt_txt.includes('12:00:00'))
      return midday || entries[0] || data.list[0]
    }

    const todayEntry    = pickEntry(todayEntries)
    const tomorrowEntry = pickEntry(tomorrowEntries)

    const todayHigh    = Math.round(Math.max(...(todayEntries.length    ? todayEntries    : [todayEntry]).map((e: { main: { temp_max: number } }) => e.main.temp_max)))
    const todayLow     = Math.round(Math.min(...(todayEntries.length    ? todayEntries    : [todayEntry]).map((e: { main: { temp_min: number } }) => e.main.temp_min)))
    const tomorrowHigh = Math.round(Math.max(...(tomorrowEntries.length ? tomorrowEntries : [tomorrowEntry]).map((e: { main: { temp_max: number } }) => e.main.temp_max)))
    const tomorrowLow  = Math.round(Math.min(...(tomorrowEntries.length ? tomorrowEntries : [tomorrowEntry]).map((e: { main: { temp_min: number } }) => e.main.temp_min)))

    const todayTemp    = Math.round(todayEntry.main.temp)
    const tomorrowTemp = Math.round(tomorrowEntry.main.temp)
    const todayDesc    = todayEntry.weather[0].description
    const tomorrowDesc = tomorrowEntry.weather[0].description
    const todayIcon    = getWeatherEmoji(todayEntry.weather[0].id)
    const tomorrowIcon = getWeatherEmoji(tomorrowEntry.weather[0].id)

    const clothingTip = buildClothingTip(tomorrowTemp, tomorrowDesc)

    return NextResponse.json(
      {
        today:    { temp: todayTemp,    high: todayHigh,    low: todayLow,    description: todayDesc,    icon: todayIcon },
        tomorrow: { temp: tomorrowTemp, high: tomorrowHigh, low: tomorrowLow, description: tomorrowDesc, icon: tomorrowIcon },
        clothingTip,
      },
      {
        headers: { 'Cache-Control': 's-maxage=600, stale-while-revalidate=300' },
      }
    )
  } catch (err) {
    console.error('[/api/weather]', err)
    return NextResponse.json({ error: 'Could not fetch weather' }, { status: 500 })
  }
}
