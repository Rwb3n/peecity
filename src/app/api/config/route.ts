// last updated on: 2025-08-27 22:46:28
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('=== CONFIG API REQUEST ===')
    console.log('Timestamp:', new Date().toISOString())
    
    // Log ALL environment variables first
    console.log('Total env vars count:', Object.keys(process.env).length)
    console.log('All env vars:', Object.keys(process.env).sort())
    
    // TEMPORARY: Hardcode API key for testing
    const mapsApiKey = 'AIzaSyAlfr4COYhh1CMmiCRw_KBDTFPdw7pcrsE'
    // const mapsApiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    console.log('API Key present:', !!mapsApiKey)
    console.log('API Key length:', mapsApiKey ? mapsApiKey.length : 0)
    console.log('API Key first 10 chars:', mapsApiKey ? mapsApiKey.substring(0, 10) + '...' : 'undefined')
    console.log('API Key raw value type:', typeof mapsApiKey)
    console.log('API Key === undefined:', mapsApiKey === undefined)
    console.log('API Key === "":', mapsApiKey === "")
    
    // Check process.env directly
    console.log('Direct process.env check:', !!process.env['NEXT_PUBLIC_GOOGLE_MAPS_API_KEY'])
    
    // Log all environment variables starting with NEXT_PUBLIC for debugging
    const nextPublicVars = Object.keys(process.env)
      .filter(key => key.startsWith('NEXT_PUBLIC_'))
      .reduce((obj, key) => {
        const val = process.env[key]
        console.log(`Raw env var ${key}:`, JSON.stringify(val))
        console.log(`Char codes for ${key}:`, val ? Array.from(val).slice(0, 15).map(c => c.charCodeAt(0)) : 'null')
        obj[key] = val ? `${val.substring(0, 10)}...` : 'undefined'
        return obj
      }, {} as Record<string, string>)
    console.log('All NEXT_PUBLIC_ vars:', nextPublicVars)
    
    // Try alternative access methods
    const altKey1 = process.env['NEXT_PUBLIC_GOOGLE_MAPS_API_KEY']
    const altKey2 = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    console.log('Alternative access 1 (bracket):', JSON.stringify(altKey1))
    console.log('Alternative access 2 (dot):', JSON.stringify(altKey2))
    
    if (!mapsApiKey) {
      console.error('[CONFIG API] Google Maps API key not configured in environment variables')
      return NextResponse.json(
        { error: 'Configuration unavailable' }, 
        { status: 503 }
      )
    }

    console.log('[CONFIG API] API key found, returning configuration')
    return NextResponse.json({
      mapsApiKey
    })
  } catch (error) {
    console.error('[CONFIG API] Configuration service error:', error)
    return NextResponse.json(
      { error: 'Configuration service error' }, 
      { status: 500 }
    )
  }
}