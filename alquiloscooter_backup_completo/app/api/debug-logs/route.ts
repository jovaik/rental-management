
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const logFilePath = path.join(process.cwd(), 'inspection_debug.log');

export async function GET(request: NextRequest) {
  try {
    if (fs.existsSync(logFilePath)) {
      const logs = fs.readFileSync(logFilePath, 'utf-8');
      return NextResponse.json({ 
        success: true, 
        logs: logs.split('\n').slice(-200) // Últimas 200 líneas
      });
    }
    return NextResponse.json({ success: true, logs: [] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    if (fs.existsSync(logFilePath)) {
      fs.unlinkSync(logFilePath);
    }
    return NextResponse.json({ success: true, message: 'Logs borrados' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
