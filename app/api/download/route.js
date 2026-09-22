import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  const possiblePaths = [
    path.join(process.cwd(), 'public', 'downloads', 'kaun-dega.apk'),
    path.join(process.cwd(), 'flutter_app', 'build', 'app', 'outputs', 'flutter-apk', 'app-release.apk'),
    path.join(process.cwd(), 'flutter_app', 'build', 'app', 'outputs', 'apk', 'release', 'app-release.apk'),
  ];

  for (const filePath of possiblePaths) {
    if (fs.existsSync(filePath)) {
      const fileBuffer = fs.readFileSync(filePath);
      return new NextResponse(fileBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.android.package-archive',
          'Content-Disposition': 'attachment; filename="kaun-dega.apk"',
          'Content-Length': fileBuffer.length.toString(),
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }
  }

  // Fallback if APK is not on filesystem
  return NextResponse.redirect('https://github.com/Rahulpal349/Kaun-Dega/releases', 307);
}
