import { NextResponse } from 'next/server'

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY!
const GEMINI_API_KEY = process.env.GEMINI_API_KEY!
const GENERATE_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`

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

async function getClothingTip(todayDesc: string, todayTemp: number, tomorrowDesc: string, tomorrowTemp: number): Promise<string> {
  const prompt = `You are a helpful UK school parent assistant. Write a friendly, practical clothing tip for a primary school child heading to school today and tomorrow. No markdown, no bullet points, no asterisks — plain text only. Two short sentences max.

Today: ${todayTemp}°C, ${todayDesc}
Tomorrow: ${tomorrowTemp}°C, ${tomorrowDesc}

Focus on what to wear or pack, e.g. coat, umbrella, wellies, sunscreen, layers. Be specific to the weather. Example good output: "A warm coat and scarf will keep them cosy today. Pack a waterproof jacket and wellies for tomorrow's rain."

Reply with the tip only — no intro, no label, no emoji.`

  try {
    const res = await fetch(GENERATE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 500, temperature: 0.4 },
      }),
    })
    const json = await res.json()
    return json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? ''
  } catch {
    return ''
  }
}

// GET /api/weather
export async function GET() {
  try {
    if (!OPENWEATHER_API_KEY) {
      return NextResponse.json({ error: 'Weather API key not configured' }, { status: 500 })
    }

    // Fetch 5-day / 3-hour forecast (free tier)
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${LAT}&lon=${LON}&units=metric&appid=${OPENWEATHER_API_KEY}`
    const res = await fetch(url, { next: { revalidate: 1800 } }) // cache 30 mins
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
    const todayEntries = data.list.filter((e: { dt_txt: string }) => e.dt_txt.startsWith(todayStr))
    const tomorrowEntries = data.list.filter((e: { dt_txt: string }) => e.dt_txt.startsWith(tomorrowStr))

    // Use midday entry if available, otherwise first entry
    const pickEntry = (entries: { dt_txt: string; main: { temp: number; temp_max: number; temp_min: number }; weather: { id: number; description: string }[] }[]) => {
      const midday = entries.find(e => e.dt_txt.includes('12:00:00'))
      return midday || entries[0] || data.list[0]
    }

    const todayEntry = pickEntry(todayEntries)
    const tomorrowEntry = pickEntry(tomorrowEntries)

    const todayHigh = Math.round(Math.max(...(todayEntries.length ? todayEntries : [todayEntry]).map((e: { main: { temp_max: number } }) => e.main.temp_max)))
    const todayLow  = Math.round(Math.min(...(todayEntries.length ? todayEntries : [todayEntry]).map((e: { main: { temp_min: number } }) => e.main.temp_min)))
    const tomorrowHigh = Math.round(Math.max(...(tomorrowEntries.length ? tomorrowEntries : [tomorrowEntry]).map((e: { main: { temp_max: number } }) => e.main.temp_max)))
    const tomorrowLow  = Math.round(Math.min(...(tomorrowEntries.length ? tomorrowEntries : [tomorrowEntry]).map((e: { main: { temp_min: number } }) => e.main.temp_min)))

    const todayTemp = Math.round(todayEntry.main.temp)
    const tomorrowTemp = Math.round(tomorrowEntry.main.temp)
    const todayDesc = todayEntry.weather[0].description
    const tomorrowDesc = tomorrowEntry.weather[0].description
    const todayIcon = getWeatherEmoji(todayEntry.weather[0].id)
    const tomorrowIcon = getWeatherEmoji(tomorrowEntry.weather[0].id)

    const clothingTip = await getClothingTip(todayDesc, todayTemp, tomorrowDesc, tomorrowTemp)

    return NextResponse.json(
      {
        today: { temp: todayTemp, high: todayHigh, low: todayLow, description: todayDesc, icon: todayIcon },
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
