import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { role } = await request.json();
    const response = NextResponse.json({ flag: 1, message: 'Logged out' });

    if (role === 'admin') {
      response.cookies.set({
        name: 'admin_token',
        value: '',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 0,
        path: '/'
      });
    } else {
      response.cookies.set({
        name: 'dv_token',
        value: '',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 0,
        path: '/'
      });
    }

    return response;
  } catch (e) {
    return NextResponse.json({ flag: 0, message: 'Server error' });
  }
}
