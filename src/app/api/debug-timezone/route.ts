import { NextResponse } from 'next/server';

export async function GET() {
  const now = new Date();
  
  const timezoneDebug = {
    serverTime: {
      now: now.toISOString(),
      localString: now.toString(),
      timezoneOffset: now.getTimezoneOffset(), // Minutes offset from UTC
      timezoneName: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    environmentVariables: {
      TZ: process.env.TZ || 'not set',
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL || 'not set',
      VERCEL_ENV: process.env.VERCEL_ENV || 'not set'
    },
    dateConstructorTest: {
      localDate: new Date(2025, 6, 21, 17, 5, 0).toISOString(), // July 21, 2025 5:05 PM
      utcDate: new Date(Date.UTC(2025, 6, 21, 17, 5, 0)).toISOString()
    },
    timezoneTests: {
      pstViaLocale: now.toLocaleString("en-US", { timeZone: "America/Los_Angeles" }),
      utcViaLocale: now.toLocaleString("en-US", { timeZone: "UTC" }),
      estViaLocale: now.toLocaleString("en-US", { timeZone: "America/New_York" })
    }
  };
  
  return NextResponse.json(timezoneDebug, { status: 200 });
}